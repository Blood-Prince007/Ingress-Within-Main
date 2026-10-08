-- =============================================================================
-- INGRESS WITHIN: THERAPY MODULE
-- Migration: 001_therapy_schema.sql
--
-- Purpose:
--   Persistent storage for the Therapy intake/conversation journeys.
--
-- Important:
--   - Does NOT modify existing users, profiles, therapist_accounts,
--     therapist_profiles, or therapist_sessions tables.
--   - User ownership is enforced with user_id foreign keys and RLS.
--   - Therapist references use existing therapist_accounts(id).
--   - AI processing, clinical triage decisions, and matching logic remain
--     application/service responsibilities.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. THERAPY SESSIONS
-- One record represents one Therapy journey/session for a user.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.therapy_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES public.users(id) ON DELETE CASCADE,

    journey_type VARCHAR(30) NOT NULL
        CHECK (journey_type IN ('conversation', 'guided', 'team')),

    status VARCHAR(30) NOT NULL DEFAULT 'active'
        CHECK (status IN (
            'active',
            'completed',
            'submitted',
            'abandoned',
            'closed'
        )),

    current_step INTEGER NOT NULL DEFAULT 0,

    triage_level VARCHAR(20)
        CHECK (triage_level IN (
            'standard',
            'priority',
            'immediate'
        )),

    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_therapy_sessions_user
    ON public.therapy_sessions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_therapy_sessions_status
    ON public.therapy_sessions (status, last_activity_at DESC);

