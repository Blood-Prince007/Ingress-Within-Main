import { supabase } from '../db';
import { normalizePhoneNumber } from '../auth/phone';
import { AdminAuditService } from '../admin/adminAuditService';

export interface ComplimentaryEntitlement {
  id: string;
  userId: string;
  entitlementType: 'complimentary_access';
  status: 'active' | 'revoked' | 'inactive';
  source: 'internal';
  reason: string;
  grantedAt: string;
  grantedBy: string;
  expiresAt: null; // Permanent means NULL: never expires
  createdAt: string;
  updatedAt: string;
  subscriptionId?: string;
  gatewaySubscriptionId?: string;
}

export interface ProvisionResult {
  phone: string;
  normalizedPhone: string;
  userId: string | null;
  role: string | null;
  status: 'already_active' | 'newly_granted' | 'not_found' | 'ambiguous';
  entitlement: ComplimentaryEntitlement | null;
  error?: string;
}

export class ComplimentaryAccessService {
  public static readonly DEFAULT_PRODUCT_ID = 'd688ed27-d02f-45d4-a9bf-245d8f83fa24';
  public static readonly DEFAULT_REASON = 'permanent complimentary access';
  public static readonly FEATURE_KEY = 'self_help_subscription';

  /**
   * Retrieves active complimentary entitlement for a given internal user ID.
   * Resolves server-side from public.subscriptions and public.entitlements.
   * Returns null if no active complimentary entitlement is found.
   */
  public static async getActiveEntitlement(userId: string): Promise<ComplimentaryEntitlement | null> {
    if (!userId || typeof userId !== 'string') return null;

    try {
      // 1. Check subscriptions table for active internal subscription
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sub && sub.metadata?.source === 'internal' && sub.metadata?.status === 'active') {
        return {
          id: sub.id,
          userId: sub.user_id,
          entitlementType: 'complimentary_access',
          status: 'active',
          source: 'internal',
          reason: sub.metadata.reason || this.DEFAULT_REASON,
          grantedAt: sub.metadata.granted_at || sub.created_at,
          grantedBy: sub.metadata.granted_by || 'system_admin',
          expiresAt: null, // Permanent: expires_at is null
          createdAt: sub.created_at,
          updatedAt: sub.updated_at,
          subscriptionId: sub.id,
          gatewaySubscriptionId: sub.gateway_subscription_id
        };
      }

      // 2. Check entitlements table for permanent internal grant
      const { data: ent } = await supabase
        .from('entitlements')
        .select('*')
        .eq('user_id', userId)
        .eq('feature_key', this.FEATURE_KEY)
        .eq('source_type', 'grant')
        .eq('is_active', true)
        .is('valid_until', null)
        .maybeSingle();

      if (ent) {
        return {
          id: ent.id,
          userId: ent.user_id,
          entitlementType: 'complimentary_access',
          status: 'active',
          source: 'internal',
          reason: this.DEFAULT_REASON,
          grantedAt: ent.valid_from || ent.created_at,
          grantedBy: 'system_admin',
          expiresAt: null,
          createdAt: ent.created_at,
          updatedAt: ent.updated_at,
          subscriptionId: ent.source_id || undefined,
          gatewaySubscriptionId: `sub_internal_complimentary_${userId}`
        };
      }
    } catch (e) {
      console.warn('[ComplimentaryAccessService] getActiveEntitlement error:', e);
    }

