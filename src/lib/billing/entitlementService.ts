import { supabase } from '../db';
import { ComplimentaryAccessService } from './complimentaryAccessService';

export class EntitlementService {
  /**
   * Checks if user has an active self-help subscription entitlement.
   */
  public static async hasActiveSubscription(userId: string): Promise<boolean> {
    if (!userId) return false;

    // Dedicated synthetic reviewer bypass for compliance verification testing
    if (userId === 'usr_synthetic_razorpay_reviewer' || userId === 'synthetic-reviewer-user') {
      return true;
    }

    // 1. Authoritative Complimentary Access Check
    if (await ComplimentaryAccessService.hasActiveComplimentaryAccess(userId)) {
      return true;
    }

    try {
      const { data: ent } = await supabase
        .from('entitlements')
        .select('*')
        .eq('user_id', userId)
        .eq('feature_key', 'self_help_subscription')
        .eq('is_active', true)
        .maybeSingle();

      if (ent) {
        if (!ent.valid_until || new Date(ent.valid_until) > new Date()) {
          return true;
        }
      }

      // 2. Check active subscription directly
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id, status, current_period_end')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (sub) {
        if (!sub.current_period_end || new Date(sub.current_period_end) > new Date()) {
          return true;
        }
      }
    } catch (e) {
      console.warn('[EntitlementService] Subscription check notice:', e);
    }

    return false;
  }

  /**
   * Checks if user has access to a psychoeducation module / workshop.
   * Modules and workshops are independent one-time purchases (never auto-unlocked by subscription).
   */
  public static async hasModuleAccess(userId: string, moduleId: string): Promise<boolean> {
    if (!userId) return false;

    // Dedicated synthetic reviewer bypass for compliance verification testing
    if (userId === 'usr_synthetic_razorpay_reviewer' || userId === 'synthetic-reviewer-user') {
      return true;
    }

    // Authoritative Complimentary Access Check (Waives paywall for complimentary accounts)
    if (await ComplimentaryAccessService.hasActiveComplimentaryAccess(userId)) {
      return true;
    }

    // Check single module purchase in entitlements
    try {
      const cleanModuleId = moduleId.toLowerCase().replace(/^module_/, '');
      const { data: ent } = await supabase
        .from('entitlements')
        .select('id')
        .eq('user_id', userId)
        .in('feature_key', [`module_${cleanModuleId}`, cleanModuleId, moduleId])
        .eq('is_active', true)
        .maybeSingle();

      if (ent) return true;
    } catch (e) {}

    return false;
  }

  /**
   * Returns list of all active feature keys for user.
   */
  public static async getUserEntitlements(userId: string): Promise<string[]> {
    if (!userId) return [];

    try {
      const { data: ents } = await supabase
        .from('entitlements')
        .select('feature_key, valid_until')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (!ents) return [];

      const now = new Date();
      return ents
        .filter((e) => !e.valid_until || new Date(e.valid_until) > now)
        .map((e) => e.feature_key);
    } catch (e) {
      return [];
    }
  }
}
