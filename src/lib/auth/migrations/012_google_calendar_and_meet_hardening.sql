-- ============================================================================
-- MIGRATION 012: GOOGLE CALENDAR & GOOGLE MEET PRODUCTION HARDENING
-- ============================================================================
-- Description:
--   1. Ensures strict database ownership on google_calendar_connections:
--      - account_type = 'user' requires user_id IS NOT NULL and therapist_account_id IS NULL
--      - account_type = 'therapist' requires therapist_account_id IS NOT NULL and user_id IS NULL
--   2. Ensures google_oauth_states exists with single-use, hash lookup, and TTL indexes.
--   3. Validates calendar_sync_status and google_meet_status check constraints on
--      therapist_clinical_appointments.
--   4. Configures Row Level Security ensuring clients and therapists can strictly
--      access only their own calendar connections.
-- ============================================================================

BEGIN;

-- 1. HARDEN GOOGLE_CALENDAR_CONNECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.google_calendar_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('user', 'therapist')),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    therapist_account_id UUID REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    google_email VARCHAR(255) NOT NULL,
    google_account_id VARCHAR(255),
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    token_expiry TIMESTAMPTZ,
    sync_status VARCHAR(30) NOT NULL DEFAULT 'connected' CHECK (sync_status IN ('connected', 'revoked', 'failed', 'expired')),
    last_synced_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure strict ownership check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_google_cal_ownership'
    ) THEN
        ALTER TABLE public.google_calendar_connections
        ADD CONSTRAINT chk_google_cal_ownership
        CHECK (
            (account_type = 'user' AND user_id IS NOT NULL AND therapist_account_id IS NULL)
            OR
            (account_type = 'therapist' AND therapist_account_id IS NOT NULL AND user_id IS NULL)
        );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_google_cal_user ON public.google_calendar_connections(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_google_cal_therapist ON public.google_calendar_connections(therapist_account_id) WHERE therapist_account_id IS NOT NULL;

-- Enable RLS on google_calendar_connections
ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own google cal" ON public.google_calendar_connections;
CREATE POLICY "Users can manage own google cal"
    ON public.google_calendar_connections FOR ALL
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Therapists can manage own google cal" ON public.google_calendar_connections;
CREATE POLICY "Therapists can manage own google cal"
    ON public.google_calendar_connections FOR ALL
    USING (therapist_account_id IN (
        SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Service role manages all calendar connections" ON public.google_calendar_connections;
CREATE POLICY "Service role manages all calendar connections"
    ON public.google_calendar_connections FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');


-- 2. HARDEN GOOGLE_OAUTH_STATES TABLE
CREATE TABLE IF NOT EXISTS public.google_oauth_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_hash TEXT UNIQUE NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('user', 'therapist')),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    therapist_account_id UUID REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    return_to TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_oauth_state_ownership CHECK (
        (account_type = 'user' AND user_id IS NOT NULL AND therapist_account_id IS NULL)
        OR
        (account_type = 'therapist' AND therapist_account_id IS NOT NULL AND user_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_google_oauth_state_hash ON public.google_oauth_states(state_hash);
CREATE INDEX IF NOT EXISTS idx_google_oauth_expires ON public.google_oauth_states(expires_at) WHERE used_at IS NULL;

ALTER TABLE public.google_oauth_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages oauth states" ON public.google_oauth_states;
CREATE POLICY "Service role manages oauth states"
    ON public.google_oauth_states FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');


-- 3. ENSURE APPOINTMENT GOOGLE INTEGRATION CONSTRAINTS
ALTER TABLE public.therapist_clinical_appointments
    ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT,
    ADD COLUMN IF NOT EXISTS google_meet_url TEXT,
    ADD COLUMN IF NOT EXISTS google_meet_conference_id TEXT,
    ADD COLUMN IF NOT EXISTS google_meet_status TEXT DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS calendar_sync_status TEXT DEFAULT 'not_connected';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_appointment_cal_sync_status'
    ) THEN
        ALTER TABLE public.therapist_clinical_appointments
        ADD CONSTRAINT chk_appointment_cal_sync_status
        CHECK (calendar_sync_status IS NULL OR calendar_sync_status IN ('not_connected', 'pending', 'synced', 'failed'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_appointment_google_meet_status'
    ) THEN
        ALTER TABLE public.therapist_clinical_appointments
        ADD CONSTRAINT chk_appointment_google_meet_status
        CHECK (google_meet_status IS NULL OR google_meet_status IN ('none', 'generating', 'created', 'failed', 'not_connected'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_appt_google_cal_event ON public.therapist_clinical_appointments(google_calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_appt_cal_sync_status ON public.therapist_clinical_appointments(calendar_sync_status);

COMMIT;