-- -----------------------------------------------------------------------------
-- 2. THERAPY INTAKES
-- Stores structured intake/contact information for a Therapy session.
-- answers JSONB keeps the guided-form structure extensible without repeatedly
-- changing the database schema.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.therapy_intakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    therapy_session_id UUID NOT NULL UNIQUE
        REFERENCES public.therapy_sessions(id) ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES public.users(id) ON DELETE CASCADE,

    full_name TEXT,
    email TEXT,
    phone_number VARCHAR(30),

    age INTEGER
        CHECK (age IS NULL OR (age >= 18 AND age <= 120)),

    gender TEXT,
    occupation TEXT,
    city TEXT,
    living_situation TEXT,

    presenting_reason TEXT,
    concerns JSONB NOT NULL DEFAULT '[]'::jsonb,
    affected_life_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    own_words TEXT,

    mental_health_history JSONB NOT NULL DEFAULT '{}'::jsonb,
    coping_and_support JSONB NOT NULL DEFAULT '{}'::jsonb,
    expectations JSONB NOT NULL DEFAULT '{}'::jsonb,

    contact_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    consents JSONB NOT NULL DEFAULT '{}'::jsonb,

    answers JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_therapy_intakes_user
    ON public.therapy_intakes (user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 3. THERAPY MESSAGES
-- Conversation journey messages.
-- Content is server-persisted; browser must not call the AI provider directly.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.therapy_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    therapy_session_id UUID NOT NULL
        REFERENCES public.therapy_sessions(id) ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES public.users(id) ON DELETE CASCADE,

    role VARCHAR(20) NOT NULL
        CHECK (role IN ('user', 'assistant', 'system')),

    content TEXT NOT NULL,

    sequence_number INTEGER NOT NULL,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_therapy_message_sequence
        UNIQUE (therapy_session_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_therapy_messages_session
    ON public.therapy_messages (therapy_session_id, sequence_number);

CREATE INDEX IF NOT EXISTS idx_therapy_messages_user
    ON public.therapy_messages (user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 4. THERAPY SAFETY ASSESSMENTS
-- Stores the safety answers/results associated with a Therapy session.
--
-- The application/service layer remains responsible for evaluating answers.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.therapy_safety_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    therapy_session_id UUID NOT NULL UNIQUE
        REFERENCES public.therapy_sessions(id) ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES public.users(id) ON DELETE CASCADE,

    safety_status VARCHAR(30) NOT NULL DEFAULT 'not_assessed'
        CHECK (safety_status IN (
            'not_assessed',
            'negative',
            'positive',
            'declined'
        )),

    triage_level VARCHAR(20)
        CHECK (triage_level IN (
            'standard',
            'priority',
            'immediate'
        )),

    recent_timing TEXT,
    plan_or_means TEXT,
    prior_attempt TEXT,
    physical_safety TEXT,
    psychiatric_care TEXT,

    answers JSONB NOT NULL DEFAULT '{}'::jsonb,

    evaluated_by VARCHAR(30)
        CHECK (evaluated_by IN (
            'deterministic',
            'ai',
            'hybrid',
            'human'
        )),

    evaluation_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    evaluated_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_therapy_safety_user
    ON public.therapy_safety_assessments (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_therapy_safety_triage
    ON public.therapy_safety_assessments (triage_level, created_at DESC);

-- -----------------------------------------------------------------------------
-- 5. THERAPY MATCHES
-- Stores therapist candidates generated after intake/triage.
-- therapist_account_id references the EXISTING therapist system.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.therapy_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    therapy_session_id UUID NOT NULL
        REFERENCES public.therapy_sessions(id) ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES public.users(id) ON DELETE CASCADE,

    therapist_account_id UUID
        REFERENCES public.therapist_accounts(id) ON DELETE SET NULL,

    match_status VARCHAR(30) NOT NULL DEFAULT 'candidate'
        CHECK (match_status IN (
            'candidate',
            'shortlisted',
            'selected',
            'rejected',
            'unavailable'
        )),

    match_rank INTEGER,

    match_score NUMERIC(6,3),

    match_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,

    matching_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_therapy_matches_session
    ON public.therapy_matches (therapy_session_id, match_rank);

CREATE INDEX IF NOT EXISTS idx_therapy_matches_therapist
    ON public.therapy_matches (therapist_account_id, match_status);

CREATE INDEX IF NOT EXISTS idx_therapy_matches_user
    ON public.therapy_matches (user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 6. THERAPY SUBMISSIONS
-- Records the user's final request to the team.
-- No booking is implied by this record.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.therapy_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    therapy_session_id UUID NOT NULL UNIQUE
        REFERENCES public.therapy_sessions(id) ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES public.users(id) ON DELETE CASCADE,

    submission_type VARCHAR(30) NOT NULL
        CHECK (submission_type IN (
            'conversation',
            'guided',
            'team'
        )),

    submission_status VARCHAR(30) NOT NULL DEFAULT 'submitted'
        CHECK (submission_status IN (
            'submitted',
            'under_review',
            'contacted',
            'closed'
        )),

    callback_preference TEXT,

    notes TEXT,

    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_therapy_submissions_user
    ON public.therapy_submissions (user_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_therapy_submissions_status
    ON public.therapy_submissions (submission_status, submitted_at DESC);

-- -----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- Users can only access their own Therapy records.
-- Server-side service-role operations can still perform controlled writes.
-- -----------------------------------------------------------------------------

ALTER TABLE public.therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapy_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapy_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapy_safety_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapy_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapy_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own therapy sessions"
    ON public.therapy_sessions;

CREATE POLICY "Users can read own therapy sessions"
    ON public.therapy_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own therapy intakes"
    ON public.therapy_intakes;

CREATE POLICY "Users can read own therapy intakes"
    ON public.therapy_intakes
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own therapy messages"
    ON public.therapy_messages;

CREATE POLICY "Users can read own therapy messages"
    ON public.therapy_messages
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own therapy safety assessments"
    ON public.therapy_safety_assessments;

CREATE POLICY "Users can read own therapy safety assessments"
    ON public.therapy_safety_assessments
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own therapy matches"
    ON public.therapy_matches;

CREATE POLICY "Users can read own therapy matches"
    ON public.therapy_matches
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own therapy submissions"
    ON public.therapy_submissions;

CREATE POLICY "Users can read own therapy submissions"
    ON public.therapy_submissions
    FOR SELECT
    USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 8. UPDATED_AT HELPER
-- Reuses a shared trigger function if the project already has one.
-- If not present, this migration creates a Therapy-specific helper.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_therapy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_therapy_sessions_updated_at
    ON public.therapy_sessions;

CREATE TRIGGER trg_therapy_sessions_updated_at
    BEFORE UPDATE ON public.therapy_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_therapy_updated_at();

DROP TRIGGER IF EXISTS trg_therapy_intakes_updated_at
    ON public.therapy_intakes;

CREATE TRIGGER trg_therapy_intakes_updated_at
    BEFORE UPDATE ON public.therapy_intakes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_therapy_updated_at();

DROP TRIGGER IF EXISTS trg_therapy_safety_updated_at
    ON public.therapy_safety_assessments;

CREATE TRIGGER trg_therapy_safety_updated_at
    BEFORE UPDATE ON public.therapy_safety_assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_therapy_updated_at();

DROP TRIGGER IF EXISTS trg_therapy_matches_updated_at
    ON public.therapy_matches;

CREATE TRIGGER trg_therapy_matches_updated_at
    BEFORE UPDATE ON public.therapy_matches
    FOR EACH ROW
    EXECUTE FUNCTION public.set_therapy_updated_at();

DROP TRIGGER IF EXISTS trg_therapy_submissions_updated_at
    ON public.therapy_submissions;

CREATE TRIGGER trg_therapy_submissions_updated_at
    BEFORE UPDATE ON public.therapy_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_therapy_updated_at();

COMMIT;