    return null;
  }

  /**
   * Fast boolean check for active complimentary access.
   */
  public static async hasActiveComplimentaryAccess(userId: string): Promise<boolean> {
    const ent = await this.getActiveEntitlement(userId);
    return ent !== null && ent.status === 'active';
  }

  /**
   * Grants permanent complimentary access to an existing account.
   * Completely idempotent: rerunning does not create duplicate active entitlements.
   */
  public static async grantComplimentaryAccess(params: {
    userId: string;
    grantedBy: string;
    reason?: string;
  }): Promise<{ success: boolean; entitlement: ComplimentaryEntitlement; newlyCreated: boolean }> {
    const { userId, grantedBy, reason = this.DEFAULT_REASON } = params;

    if (!userId) {
      throw new Error('User ID is required to grant complimentary access.');
    }

    // 1. Verify user exists
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, phone_number, role, is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (userErr || !user) {
      throw new Error(`Target user '${userId}' not found.`);
    }

    // 2. Idempotency check: Return existing active entitlement if already granted
    const existing = await this.getActiveEntitlement(userId);
    if (existing && existing.status === 'active') {
      return {
        success: true,
        entitlement: existing,
        newlyCreated: false
      };
    }

    const nowIso = new Date().toISOString();
    const gatewaySubId = `sub_internal_complimentary_${userId}`;

    // 3. Upsert internal subscription record
    // Deactivate any superseded non-internal active subscriptions for this user
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: nowIso,
        updated_at: nowIso
      })
      .eq('user_id', userId)
      .eq('status', 'active')
      .neq('gateway_subscription_id', gatewaySubId);

    // Find or create internal complimentary subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('gateway_subscription_id', gatewaySubId)
      .maybeSingle();

    let subscriptionId = existingSub?.id;

    if (existingSub) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_start: nowIso,
          current_period_end: null, // Permanent: expires_at = NULL
          cancel_at_period_end: false,
          cancelled_at: null,
          paid_count: 0,
          metadata: {
            source: 'internal',
            reason,
            granted_at: nowIso,
            granted_by: grantedBy,
            expires_at: null,
            entitlement_type: 'complimentary_access',
            status: 'active'
          },
          updated_at: nowIso
        })
        .eq('id', existingSub.id);
    } else {
      const { data: newSub, error: subInsertErr } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          product_id: this.DEFAULT_PRODUCT_ID,
          gateway_subscription_id: gatewaySubId,
          status: 'active',
          current_period_start: nowIso,
          current_period_end: null, // Permanent: expires_at = NULL
          cancel_at_period_end: false,
          total_count: 12,
          paid_count: 0,
          metadata: {
            source: 'internal',
            reason,
            granted_at: nowIso,
            granted_by: grantedBy,
            expires_at: null,
            entitlement_type: 'complimentary_access',
            status: 'active'
          }
        })
        .select()
        .single();

      if (subInsertErr) {
        throw new Error(`Failed to create internal subscription: ${subInsertErr.message}`);
      }
      subscriptionId = newSub.id;
    }

    // 4. Upsert authoritative permanent grant in public.entitlements table
    const { error: entErr } = await supabase
      .from('entitlements')
      .upsert({
        user_id: userId,
        product_id: this.DEFAULT_PRODUCT_ID,
        source_type: 'grant',
        source_id: subscriptionId,
        feature_key: this.FEATURE_KEY,
        is_active: true,
        valid_from: nowIso,
        valid_until: null, // Permanent: expires_at = NULL
        updated_at: nowIso
      }, { onConflict: 'user_id, feature_key' });

    if (entErr) {
      throw new Error(`Failed to grant entitlement: ${entErr.message}`);
    }

    // 5. Admin Audit Log: COMPLIMENTARY_ACCESS_GRANTED
    try {
      await AdminAuditService.logAction({
        actorId: grantedBy,
        actorType: 'admin',
        action: 'COMPLIMENTARY_ACCESS_GRANTED',
        entityType: 'user_entitlement',
        entityId: userId,
        metadata: {
          target_user_id: userId,
          phone_number: user.phone_number,
          user_role: user.role,
          source: 'internal',
          reason,
          expires_at: null,
          granted_by: grantedBy,
          is_permanent: true
        }
      });
    } catch (e) {
      console.warn('[ComplimentaryAccessService] Audit log warning:', e);
    }

    const entitlement: ComplimentaryEntitlement = {
      id: subscriptionId || userId,
      userId,
      entitlementType: 'complimentary_access',
      status: 'active',
      source: 'internal',
      reason,
      grantedAt: nowIso,
      grantedBy,
      expiresAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      subscriptionId,
      gatewaySubscriptionId: gatewaySubId
    };

    return {
      success: true,
      entitlement,
      newlyCreated: true
    };
  }

  /**
   * Revokes complimentary access for a user.
   * Reverts account to standard billing requirements (Dormant or trial window).
   */
  public static async revokeComplimentaryAccess(params: {
    userId: string;
    revokedBy: string;
    reason?: string;
  }): Promise<{ success: boolean; message: string }> {
    const { userId, revokedBy, reason = 'Admin revoked complimentary entitlement' } = params;

    if (!userId) {
      throw new Error('User ID is required to revoke complimentary access.');
    }

    const nowIso = new Date().toISOString();
    const gatewaySubId = `sub_internal_complimentary_${userId}`;

    // 1. Deactivate subscription
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: nowIso,
        updated_at: nowIso,
        metadata: {
          source: 'internal',
          status: 'revoked',
          revoked_at: nowIso,
          revoked_by: revokedBy,
          revocation_reason: reason
        }
      })
      .eq('gateway_subscription_id', gatewaySubId);

    // 2. Deactivate entitlement
    await supabase
      .from('entitlements')
      .update({
        is_active: false,
        valid_until: nowIso,
        updated_at: nowIso
      })
      .eq('user_id', userId)
      .eq('feature_key', this.FEATURE_KEY)
      .eq('source_type', 'grant');

    // 3. Admin Audit Log: COMPLIMENTARY_ACCESS_REVOKED
    try {
      await AdminAuditService.logAction({
        actorId: revokedBy,
        actorType: 'admin',
        action: 'COMPLIMENTARY_ACCESS_REVOKED',
        entityType: 'user_entitlement',
        entityId: userId,
        metadata: {
          target_user_id: userId,
          revoked_by: revokedBy,
          reason,
          revoked_at: nowIso
        }
      });
    } catch (e) {
      console.warn('[ComplimentaryAccessService] Audit log warning:', e);
    }

    return {
      success: true,
      message: 'Complimentary access successfully revoked. Normal billing logic now applies.'
    };
  }

  /**
   * Provisions multiple accounts safely by normalized phone number.
   * Adheres strictly to the application's phone normalization rules.
   * Refuses to guess if ambiguous or account is not found.
   */
  public static async provisionAccountsByPhone(
    phones: string[],
    grantedBy: string = 'system_admin',
    reason: string = 'permanent complimentary access'
  ): Promise<ProvisionResult[]> {
    const results: ProvisionResult[] = [];

    for (const rawPhone of phones) {
      const normalized = normalizePhoneNumber(rawPhone);
      if (!normalized) {
        results.push({
          phone: rawPhone,
          normalizedPhone: '',
          userId: null,
          role: null,
          status: 'not_found',
          entitlement: null,
          error: `Phone number '${rawPhone}' could not be normalized to valid Indian E.164 (+91).`
        });
        continue;
      }

      // Query database by exact normalized phone
      const { data: users, error: qErr } = await supabase
        .from('users')
        .select('id, phone_number, role, name')
        .eq('phone_number', normalized);

      if (qErr) {
        results.push({
          phone: rawPhone,
          normalizedPhone: normalized,
          userId: null,
          role: null,
          status: 'not_found',
          entitlement: null,
          error: `Database query error: ${qErr.message}`
        });
        continue;
      }

      if (!users || users.length === 0) {
        results.push({
          phone: rawPhone,
          normalizedPhone: normalized,
          userId: null,
          role: null,
          status: 'not_found',
          entitlement: null,
          error: `No existing account found with phone number ${normalized}.`
        });
        continue;
      }

      if (users.length > 1) {
        results.push({
          phone: rawPhone,
          normalizedPhone: normalized,
          userId: null,
          role: null,
          status: 'ambiguous',
          entitlement: null,
          error: `Ambiguity detected: ${users.length} accounts match phone number ${normalized}. Provisioning aborted for this number.`
        });
        continue;
      }

      const user = users[0];
      const existing = await this.getActiveEntitlement(user.id);

      if (existing && existing.status === 'active') {
        results.push({
          phone: rawPhone,
          normalizedPhone: normalized,
          userId: user.id,
          role: user.role,
          status: 'already_active',
          entitlement: existing
        });
        continue;
      }

      // Create permanent entitlement
      const grantResult = await this.grantComplimentaryAccess({
        userId: user.id,
        grantedBy,
        reason
      });

      results.push({
        phone: rawPhone,
        normalizedPhone: normalized,
        userId: user.id,
        role: user.role,
        status: grantResult.newlyCreated ? 'newly_granted' : 'already_active',
        entitlement: grantResult.entitlement
      });
    }

    return results;
  }

  /**
   * Lists all active complimentary entitlements for admin inspection.
   */
  public static async listComplimentaryEntitlements(): Promise<ComplimentaryEntitlement[]> {
    try {
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active');

      if (!subs) return [];

      const list: ComplimentaryEntitlement[] = [];
      for (const sub of subs) {
        if (sub.metadata?.source === 'internal' && sub.metadata?.status === 'active') {
          list.push({
            id: sub.id,
            userId: sub.user_id,
            entitlementType: 'complimentary_access',
            status: 'active',
            source: 'internal',
            reason: sub.metadata.reason || this.DEFAULT_REASON,
            grantedAt: sub.metadata.granted_at || sub.created_at,
            grantedBy: sub.metadata.granted_by || 'system_admin',
            expiresAt: null,
            createdAt: sub.created_at,
            updatedAt: sub.updated_at,
            subscriptionId: sub.id,
            gatewaySubscriptionId: sub.gateway_subscription_id
          });
        }
      }

      return list;
    } catch (e) {
      console.warn('[ComplimentaryAccessService] listComplimentaryEntitlements error:', e);
      return [];
    }
  }
}
