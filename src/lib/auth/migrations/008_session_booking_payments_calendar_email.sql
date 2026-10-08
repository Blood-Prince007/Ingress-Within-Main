-- ==============================================================================
-- INGRESS WITHIN: SESSION BOOKINGS, PAYMENTS, GOOGLE CALENDAR, & EMAIL SCHEMA
-- Migration: 008_session_booking_payments_calendar_email.sql
-- ==============================================================================
-- Scope:
--   - Creates therapy_session_bookings to decouple booking/payment state from clinical appointments.
--   - Creates google_calendar_connections for secure OAuth token storage and synchronization.
--   - Creates email_deliveries for centralized transactional email tracking and idempotency.
--   - Enhances therapist_clinical_appointments with Google Meet, Calendar, and payment tracking.
--   - Enhances therapy_care_relationships with first_session_completed tracker.
--   - Enforces strict multi-tenant Row Level Security and advisory-safe scheduling indexes.
-- ==============================================================================

BEGIN;

-- 1. THERAPY SESSION BOOKINGS (Decoupled Financial & Pre-session State)
CREATE TABLE IF NOT EXISTS public.therapy_session_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    therapist_account_id UUID NOT NULL REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    relationship_id UUID REFERENCES public.therapy_care_relationships(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.therapist_clinical_appointments(id) ON DELETE SET NULL,
    slot_start TIMESTAMPTZ NOT NULL,
    slot_end TIMESTAMPTZ NOT NULL,
    session_type VARCHAR(30) DEFAULT 'video',
    modality VARCHAR(30) DEFAULT 'telehealth',
    booking_type VARCHAR(30) NOT NULL CHECK (booking_type IN ('first_session', 'subsequent')),
    booking_status VARCHAR(30) NOT NULL DEFAULT 'pending_payment' CHECK (booking_status IN ('pending_payment', 'confirmed', 'cancelled', 'rescheduled', 'expired')),
    amount_paise INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refund_pending', 'refunded')),
    payment_method VARCHAR(50),
    expires_at TIMESTAMPTZ NOT NULL,
    cancellation_reason TEXT,
    refund_id VARCHAR(100),
    refund_amount_paise INTEGER,
    refund_status VARCHAR(30) DEFAULT 'none' CHECK (refund_status IN ('none', 'eligible', 'full', 'partial', 'denied', 'pending')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_th_bookings_user ON public.therapy_session_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_th_bookings_therapist ON public.therapy_session_bookings(therapist_account_id);
CREATE INDEX IF NOT EXISTS idx_th_bookings_rzp_order ON public.therapy_session_bookings(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_th_bookings_rzp_pay ON public.therapy_session_bookings(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_th_bookings_status ON public.therapy_session_bookings(booking_status, payment_status);

-- 2. GOOGLE CALENDAR CONNECTIONS (Encrypted OAuth Token Storage)
CREATE TABLE IF NOT EXISTS public.google_calendar_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('user', 'therapist')),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    therapist_account_id UUID REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    google_email VARCHAR(255) NOT NULL,
    google_account_id VARCHAR(255),
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT NOT NULL,
    token_expiry TIMESTAMPTZ,
    calendar_id VARCHAR(255) DEFAULT 'primary',
    sync_status VARCHAR(30) DEFAULT 'connected' CHECK (sync_status IN ('connected', 'revoked', 'error')),
    last_synced_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_google_cal_user UNIQUE (account_type, user_id),
    CONSTRAINT uq_google_cal_therapist UNIQUE (account_type, therapist_account_id)
);

CREATE INDEX IF NOT EXISTS idx_google_cal_user ON public.google_calendar_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_google_cal_therapist ON public.google_calendar_connections(therapist_account_id);

-- 3. EMAIL DELIVERIES (Centralized Transactional Email Auditing & Idempotency)
CREATE TABLE IF NOT EXISTS public.email_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('client', 'therapist', 'team')),
    recipient_id UUID,
    recipient_email VARCHAR(255) NOT NULL,
    template_key VARCHAR(100) NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    entity_type VARCHAR(50),
    entity_id UUID,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    attempt_count INTEGER DEFAULT 0,
    last_error TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_deliv_event ON public.email_deliveries(event_type);
CREATE INDEX IF NOT EXISTS idx_email_deliv_recipient ON public.email_deliveries(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_deliv_entity ON public.email_deliveries(entity_type, entity_id);

-- 4. EXTEND THERAPIST_CLINICAL_APPOINTMENTS
ALTER TABLE public.therapist_clinical_appointments
    ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.therapy_session_bookings(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT,
    ADD COLUMN IF NOT EXISTS google_meet_url TEXT,
    ADD COLUMN IF NOT EXISTS google_meet_conference_id TEXT,
    ADD COLUMN IF NOT EXISTS google_meet_status VARCHAR(30) DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS calendar_sync_status VARCHAR(30) DEFAULT 'not_connected',
    ADD COLUMN IF NOT EXISTS payment_id TEXT,
    ADD COLUMN IF NOT EXISTS attendance_status VARCHAR(30) DEFAULT 'scheduled',
    ADD COLUMN IF NOT EXISTS refund_status VARCHAR(30) DEFAULT 'none';

-- Add check constraint on attendance_status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_th_appt_attendance_status'
    ) THEN
        ALTER TABLE public.therapist_clinical_appointments
        ADD CONSTRAINT chk_th_appt_attendance_status
        CHECK (attendance_status IN ('scheduled', 'attended', 'client_no_show', 'therapist_no_show'));
    END IF;
END $$;

-- 5. EXTEND THERAPY_CARE_RELATIONSHIPS
ALTER TABLE public.therapy_care_relationships
    ADD COLUMN IF NOT EXISTS first_session_completed BOOLEAN DEFAULT FALSE;

-- 6. ROW LEVEL SECURITY POLICIES

-- therapy_session_bookings RLS
ALTER TABLE public.therapy_session_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookings" ON public.therapy_session_bookings;
CREATE POLICY "Users can view own bookings"
    ON public.therapy_session_bookings FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Therapists can view practice bookings" ON public.therapy_session_bookings;
CREATE POLICY "Therapists can view practice bookings"
    ON public.therapy_session_bookings FOR SELECT
    USING (therapist_account_id IN (
        SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
    ));

-- google_calendar_connections RLS
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

-- email_deliveries RLS
ALTER TABLE public.email_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and service role view emails" ON public.email_deliveries;
CREATE POLICY "Admins and service role view emails"
    ON public.email_deliveries FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

COMMIT;
