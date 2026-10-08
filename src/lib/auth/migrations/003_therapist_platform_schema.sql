-- ==============================================================================
-- INGRESS WITHIN: THERAPIST PRODUCTION PLATFORM SCHEMA & ROW LEVEL SECURITY (RLS)
-- Migration: 003_therapist_platform_schema.sql
-- ==============================================================================
-- Scope:
--   - Extends therapist_accounts with practice authorization & application status.
--   - Extends therapist_profiles with clinical bio, credentials, and specialties.
--   - Creates therapist_applications for persistent multi-step onboarding.
--   - Creates therapy_care_relationships for clinical tenancy between therapist & client.
--   - Creates therapist_clinical_appointments for scheduled clinical sessions.
--   - Creates therapist_session_reschedules for non-destructive reschedule audits.
--   - Creates therapist_soap_notes for isolated clinical session documentation.
--   - Creates therapist_earnings for real transaction-based financial ledger.
--   - Creates therapist_availability_blocks for working hours and conflict checking.
--   - Creates therapist_notifications for clinical and application alerts.
--   - Strict RLS policies guaranteeing tenancy isolation and client privacy.
-- ==============================================================================

BEGIN;

-- 1. EXTEND THERAPIST_ACCOUNTS TABLE
ALTER TABLE public.therapist_accounts 
    ADD COLUMN IF NOT EXISTS can_practice BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.therapist_accounts 
    ADD COLUMN IF NOT EXISTS application_status VARCHAR(50) NOT NULL DEFAULT 'onboarding_incomplete';

ALTER TABLE public.therapist_accounts 
    ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) NOT NULL DEFAULT 'unverified';

ALTER TABLE public.therapist_accounts 
    ADD COLUMN IF NOT EXISTS rci_registered BOOLEAN DEFAULT false;

ALTER TABLE public.therapist_accounts 
    ADD COLUMN IF NOT EXISTS rci_number VARCHAR(100);

ALTER TABLE public.therapist_accounts 
    ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) DEFAULT 15.00;

ALTER TABLE public.therapist_accounts 
    ADD COLUMN IF NOT EXISTS per_session_fee NUMERIC(10,2) DEFAULT 1500.00;

-- Drop and recreate check constraints defensively
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_therapist_app_status'
    ) THEN
        ALTER TABLE public.therapist_accounts
        ADD CONSTRAINT chk_therapist_app_status 
        CHECK (application_status IN ('onboarding_incomplete', 'submitted', 'under_review', 'approved', 'rejected', 'suspended'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_therapist_verification_status'
    ) THEN
        ALTER TABLE public.therapist_accounts
        ADD CONSTRAINT chk_therapist_verification_status 
        CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_therapist_accounts_practice 
    ON public.therapist_accounts (can_practice, status);

CREATE INDEX IF NOT EXISTS idx_therapist_accounts_app_status 
    ON public.therapist_accounts (application_status);

-- 2. EXTEND THERAPIST_PROFILES TABLE
ALTER TABLE public.therapist_profiles 
    ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Consultant Psychologist';

ALTER TABLE public.therapist_profiles 
    ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';

ALTER TABLE public.therapist_profiles 
    ADD COLUMN IF NOT EXISTS qualification TEXT DEFAULT '';

ALTER TABLE public.therapist_profiles 
    ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;

ALTER TABLE public.therapist_profiles 
    ADD COLUMN IF NOT EXISTS specializations JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.therapist_profiles 
    ADD COLUMN IF NOT EXISTS languages JSONB NOT NULL DEFAULT '["English", "Hindi"]'::jsonb;

ALTER TABLE public.therapist_profiles 
    ADD COLUMN IF NOT EXISTS session_formats JSONB NOT NULL DEFAULT '["telehealth"]'::jsonb;

ALTER TABLE public.therapist_profiles 
    ADD COLUMN IF NOT EXISTS availability_hours JSONB NOT NULL DEFAULT '{"mon": ["09:00-17:00"], "tue": ["09:00-17:00"], "wed": ["09:00-17:00"], "thu": ["09:00-17:00"], "fri": ["09:00-17:00"]}'::jsonb;

ALTER TABLE public.therapist_profiles 
    ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

ALTER TABLE public.therapist_profiles 
    ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE public.therapist_profiles 
    ADD COLUMN IF NOT EXISTS state TEXT;

-- 3. THERAPIST APPLICATIONS TABLE (Persistent multi-step onboarding)
CREATE TABLE IF NOT EXISTS public.therapist_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_account_id UUID NOT NULL UNIQUE REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    step INTEGER NOT NULL DEFAULT 1,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID,
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_therapist_applications_account
    ON public.therapist_applications (therapist_account_id);

-- 4. THERAPY CARE RELATIONSHIPS TABLE (Clinical Tenancy)
CREATE TABLE IF NOT EXISTS public.therapy_care_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_account_id UUID NOT NULL REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    therapy_session_id UUID REFERENCES public.therapy_sessions(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'transferred', 'completed', 'terminated')),
    care_stage VARCHAR(30) NOT NULL DEFAULT 'intake' CHECK (care_stage IN ('intake', 'active_care', 'maintenance', 'completed')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_care_rel_therapist 
    ON public.therapy_care_relationships (therapist_account_id, status);

CREATE INDEX IF NOT EXISTS idx_care_rel_user 
    ON public.therapy_care_relationships (user_id, status);

-- 5. THERAPIST CLINICAL APPOINTMENTS TABLE (Booking/Session Management)
CREATE TABLE IF NOT EXISTS public.therapist_clinical_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_account_id UUID NOT NULL REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    relationship_id UUID REFERENCES public.therapy_care_relationships(id) ON DELETE SET NULL,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled' CHECK (status IN (
        'scheduled',
        'confirmed',
        'in_progress',
        'completed',
        'cancelled',
        'rescheduled',
        'no_show'
    )),
    session_type VARCHAR(30) NOT NULL DEFAULT 'video' CHECK (session_type IN ('video', 'audio', 'in_person')),
    meeting_link TEXT,
    client_notes TEXT,
    cancelled_by VARCHAR(30) CHECK (cancelled_by IS NULL OR cancelled_by IN ('therapist', 'client', 'system', 'admin')),
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_th_appointments_schedule 
    ON public.therapist_clinical_appointments (therapist_account_id, scheduled_start, scheduled_end);

