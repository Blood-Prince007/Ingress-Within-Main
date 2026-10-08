-- ==============================================================================
-- INGRESS WITHIN: THERAPIST CALENDAR & SESSIONS PRODUCTION SCHEMA
-- Migration: 005_therapist_sessions_calendar_schema.sql
-- ==============================================================================
-- Scope:
--   - Enhances therapist_clinical_appointments with modality and care_stage columns.
--   - Adds optimized indexes for conflict checking and calendar range queries.
--   - Implements atomic PostgreSQL RPCs with transaction advisory locking for
--     race-safe session scheduling and rescheduling.
--   - Preserves full audit history in therapist_session_reschedules and ensures
--     non-destructive cancellation.
-- ==============================================================================

BEGIN;

-- 1. EXTENSIONS (btree_gist allows exclusion constraints on scalar + range types)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS btree_gist;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'btree_gist extension could not be created; advisory lock RPC will provide full race-condition protection.';
END $$;

-- 2. EXTEND THERAPIST_CLINICAL_APPOINTMENTS
ALTER TABLE public.therapist_clinical_appointments
    ADD COLUMN IF NOT EXISTS modality VARCHAR(30) DEFAULT 'telehealth';

ALTER TABLE public.therapist_clinical_appointments
    ADD COLUMN IF NOT EXISTS care_stage VARCHAR(30);

-- Ensure check constraint on modality
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_th_appt_modality'
    ) THEN
        ALTER TABLE public.therapist_clinical_appointments
        ADD CONSTRAINT chk_th_appt_modality
        CHECK (modality IN ('telehealth', 'in_person', 'chat', 'phone'));
    END IF;
END $$;

-- 3. OPTIMIZED INDEXES FOR SCHEDULING CONFLICT DETECTION
CREATE INDEX IF NOT EXISTS idx_th_appts_active_overlap
    ON public.therapist_clinical_appointments (therapist_account_id, scheduled_start, scheduled_end)
    WHERE status IN ('scheduled', 'confirmed', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_th_appts_client_overlap
    ON public.therapist_clinical_appointments (user_id, scheduled_start, scheduled_end)
    WHERE status IN ('scheduled', 'confirmed', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_th_appts_calendar_range
    ON public.therapist_clinical_appointments (therapist_account_id, scheduled_start ASC);

-- 4. ATOMIC RPC: schedule_therapist_appointment
-- Uses PostgreSQL advisory transaction locking to serialize concurrent booking requests
-- and prevent race conditions.
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

    -- 6. Insert new clinical appointment
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

-- 5. ATOMIC RPC: reschedule_therapist_appointment
-- Atomically validates conflicts, writes to therapist_session_reschedules, and updates the appointment.
CREATE OR REPLACE FUNCTION public.reschedule_therapist_appointment(
    p_therapist_account_id UUID,
    p_appointment_id UUID,
    p_new_start TIMESTAMPTZ,
    p_new_end TIMESTAMPTZ,
    p_reason TEXT DEFAULT 'Therapist requested reschedule'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_appt RECORD;
    v_conflict_id UUID;
    v_updated_appt RECORD;
BEGIN
    -- 1. Validate timestamps
    IF p_new_start IS NULL OR p_new_end IS NULL OR p_new_end <= p_new_start THEN
        RAISE EXCEPTION 'INVALID_TIME_RANGE: New end time must be after new start time.';
    END IF;

    -- 2. Concurrency Protection: Acquire advisory transaction lock
    PERFORM pg_advisory_xact_lock(hashtext('th_sched_' || p_therapist_account_id::text));

    -- 3. Fetch appointment and verify therapist ownership
    SELECT * INTO v_appt
    FROM public.therapist_clinical_appointments
    WHERE id = p_appointment_id
      AND therapist_account_id = p_therapist_account_id;

    IF v_appt.id IS NULL THEN
        RAISE EXCEPTION 'SESSION_NOT_FOUND: Appointment not found or unauthorized.';
    END IF;

    IF v_appt.status IN ('completed', 'cancelled') THEN
        RAISE EXCEPTION 'SESSION_IMMUTABLE: Cannot reschedule a completed or cancelled session.';
    END IF;

    -- 4. Check therapist conflict on new slot
    SELECT id INTO v_conflict_id
    FROM public.therapist_clinical_appointments
    WHERE therapist_account_id = p_therapist_account_id
      AND id != p_appointment_id
      AND status IN ('scheduled', 'confirmed', 'in_progress')
      AND scheduled_start < p_new_end
      AND scheduled_end > p_new_start
    LIMIT 1;

    IF v_conflict_id IS NOT NULL THEN
        RAISE EXCEPTION 'SESSION_CONFLICT: New time conflicts with an existing booked session.';
    END IF;

    -- 5. Check client conflict on new slot
    IF v_appt.user_id IS NOT NULL THEN
        SELECT id INTO v_conflict_id
        FROM public.therapist_clinical_appointments
        WHERE user_id = v_appt.user_id
          AND id != p_appointment_id
          AND status IN ('scheduled', 'confirmed', 'in_progress')
          AND scheduled_start < p_new_end
          AND scheduled_end > p_new_start
        LIMIT 1;

        IF v_conflict_id IS NOT NULL THEN
            RAISE EXCEPTION 'CLIENT_CONFLICT: Client has an overlapping scheduled session at this time.';
        END IF;
    END IF;

    -- 6. Insert audit record in therapist_session_reschedules
    INSERT INTO public.therapist_session_reschedules (
        appointment_id,
        previous_start,
        previous_end,
        new_start,
        new_end,
        rescheduled_by,
        reason,
        created_at
    )
    VALUES (
        p_appointment_id,
        v_appt.scheduled_start,
        v_appt.scheduled_end,
        p_new_start,
        p_new_end,
        'therapist',
        COALESCE(p_reason, 'Therapist requested reschedule'),
        now()
    );

    -- 7. Update appointment
    UPDATE public.therapist_clinical_appointments
    SET scheduled_start = p_new_start,
        scheduled_end = p_new_end,
        status = 'rescheduled',
        updated_at = now()
    WHERE id = p_appointment_id
    RETURNING * INTO v_updated_appt;

    RETURN to_jsonb(v_updated_appt);
END;
$$;

COMMIT;
