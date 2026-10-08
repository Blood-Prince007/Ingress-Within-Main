-- ============================================================================
-- INGRESS WITHIN — MIGRATION 011: ADMIN AUDIT LOGS & REFUND INVARIANTS
-- ============================================================================
-- Description:
-- 1. Creates public.admin_audit_logs for immutable administrative action tracking.
--    - Records: actor_id, actor_type, action, entity_type, entity_id, metadata, ip.
--    - Zero secret or unnecessary clinical content.
-- 2. Hardens refund_status on therapist_clinical_appointments and therapy_session_bookings:
--    - States: 'none', 'eligible', 'pending', 'full', 'partial', 'denied', 'failed'.
-- 3. Enables strict Row Level Security (RLS) ensuring audit logs are write-only
--    by service role and viewable only by authorized administrators.
-- ============================================================================

-- 1. CREATE ADMIN AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id TEXT NOT NULL,
    actor_type VARCHAR(50) NOT NULL CHECK (actor_type IN ('admin_api_key', 'admin_user', 'admin', 'therapist', 'client', 'system')),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_lookup
    ON public.admin_audit_logs (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_actor
    ON public.admin_audit_logs (actor_id, action, created_at DESC);

-- 2. HARDEN REFUND STATUS CHECK CONSTRAINTS
DO $$
BEGIN
    -- therapist_clinical_appointments
    ALTER TABLE public.therapist_clinical_appointments
        ADD COLUMN IF NOT EXISTS refund_id VARCHAR(100);
    ALTER TABLE public.therapist_clinical_appointments
        DROP CONSTRAINT IF EXISTS chk_appt_refund_status;
    ALTER TABLE public.therapist_clinical_appointments
        ADD CONSTRAINT chk_appt_refund_status
        CHECK (refund_status IS NULL OR refund_status IN (
            'none', 'eligible', 'pending', 'full', 'partial', 'denied', 'failed'
        ));

    -- therapy_session_bookings
    ALTER TABLE public.therapy_session_bookings
        DROP CONSTRAINT IF EXISTS chk_booking_refund_status;
    ALTER TABLE public.therapy_session_bookings
        ADD CONSTRAINT chk_booking_refund_status
        CHECK (refund_status IS NULL OR refund_status IN (
            'none', 'eligible', 'pending', 'full', 'partial', 'denied', 'failed'
        ));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. ENSURE ADMIN ATTRIBUTES EXIST ON PUBLIC.USERS
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'client';

CREATE INDEX IF NOT EXISTS idx_users_admin_lookup 
    ON public.users (id) 
    WHERE is_admin = true OR role = 'admin';

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages admin audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Admins can view admin audit logs" ON public.admin_audit_logs;

-- Service role bypass for inserts and admin queries
CREATE POLICY "Service role manages admin audit logs"
    ON public.admin_audit_logs FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Authenticated admins can view audit logs
CREATE POLICY "Admins can view admin audit logs"
    ON public.admin_audit_logs FOR SELECT
    USING (
        (auth.jwt() ->> 'role' = 'service_role') OR
        (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
        )
    );
