import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '../../../../../lib/billing/billingService';
import { SessionBookingService } from '../../../../../lib/therapy/sessionBookingService';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-razorpay-signature header' },
        { status: 400 }
      );
    }

    const secret = BillingService.getWebhookSecret();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('[RazorpayWebhook] Signature mismatch');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const eventId = request.headers.get('x-razorpay-event-id') || event.payload?.payment?.entity?.id || event.id;

    console.log(`[RazorpayWebhook] Processing event: ${eventType} (id: ${eventId})`);

    // Idempotency check via webhook_events
    if (eventId) {
      try {
        const { supabase } = await import('../../../../../lib/db');
        const { data: existingEvent } = await supabase
          .from('webhook_events')
          .select('id, processed')
          .eq('event_id', eventId)
          .maybeSingle();

        if (existingEvent && existingEvent.processed) {
          console.log(`[RazorpayWebhook] Duplicate webhook event: ${eventId} already processed.`);
          return NextResponse.json({ status: 'ok', received: true, duplicate: true });
        }

        await supabase.from('webhook_events').upsert({
          event_id: eventId,
          event_type: eventType,
          payload: { event: eventType, created_at: event.created_at },
          processed: false,
        }, { onConflict: 'event_id' });
      } catch (evtErr: any) {
        // Table might be pending migration in dev, proceed safely
      }
    }

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const paymentId = paymentEntity?.id;
      const orderId = paymentEntity?.order_id;
      const bookingId = paymentEntity?.notes?.booking_id;

      if (paymentId) {
        await SessionBookingService.confirmSessionPayment({
          razorpayPaymentId: paymentId,
          razorpayOrderId: orderId,
          bookingId,
        });

        if (eventId) {
          try {
            const { supabase } = await import('../../../../../lib/db');
            await supabase
              .from('webhook_events')
              .update({ processed: true })
              .eq('event_id', eventId);
          } catch {
            // Ignore error
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (err: any) {
    console.error('[RazorpayWebhook] Error handling webhook:', err);
    // Return 200 to prevent Razorpay from endlessly retrying on internal logic errors
    return NextResponse.json({ status: 'error_logged', error: err.message }, { status: 200 });
  }
}
