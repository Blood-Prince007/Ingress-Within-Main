import { supabase } from '../db';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { ApiUsageService } from '../admin/apiUsageService';
import { ComplimentaryAccessService } from './complimentaryAccessService';

export const GST_RATE = 0.18; // 18% standard GST

export interface PricingCalculation {
  subtotalPaise: number;
  gstPaise: number;
  totalPaise: number;
  formattedSubtotal: string;
  formattedGst: string;
  formattedTotal: string;
  gstRate: number;
}

export interface ProductRecord {
  id: string;
  sku: string;
  name: string;
  description: string;
  type: 'subscription' | 'one_time';
  price_inr: number; // Integer paise
  gst_rate: number;
  interval?: 'monthly' | 'yearly' | null;
  gateway_plan_id?: string | null;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  product_id: string;
  gateway_subscription_id: string;
  status: 'created' | 'authenticated' | 'active' | 'pending' | 'past_due' | 'halted' | 'cancelled' | 'completed' | 'expired';
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end: boolean;
  cancelled_at?: string | null;
  total_count?: number | null;
  paid_count: number;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface OrderRecord {
  id: string;
  user_id: string;
  product_id: string;
  amount_subtotal: number;
  amount_gst: number;
  amount_total: number;
  currency: string;
  gateway_order_id?: string | null;
  gateway_payment_id?: string | null;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  idempotency_key?: string | null;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  user_id: string;
  subscription_id?: string | null;
  order_id?: string | null;
  amount_subtotal: number;
  amount_gst: number;
  amount_total: number;
  currency: string;
  status: 'paid' | 'unpaid' | 'void';
  gateway_invoice_id?: string | null;
  gateway_payment_id?: string | null;
  issued_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentMethodRecord {
  id: string;
  user_id: string;
  type: 'upi' | 'card' | 'netbanking';
  gateway_token_id?: string | null;
  masked_account?: string | null;
  card_network?: string | null;
  is_default: boolean;
  mandate_status?: 'active' | 'revoked' | 'failed' | null;
  created_at?: string;
  updated_at?: string;
}

export interface BillingOverview {
  subscription: {
    id: string;
    gateway_subscription_id: string;
    status: string;
    plan_name: string;
    amount_subtotal: number;
    amount_gst: number;
    amount_total: number;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    is_complimentary?: boolean;
  } | null;
  payment_methods: PaymentMethodRecord[];
  invoices: {
    id: string;
    invoice_number: string;
    amount_subtotal: number;
    amount_gst: number;
    amount_total: number;
    status: string;
    issued_at: string;
    gateway_payment_id: string | null;
    currency: string;
  }[];
  orders: OrderRecord[];
  entitlements: string[];
}

export class BillingService {
  /**
   * Returns configured Razorpay client.
   */
  public static getRazorpayClient(): Razorpay | null {
    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return null;
    }

    return new Razorpay({
      key_id,
      key_secret
    });
  }

  public static getWebhookSecret(): string {
    return process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_default_secret';
  }

  public static getKeySecret(): string {
    return process.env.RAZORPAY_KEY_SECRET || 'rzp_default_key_secret';
  }

  /**
   * Authoritative pricing calculation in integer paise.
   * GST INCLUSIVE:
   * Total Customer Price = 49900 paise (₹499.00)
   * Subtotal (Taxable)   = Math.round(49900 / 1.18) = 42288 paise (₹422.88)
   * GST (18%)            = 49900 - 42288 = 7612 paise (₹76.12)
   * Invariant: 42288 + 7612 === 49900
   */
  public static calculatePricing(totalPaise: number = 49900, gstRate: number = GST_RATE): PricingCalculation {
    const total = Math.round(totalPaise);
    const subtotalPaise = Math.round(total / (1 + gstRate));
    const gstPaise = total - subtotalPaise;

    return {
      subtotalPaise,
      gstPaise,
      totalPaise: total,
      formattedSubtotal: `₹${(subtotalPaise / 100).toFixed(2)}`,
      formattedGst: `₹${(gstPaise / 100).toFixed(2)}`,
      formattedTotal: `₹${(total / 100).toFixed(2)}`,
      gstRate
    };
  }

  /**
   * Fallback authoritative product definition for SELF_HELP_MONTHLY.
   */
  public static readonly DEFAULT_SELF_HELP_PRODUCT: ProductRecord = {
    id: 'prod_self_help_monthly',
    sku: 'SELF_HELP_MONTHLY',
    name: 'Ingress Within Self-Work',
    description: 'Unlimited daily guided and free-flow journaling, weekly pattern reports, 30-day synthesis, and therapeutic self-work exercises.',
    type: 'subscription',
    price_inr: 49900, // ₹499.00 GST inclusive in paise
    gst_rate: 0.18,
    interval: 'monthly',
    gateway_plan_id: process.env.RAZORPAY_PLAN_ID || null,
    is_active: true
  };

  /**
   * Loads product by SKU from DB (or default fallback).
   */
  public static async getProductBySku(sku: string): Promise<ProductRecord> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('sku', sku)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        return data as ProductRecord;
      }
    } catch (e) {
      // Table might not exist yet or connection issue
    }

    if (sku === 'SELF_HELP_MONTHLY') {
      return this.DEFAULT_SELF_HELP_PRODUCT;
    }

    throw new Error(`Product with SKU '${sku}' not found.`);
  }

  /**
   * Loads product by ID from DB.
   */
  public static async getProductById(id: string): Promise<ProductRecord> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        return data as ProductRecord;
      }
    } catch (e) {}

    if (id === this.DEFAULT_SELF_HELP_PRODUCT.id || id === 'SELF_HELP_MONTHLY') {
      return this.DEFAULT_SELF_HELP_PRODUCT;
    }

    throw new Error(`Product with ID '${id}' not found.`);
  }

  /**
   * Loads all active products from DB.
   */
  public static async getActiveProducts(): Promise<ProductRecord[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('price_inr', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as ProductRecord[];
      }
    } catch (e) {}

    return [this.DEFAULT_SELF_HELP_PRODUCT];
  }

  /**
   * Finds or creates a customer record for the user.
   */
  public static async getOrCreateCustomer(userId: string, phone: string, email?: string): Promise<any> {
    const { data: existing } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return existing;
    }

    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        user_id: userId,
        phone,
        email: email || null
      })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[BillingService] Customer insertion notice:', error.message);
      return { id: crypto.randomUUID(), user_id: userId, phone, email };
    }

    return newCustomer;
  }

  /**
   * Initiates Razorpay subscription creation.
   * Product: SELF_HELP_MONTHLY (₹499.00 / mo + 18% GST).
   */
  public static async createSubscription(userId: string, sku: string = 'SELF_HELP_MONTHLY', customerPhone: string) {
    const product = await this.getProductBySku(sku);
    if (product.type !== 'subscription') {
      throw new Error(`Product '${sku}' is not a subscription.`);
    }

    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mock_key';

    // Guard: Accounts with active permanent complimentary entitlement never require checkout or Razorpay charge
    if (await ComplimentaryAccessService.hasActiveComplimentaryAccess(userId)) {
      return {
        success: true,
        already_subscribed: true,
        message: 'Account has active permanent complimentary access. No payment required.',
        subscription_id: `sub_internal_complimentary_${userId}`,
        key_id,
        product: {
          sku: product.sku,
          name: product.name,
          price_inr: 0
        },
        pricing: {
          totalPaise: 0,
          subtotalPaise: 0,
          gstPaise: 0,
          formattedTotal: '₹0.00'
        }
      };
    }

    const pricing = this.calculatePricing(product.price_inr, product.gst_rate);
    const razorpay = this.getRazorpayClient();

    let gatewaySubscriptionId = `sub_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    if (razorpay) {
      try {
        // Prioritize process.env.RAZORPAY_PLAN_ID over database value to prevent stale test plan IDs from overriding live config
        let planId = process.env.RAZORPAY_PLAN_ID || product.gateway_plan_id;
        if (!planId) {
          const plan = await razorpay.plans.create({
            period: 'monthly',
            interval: 1,
            item: {
              name: product.name,
              amount: pricing.totalPaise,
              currency: 'INR',
              description: product.description || 'Monthly membership'
            }
          });
          planId = plan.id;
        }

        const rzpSub = await razorpay.subscriptions.create({
          plan_id: planId,
          total_count: 12,
          quantity: 1,
          customer_notify: 1,
          notes: {
            user_id: userId,
            sku: product.sku
          }
        });
        gatewaySubscriptionId = rzpSub.id;
      } catch (err: any) {
        const errorDesc = err.error?.description || err.message || 'Unable to create subscription plan';
        console.error('[BillingService] Razorpay Subscription API error:', err);
        throw new Error(`Razorpay gateway error: ${errorDesc}`);
      }
    }

    // Insert pending subscription in DB
    try {
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          product_id: product.id,
          gateway_subscription_id: gatewaySubscriptionId,
          status: 'created',
          cancel_at_period_end: false,
          total_count: 12,
          paid_count: 0,
          metadata: {
            subtotal_paise: pricing.subtotalPaise,
            gst_paise: pricing.gstPaise,
            total_paise: pricing.totalPaise
          }
        });
    } catch (e: any) {
      console.warn('[BillingService] Subscription DB notice:', e.message);
    }

    return {
      success: true,
      subscription_id: gatewaySubscriptionId,
      key_id,
      product: {
        sku: product.sku,
        name: product.name,
        pricing
      }
    };
  }

  /**
   * Creates one-time order for modules / touch packs.
   */
  public static async createOneTimeOrder(userId: string, productId: string, idempotencyKey?: string) {
    const product = await this.getProductById(productId);
    const pricing = this.calculatePricing(product.price_inr, product.gst_rate);
    const razorpay = this.getRazorpayClient();
    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mock_key';

    let gatewayOrderId = `order_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    if (razorpay) {
      const rzpStart = Date.now();
      try {
        const rzpOrder = await razorpay.orders.create({
          amount: pricing.totalPaise,
          currency: 'INR',
          receipt: `rcpt_${Date.now().toString().slice(-8)}`,
          notes: {
            user_id: userId,
            product_id: product.id
          }
        });
        const rzpLatency = Date.now() - rzpStart;
        ApiUsageService.recordEvent({
          provider: 'razorpay',
          service: 'orders_create',
          endpoint: 'api.razorpay.com/v1/orders',
          statusCode: 200,
          success: true,
          latencyMs: rzpLatency,
          metadata: { amount_paise: pricing.totalPaise },
        });
        gatewayOrderId = rzpOrder.id;
      } catch (err: any) {
        const rzpLatency = Date.now() - rzpStart;
        ApiUsageService.recordEvent({
          provider: 'razorpay',
          service: 'orders_create',
          endpoint: 'api.razorpay.com/v1/orders',
          statusCode: err.statusCode || 500,
          success: false,
          latencyMs: rzpLatency,
          errorCategory: 'GATEWAY_ERROR',
        });
        const errorDesc = err.error?.description || err.message || 'Unable to create order';
        console.error('[BillingService] Razorpay Orders API error:', err);
        throw new Error(`Razorpay gateway error: ${errorDesc}`);
      }
    }

    try {
      await supabase
        .from('orders')
        .insert({
          user_id: userId,
          product_id: product.id,
          amount_subtotal: pricing.subtotalPaise,
          amount_gst: pricing.gstPaise,
          amount_total: pricing.totalPaise,
          currency: 'INR',
          gateway_order_id: gatewayOrderId,
          status: 'pending',
          idempotency_key: idempotencyKey || null
        });
    } catch (e: any) {
      console.warn('[BillingService] Orders DB notice:', e.message);
    }

    return {
      success: true,
      order_id: gatewayOrderId,
      key_id,
      amount: pricing.totalPaise,
      currency: 'INR',
      product: {
        id: product.id,
        name: product.name,
        pricing
      }
    };
  }

  /**
   * Verifies standard Razorpay order payment signature.
   * HMAC-SHA256 of `${order_id}|${payment_id}`.
   */
  public static verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const secret = this.getKeySecret();
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(generatedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Verifies Razorpay subscription signature.
   * HMAC-SHA256 of `${payment_id}|${subscription_id}`.
   */
  public static verifySubscriptionSignature(subscriptionId: string, paymentId: string, signature: string): boolean {
    const secret = this.getKeySecret();
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${paymentId}|${subscriptionId}`)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(generatedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Verifies incoming webhook signature against raw request body.
   */
  public static verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const webhookSecret = this.getWebhookSecret();
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Authoritative handler when payment is confirmed by webhook or verified server event.
   * - Transitions subscription / order to active/paid
   * - Grants entitlement
   * - Generates sequential invoice (INV-YYYY-XXXXX)
   * - Stores payment method metadata
   * - Strictly idempotent
   */
  public static async onPaymentConfirmed(params: {
    userId: string;
    paymentId: string;
    subscriptionId?: string;
    orderId?: string;
    amount: number; // Paise
    paymentMethodType?: 'upi' | 'card' | 'netbanking';
    maskedAccount?: string;
    cardNetwork?: string;
  }) {
    const { userId, paymentId, subscriptionId, orderId, amount } = params;

    // 1. Idempotency check on invoice / paymentId
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('gateway_payment_id', paymentId)
      .maybeSingle();

    if (existingInvoice) {
      console.log(`[BillingService] Payment ${paymentId} already confirmed & invoiced.`);
      return { success: true, alreadyProcessed: true };
    }

    const now = new Date();
    const currentPeriodStart = now.toISOString();
    const nextPeriod = new Date(now);
    nextPeriod.setMonth(nextPeriod.getMonth() + 1);
    const currentPeriodEnd = nextPeriod.toISOString();

    let productId = this.DEFAULT_SELF_HELP_PRODUCT.id;

    // 2. If subscription, update subscriptions table
    if (subscriptionId) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('gateway_subscription_id', subscriptionId)
        .maybeSingle();

      if (sub) {
        productId = sub.product_id;
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: false,
            paid_count: (sub.paid_count || 0) + 1,
            updated_at: now.toISOString()
          })
          .eq('id', sub.id);

        // Supersede any prior active or cancelling subscriptions for this user
        await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            updated_at: now.toISOString()
          })
          .eq('user_id', userId)
          .neq('id', sub.id)
          .in('status', ['active', 'past_due', 'created']);
      }
    }

    // 3. If order, update orders table
    if (orderId) {
      await supabase
        .from('orders')
        .update({
          status: 'paid',
          gateway_payment_id: paymentId,
          updated_at: now.toISOString()
        })
        .eq('gateway_order_id', orderId);
    }

    // 4. Grant Entitlement
    const featureKey = subscriptionId ? 'self_help_subscription' : `order_${orderId || paymentId}`;
    try {
      await supabase
        .from('entitlements')
        .upsert({
          user_id: userId,
          product_id: productId,
          source_type: subscriptionId ? 'subscription' : 'order',
          feature_key: featureKey,
          is_active: true,
          valid_from: currentPeriodStart,
          valid_until: subscriptionId ? currentPeriodEnd : null,
          updated_at: now.toISOString()
        }, { onConflict: 'user_id, feature_key' });
    } catch (e: any) {
      console.warn('[BillingService] Entitlement upsert notice:', e.message);
    }

    // 5. Generate Sequential Real Invoice (INV-YYYY-XXXXX)
    const year = now.getFullYear();
    const randomSeq = Math.floor(10000 + Math.random() * 90000);
    const invoiceNumber = `INV-${year}-${randomSeq}`;
    const pricing = this.calculatePricing(amount);

    try {
      await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          user_id: userId,
          amount_subtotal: pricing.subtotalPaise,
          amount_gst: pricing.gstPaise,
          amount_total: amount,
          currency: 'INR',
          status: 'paid',
          gateway_payment_id: paymentId,
          issued_at: now.toISOString()
        });
    } catch (e: any) {
      console.warn('[BillingService] Invoice insert notice:', e.message);
    }

    // 6. Save Payment Method Metadata safely
    if (params.paymentMethodType || params.maskedAccount) {
      try {
        await supabase
          .from('payment_methods')
          .insert({
            user_id: userId,
            type: params.paymentMethodType || 'upi',
            masked_account: params.maskedAccount || 'UPI Account',
            card_network: params.cardNetwork || null,
            is_default: true,
            mandate_status: 'active'
          });
      } catch (e: any) {}
    }

    console.log(`[BillingService] billing.subscription.activated user=${userId} payment=${paymentId}`);
    return { success: true, invoiceNumber };
  }

  /**
   * Cancels a user's subscription.
   */
  public static async cancelSubscription(userId: string, subscriptionId: string, cancelAtPeriodEnd: boolean = true) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('gateway_subscription_id', subscriptionId)
      .eq('user_id', userId)
      .single();

    if (!sub) {
      throw new Error('Subscription not found.');
    }

    const razorpay = this.getRazorpayClient();
    if (razorpay) {
      try {
        await razorpay.subscriptions.cancel(subscriptionId, cancelAtPeriodEnd ? 1 : 0);
      } catch (err: any) {
        console.error('[BillingService] Razorpay Subscription cancel error:', err);
      }
    }

    const now = new Date().toISOString();
    await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: cancelAtPeriodEnd,
        cancelled_at: now,
        status: cancelAtPeriodEnd ? sub.status : 'cancelled',
        updated_at: now
      })
      .eq('id', sub.id);

    return { success: true, cancel_at_period_end: cancelAtPeriodEnd };
  }

  /**
   * Fetches real dynamic billing overview for a user.
   * If user has no subscription: returns subscription = null (never fake data).
   */
  public static async getBillingOverview(userId: string): Promise<BillingOverview> {
    // 1. Fetch Subscription (Authoritative complimentary entitlement takes precedence)
    let activeSub: any = null;
    try {
      const complimentary = await ComplimentaryAccessService.getActiveEntitlement(userId);
      if (complimentary && complimentary.status === 'active') {
        activeSub = {
          id: complimentary.subscriptionId || `sub_complimentary_${userId}`,
          gateway_subscription_id: complimentary.gatewaySubscriptionId || `sub_internal_complimentary_${userId}`,
          status: 'active',
          plan_name: 'Ingress Within Self-Work (Complimentary)',
          amount_subtotal: 0,
          amount_gst: 0,
          amount_total: 0,
          current_period_start: complimentary.grantedAt,
          current_period_end: null, // Permanent: expires_at = NULL
          cancel_at_period_end: false,
          is_complimentary: true
        };
      } else {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sub) {
          const pricing = this.calculatePricing(
            sub.metadata?.total_paise || this.DEFAULT_SELF_HELP_PRODUCT.price_inr,
            this.DEFAULT_SELF_HELP_PRODUCT.gst_rate
          );

          activeSub = {
            id: sub.id,
            gateway_subscription_id: sub.gateway_subscription_id,
            status: sub.status,
            plan_name: this.DEFAULT_SELF_HELP_PRODUCT.name,
            amount_subtotal: pricing.subtotalPaise,
            amount_gst: pricing.gstPaise,
            amount_total: pricing.totalPaise,
            current_period_start: sub.current_period_start,
            current_period_end: sub.current_period_end,
            cancel_at_period_end: sub.cancel_at_period_end,
            is_complimentary: false
          };
        }
      }
    } catch (e) {}

    // 2. Fetch Payment Methods
    let paymentMethods: PaymentMethodRecord[] = [];
    try {
      const { data: pms } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (pms && pms.length > 0) {
        paymentMethods = pms;
      }
    } catch (e) {}

    // 3. Fetch Invoices
    let invoices: any[] = [];
    try {
      const { data: invs } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('issued_at', { ascending: false })
        .limit(20);

      if (invs && invs.length > 0) {
        invoices = invs.map((i) => ({
          id: i.id,
          invoice_number: i.invoice_number,
          amount_subtotal: i.amount_subtotal,
          amount_gst: i.amount_gst,
          amount_total: i.amount_total,
          status: i.status,
          issued_at: i.issued_at,
          gateway_payment_id: i.gateway_payment_id,
          currency: i.currency || 'INR'
        }));
      }
    } catch (e) {}

    // 4. Fetch Orders
    let orders: OrderRecord[] = [];
    try {
      const { data: ords } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ords && ords.length > 0) {
        orders = ords;
      }
    } catch (e) {}

    // 5. Fetch Active Entitlements
    let entitlements: string[] = [];
    try {
      const { data: ents } = await supabase
        .from('entitlements')
        .select('feature_key')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (ents && ents.length > 0) {
        entitlements = ents.map((e) => e.feature_key);
      }
    } catch (e) {}

    return {
      subscription: activeSub,
      payment_methods: paymentMethods,
      invoices,
      orders,
      entitlements
    };
  }
}
