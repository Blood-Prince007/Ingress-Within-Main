-- ==============================================================================
-- INGRESS WITHIN: THERAPIST PLATFORM & CALENDAR PRODUCTION HARDENING
-- Migration: 009_therapist_platform_production_hardening.sql
-- ==============================================================================
-- Scope:
--   - Creates google_oauth_states table for server-side, single-use, cryptographically
--     random, short-lived OAuth state management.
--   - Enforces strict mutual exclusion on account ownership (user vs therapist)
--     at the database level for both oauth states and calendar connections.
--   - Enables Row Level Security on google_oauth_states (service_role only).
--   - Hardens schedule_therapist_appointment RPC to eliminate fabricated meeting URLs.
-- ==============================================================================

BEGIN;

-- 1. SERVER-SIDE OAUTH STATE TABLE
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

CREATE INDEX IF NOT EXISTS idx_google_oauth_state_hash 
    ON public.google_oauth_states(state_hash);

CREATE INDEX IF NOT EXISTS idx_google_oauth_expires 
    ON public.google_oauth_states(expires_at) 
    WHERE used_at IS NULL;

-- Enable RLS: Strictly internal/service_role only. No direct client access.
ALTER TABLE public.google_oauth_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages oauth states" ON public.google_oauth_states;
CREATE POLICY "Service role manages oauth states"
    ON public.google_oauth_states FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');


-- 2. HARDEN GOOGLE CALENDAR CONNECTIONS OWNERSHIP CONSTRAINT
-- Ensure user_id and therapist_account_id cannot be simultaneously set or both null
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


-- 3. HARDEN schedule_therapist_appointment RPC (NO FABRICATED MEETING LINKS)
CREATE OR REPLACE FUNCTION public.schedule_therapist_appointment(
    p_therapist_account_id UUID,
    p_user_id UUID,
    p_scheduled_start TIMESTAMPTZ,
    p_scheduled_end TIMESTAMPTZ,
    p_session_type VARCHAR(30) DEFAULT 'video',
    p_modality VARCHAR(30) DEFAULT 'telehealth',
    p_meeting_link TEXT DEFAULT NULL,
    p_client_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rel_id UUID;
    v_care_stage VARCHAR(30);
    v_new_appt RECORD;
    v_conflict_id UUID;
BEGIN
    -- 1. Validate timestamps
    IF p_scheduled_start IS NULL OR p_scheduled_end IS NULL OR p_scheduled_end <= p_scheduled_start THEN
        RAISE EXCEPTION 'INVALID_TIME_RANGE: Scheduled end time must be after scheduled start time.';
    END IF;

    -- 2. Concurrency Protection: Acquire advisory transaction locks on therapist and client
    PERFORM pg_advisory_xact_lock(hashtext('th_sched_' || p_therapist_account_id::text));
    PERFORM pg_advisory_xact_lock(hashtext('cl_sched_' || p_user_id::text));

    -- 3. Verify active care relationship
    SELECT id, care_stage INTO v_rel_id, v_care_stage
    FROM public.therapy_care_relationships
    WHERE therapist_account_id = p_therapist_account_id
      AND user_id = p_user_id
      AND status = 'active'
    LIMIT 1;

    IF v_rel_id IS NULL THEN
        RAISE EXCEPTION 'CLIENT_NOT_AUTHORIZED: Client does not have an active care relationship with this therapist.';
    END IF;

    -- Terminal stage invariant
    IF v_care_stage = 'completed' THEN
        RAISE EXCEPTION 'RELATIONSHIP_TERMINATED: Cannot schedule appointments for a completed care relationship.';
    END IF;

    -- 4. Check for overlapping therapist appointments
    SELECT id INTO v_conflict_id
    FROM public.therapist_clinical_appointments
    WHERE therapist_account_id = p_therapist_account_id
      AND status IN ('scheduled', 'confirmed', 'in_progress')
      AND scheduled_start < p_scheduled_end
      AND scheduled_end > p_scheduled_start
    LIMIT 1;

    IF v_conflict_id IS NOT NULL THEN
        RAISE EXCEPTION 'SESSION_CONFLICT: Time conflicts with an existing booked session.';
    END IF;

    -- 5. Check for overlapping client appointments
    SELECT id INTO v_conflict_id
    FROM public.therapist_clinical_appointments
    WHERE user_id = p_user_id
      AND status IN ('scheduled', 'confirmed', 'in_progress')
      AND scheduled_start < p_scheduled_end
      AND scheduled_end > p_scheduled_start
    LIMIT 1;

    IF v_conflict_id IS NOT NULL THEN
        RAISE EXCEPTION 'CLIENT_CONFLICT: Client has an overlapping scheduled session.';
    END IF;

    -- 6. Insert new clinical appointment (NO FABRICATED MEETING LINK)
    INSERT INTO public.therapist_clinical_appointments (
        therapist_account_id,
        user_id,
        relationship_id,
        scheduled_start,
        scheduled_end,
        status,
        session_type,
        modality,
        meeting_link,
        client_notes,
        care_stage,
        created_at,
        updated_at
    )
    VALUES (
        p_therapist_account_id,
        p_user_id,
        v_rel_id,
        p_scheduled_start,
        p_scheduled_end,
        'scheduled',
        COALESCE(p_session_type, 'video'),
        COALESCE(p_modality, 'telehealth'),
        p_meeting_link,
        p_client_notes,
        v_care_stage,
        now(),
        now()
    )
    RETURNING * INTO v_new_appt;

    RETURN to_jsonb(v_new_appt);
END;
$$;

COMMIT;