CREATE INDEX IF NOT EXISTS idx_th_appointments_user 
    ON public.therapist_clinical_appointments (user_id, scheduled_start);

CREATE INDEX IF NOT EXISTS idx_th_appointments_status 
    ON public.therapist_clinical_appointments (status);

-- 6. THERAPIST SESSION RESCHEDULES TABLE (Preserve Reschedule History)
CREATE TABLE IF NOT EXISTS public.therapist_session_reschedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES public.therapist_clinical_appointments(id) ON DELETE CASCADE,
    previous_start TIMESTAMPTZ NOT NULL,
    previous_end TIMESTAMPTZ NOT NULL,
    new_start TIMESTAMPTZ NOT NULL,
    new_end TIMESTAMPTZ NOT NULL,
    rescheduled_by VARCHAR(30) NOT NULL DEFAULT 'therapist' CHECK (rescheduled_by IN ('therapist', 'client', 'admin')),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_th_reschedule_appt 
    ON public.therapist_session_reschedules (appointment_id, created_at DESC);

-- 7. THERAPIST SOAP NOTES TABLE (Clinical Documentation)
CREATE TABLE IF NOT EXISTS public.therapist_soap_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL UNIQUE REFERENCES public.therapist_clinical_appointments(id) ON DELETE CASCADE,
    therapist_account_id UUID NOT NULL REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subjective TEXT NOT NULL DEFAULT '',
    objective TEXT NOT NULL DEFAULT '',
    assessment TEXT NOT NULL DEFAULT '',
    plan TEXT NOT NULL DEFAULT '',
    is_draft BOOLEAN NOT NULL DEFAULT false,
    finalized_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_th_soap_therapist 
    ON public.therapist_soap_notes (therapist_account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_th_soap_user 
    ON public.therapist_soap_notes (user_id);

-- 8. THERAPIST EARNINGS TABLE (Real Payment Ledger)
CREATE TABLE IF NOT EXISTS public.therapist_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_account_id UUID NOT NULL REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.therapist_clinical_appointments(id) ON DELETE SET NULL,
    gross_amount NUMERIC(10,2) NOT NULL,
    platform_fee NUMERIC(10,2) NOT NULL,
    net_earnings NUMERIC(10,2) NOT NULL,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'collected' CHECK (payment_status IN (
        'collected',
        'pending',
        'refunded',
        'payout_scheduled',
        'paid'
    )),
    collected_at TIMESTAMPTZ DEFAULT now(),
    payout_batch_id TEXT,
    payout_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_th_earnings_lookup 
    ON public.therapist_earnings (therapist_account_id, payment_status, collected_at DESC);

-- 9. THERAPIST AVAILABILITY BLOCKS TABLE (Working Hours & Calendar Conflict Detection)
CREATE TABLE IF NOT EXISTS public.therapist_availability_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_account_id UUID NOT NULL REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT true,
    specific_date DATE,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_th_avail_lookup 
    ON public.therapist_availability_blocks (therapist_account_id, day_of_week);

-- 10. THERAPIST NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.therapist_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_account_id UUID NOT NULL REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_th_notifications_unread 
    ON public.therapist_notifications (therapist_account_id, is_read, created_at DESC);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.therapist_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapy_care_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapist_clinical_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapist_session_reschedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapist_soap_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapist_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapist_availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapist_notifications ENABLE ROW LEVEL SECURITY;

-- Applications: Therapists can view and update their own application
DROP POLICY IF EXISTS "Therapists can view own application" ON public.therapist_applications;
CREATE POLICY "Therapists can view own application"
    ON public.therapist_applications FOR SELECT
    USING (therapist_account_id IN (
        SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Therapists can update own application" ON public.therapist_applications;
CREATE POLICY "Therapists can update own application"
    ON public.therapist_applications FOR UPDATE
    USING (therapist_account_id IN (
        SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
    ))
    WITH CHECK (therapist_account_id IN (
        SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
    ));

-- Care Relationships: Therapists can view their relationships; clients can view theirs
DROP POLICY IF EXISTS "Therapists can view own care relationships" ON public.therapy_care_relationships;
CREATE POLICY "Therapists can view own care relationships"
    ON public.therapy_care_relationships FOR SELECT
    USING (therapist_account_id IN (
        SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Clients can view own care relationships" ON public.therapy_care_relationships;
CREATE POLICY "Clients can view own care relationships"
    ON public.therapy_care_relationships FOR SELECT
    USING (auth.uid() = user_id);

-- Appointments: Authorized parties can view their own appointments
DROP POLICY IF EXISTS "Therapists can view own appointments" ON public.therapist_clinical_appointments;
CREATE POLICY "Therapists can view own appointments"
    ON public.therapist_clinical_appointments FOR SELECT
    USING (therapist_account_id IN (
        SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Clients can view own appointments" ON public.therapist_clinical_appointments;
CREATE POLICY "Clients can view own appointments"
    ON public.therapist_clinical_appointments FOR SELECT
    USING (auth.uid() = user_id);

-- SOAP Notes: STRICTLY therapist-isolated; Clients NEVER have access
DROP POLICY IF EXISTS "Therapists can view own SOAP notes" ON public.therapist_soap_notes;
CREATE POLICY "Therapists can view own SOAP notes"
    ON public.therapist_soap_notes FOR SELECT
    USING (therapist_account_id IN (
        SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Therapists can manage own SOAP notes" ON public.therapist_soap_notes;
CREATE POLICY "Therapists can manage own SOAP notes"
    ON public.therapist_soap_notes FOR ALL
    USING (therapist_account_id IN (
        SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
    ))
    WITH CHECK (therapist_account_id IN (
        SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
    ));

-- Earnings: STRICTLY therapist-isolated
DROP POLICY IF EXISTS "Therapists can view own earnings" ON public.therapist_earnings;
CREATE POLICY "Therapists can view own earnings"
    ON public.therapist_earnings FOR SELECT
    USING (therapist_account_id IN (
        SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
    ));

-- Availability blocks: Therapists can manage their own availability
DROP POLICY IF EXISTS "Therapists can manage own availability" ON public.therapist_availability_blocks;
CREATE POLICY "Therapists can manage own availability"
    ON public.therapist_availability_blocks FOR ALL
    USING (therapist_account_id IN (
        SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
    ))
    WITH CHECK (therapist_account_id IN (
        SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
    ));

-- Notifications: Therapists can manage their own notifications
DROP POLICY IF EXISTS "Therapists can manage own notifications" ON public.therapist_notifications;
CREATE POLICY "Therapists can manage own notifications"
    ON public.therapist_notifications FOR ALL
    USING (therapist_account_id IN (
        SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
    ))
    WITH CHECK (therapist_account_id IN (
        SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
    ));

COMMIT;
