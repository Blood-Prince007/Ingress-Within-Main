-- ==============================================================================
-- INGRESS WITHIN: MIGRATION 019 — PRODUCTION TRANSACTIONAL EMAIL SYSTEM
-- ==============================================================================
-- Scope:
--   1. Enhances public.email_deliveries with:
--      - Unique idempotency_key for deterministic deduplication
--      - Extended status check constraint: queued, sending, sent, delivered, failed, retrying, pending
--      - Extended recipient_type check constraint: client, therapist, team, admin
--      - Provider attribution (default: 'resend'), provider_message_id, delivery timestamps, error category
--   2. Extends public.therapist_profiles with authoritative contact_email
--   3. Extends public.therapist_applications with contact_email
--   4. Adds performance indexes on idempotency_key, provider_message_id, and delivery status
--   5. Configures strict Row Level Security (RLS) policies for administrative auditing
-- ==============================================================================

BEGIN;

-- 1. UPDATE EMAIL_DELIVERIES STATUS AND RECIPIENT_TYPE CONSTRAINTS
DO $$
BEGIN
    -- Update status constraint if exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'email_deliveries_status_check'
    ) THEN
        ALTER TABLE public.email_deliveries DROP CONSTRAINT email_deliveries_status_check;
    END IF;

    -- Update recipient_type constraint if exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'email_deliveries_recipient_type_check'
    ) THEN
        ALTER TABLE public.email_deliveries DROP CONSTRAINT email_deliveries_recipient_type_check;
    END IF;
END $$;

ALTER TABLE public.email_deliveries
    ADD CONSTRAINT email_deliveries_status_check
    CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'failed', 'retrying', 'pending'));

ALTER TABLE public.email_deliveries
    ADD CONSTRAINT email_deliveries_recipient_type_check
    CHECK (recipient_type IN ('client', 'therapist', 'team', 'admin'));

-- 2. EXTEND EMAIL_DELIVERIES COLUMNS
ALTER TABLE public.email_deliveries
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'resend',
    ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_error_category VARCHAR(100);

-- Unique index on idempotency_key to guarantee zero duplicate sends
CREATE UNIQUE INDEX IF NOT EXISTS uq_email_deliveries_idempotency_key
    ON public.email_deliveries (idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_deliv_provider_msg
    ON public.email_deliveries (provider_message_id)
    WHERE provider_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_deliv_status_created
    ON public.email_deliveries (status, created_at DESC);

-- 3. EXTEND THERAPIST_PROFILES AND THERAPIST_APPLICATIONS WITH CONTACT_EMAIL
ALTER TABLE public.therapist_profiles
    ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_therapist_profiles_contact_email
    ON public.therapist_profiles (contact_email);

ALTER TABLE public.therapist_applications
    ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_therapist_applications_contact_email
    ON public.therapist_applications (contact_email);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.email_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view email deliveries" ON public.email_deliveries;
CREATE POLICY "Admins can view email deliveries"
    ON public.email_deliveries FOR SELECT
    USING (
        auth.jwt() ->> 'role' = 'service_role' OR 
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'super_admin'
    );

DROP POLICY IF EXISTS "Service role manages email deliveries" ON public.email_deliveries;
CREATE POLICY "Service role manages email deliveries"
    ON public.email_deliveries FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

COMMIT;
