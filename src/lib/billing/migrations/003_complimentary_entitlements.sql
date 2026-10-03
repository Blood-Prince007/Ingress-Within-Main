-- ==============================================================================
-- INGRESS WITHIN: 003_COMPLIMENTARY_ENTITLEMENTS.SQL
-- Migration: Permanent Complimentary Access Entitlements
-- ==============================================================================
-- 1. Concept:
--    Allows designated internal/complimentary accounts to have the entire
--    paid/subscription-gated application available at ?0 / without requiring payment.
-- 2. Security & Non-Elevation:
--    Complimentary billing access waives the subscription/payment requirement ONLY.
--    It does NOT grant admin roles, alter permissions, bypass therapist verification,
--    or weaken Row Level Security.
-- 3. Permanent Expiration:
--    expires_at = NULL (meaning no expiration date).
-- 4. Auditability:
--    Actions are recorded via public.admin_audit_logs with action
--    COMPLIMENTARY_ACCESS_GRANTED / COMPLIMENTARY_ACCESS_REVOKED.
-- 5. Revenue Integrity:
--    No fake Razorpay transactions or payment orders are inserted into revenue tables.
-- ==============================================================================

-- 1. Ensure source_type in public.entitlements supports 'grant' (already supported by 001)
-- Constraint verification:
-- source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('subscription', 'order', 'grant'))

-- 2. Comment documentation on entitlements table
COMMENT ON TABLE public.entitlements IS 'Stores feature access entitlements including paid subscriptions, module purchases, and internal complimentary grants (source_type=grant, valid_until=NULL for permanent access).';

-- 3. Ensure index for fast lookup of active permanent grants
CREATE INDEX IF NOT EXISTS idx_entitlements_user_grant_active
    ON public.entitlements (user_id, feature_key, is_active)
    WHERE valid_until IS NULL;
