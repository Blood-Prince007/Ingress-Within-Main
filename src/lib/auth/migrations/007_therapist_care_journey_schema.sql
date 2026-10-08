-- ==============================================================================
-- INGRESS WITHIN: THERAPIST CARE JOURNEY & STAGE TRANSITION SCHEMA
-- Migration: 007_therapist_care_journey_schema.sql
-- ==============================================================================
-- Scope:
--   - Creates public.therapy_care_stage_history table for immutable longitudinal audit.
--   - Enforces RLS: strictly therapist-isolated; clients NEVER have access.
--   - Implements atomic transactional RPC therapist_transition_care_stage_atomic
--   - Hardens therapist_schedule_appointment_atomic to reject scheduling on terminal care.
-- ==============================================================================

BEGIN;

-- 1. THERAPY CARE STAGE HISTORY TABLE (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS public.therapy_care_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id UUID NOT NULL REFERENCES public.therapy_care_relationships(id) ON DELETE CASCADE,
    therapist_account_id UUID NOT NULL REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    previous_stage VARCHAR(30) NOT NULL CHECK (previous_stage IN ('intake', 'active_care', 'maintenance', 'completed')),
    new_stage VARCHAR(30) NOT NULL CHECK (new_stage IN ('intake', 'active_care', 'maintenance', 'completed')),
    changed_by UUID NOT NULL REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance and chronological retrieval
CREATE INDEX IF NOT EXISTS idx_care_stage_hist_rel 
    ON public.therapy_care_stage_history (relationship_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_care_stage_hist_therapist 
    ON public.therapy_care_stage_history (therapist_account_id);

CREATE INDEX IF NOT EXISTS idx_care_stage_hist_user 
    ON public.therapy_care_stage_history (user_id);

-- Row-Level Security
ALTER TABLE public.therapy_care_stage_history ENABLE ROW LEVEL SECURITY;

-- Therapists can only view their own stage transition history
DROP POLICY IF EXISTS "Therapists can view own stage history" ON public.therapy_care_stage_history;
CREATE POLICY "Therapists can view own stage history"
    ON public.therapy_care_stage_history FOR SELECT
    USING (therapist_account_id IN (
        SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
    ));

-- Append-only policy: Therapists can only insert history records for their accounts
DROP POLICY IF EXISTS "Therapists can insert own stage history" ON public.therapy_care_stage_history;
CREATE POLICY "Therapists can insert own stage history"
    ON public.therapy_care_stage_history FOR INSERT
    WITH CHECK (therapist_account_id IN (
        SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
    ));

-- NO UPDATE OR DELETE POLICIES: History is strictly append-only and immutable.


-- 2. TRANSACTIONAL ATOMIC RPC: therapist_transition_care_stage_atomic
CREATE OR REPLACE FUNCTION public.therapist_transition_care_stage_atomic(
    p_therapist_account_id UUID,
    p_user_id UUID,
    p_new_stage VARCHAR,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rel_id UUID;
    v_status VARCHAR(30);
    v_current_stage VARCHAR(30);
    v_started_at TIMESTAMPTZ;
    v_ended_at TIMESTAMPTZ;
    v_hist_id UUID;
    v_changed_at TIMESTAMPTZ;
    v_rel_json JSONB;
    v_hist_json JSONB;
BEGIN
    -- 1. Validate requested stage
    IF p_new_stage NOT IN ('intake', 'active_care', 'maintenance', 'completed') THEN
        RAISE EXCEPTION 'INVALID_CARE_STAGE: Stage must be intake, active_care, maintenance, or completed.';
    END IF;

    -- 2. Acquire transaction advisory lock on this therapist-client pair
    PERFORM pg_advisory_xact_lock(hashtext('stage_lock_' || p_therapist_account_id::text || '_' || p_user_id::text));

    -- 3. Lock and retrieve care relationship
    SELECT id, status, care_stage, started_at, ended_at
    INTO v_rel_id, v_status, v_current_stage, v_started_at, v_ended_at
    FROM public.therapy_care_relationships
    WHERE therapist_account_id = p_therapist_account_id
      AND user_id = p_user_id
    FOR UPDATE;

    IF v_rel_id IS NULL THEN
        RAISE EXCEPTION 'CLIENT_NOT_AUTHORIZED: Client does not have a care relationship with this therapist.';
    END IF;

    -- 4. Check for terminal relationship status
    IF v_status IN ('completed', 'terminated') THEN
        RAISE EXCEPTION 'RELATIONSHIP_TERMINATED: Relationship has ended. Stage cannot be modified.';
    END IF;

    -- 5. Idempotency Check: if already in the requested stage, return without creating duplicate history
    IF v_current_stage = p_new_stage THEN
        SELECT to_jsonb(r) INTO v_rel_json
        FROM public.therapy_care_relationships r
        WHERE r.id = v_rel_id;

        RETURN jsonb_build_object(
            'success', true,
            'idempotent', true,
            'relationship', v_rel_json,
            'transition', NULL
        );
    END IF;

    -- 6. State Machine Progression Validation
    IF v_current_stage = 'intake' AND p_new_stage NOT IN ('active_care', 'completed') THEN
        RAISE EXCEPTION 'INVALID_CARE_STAGE_TRANSITION: Cannot transition from intake to %.', p_new_stage;
    ELSIF v_current_stage = 'active_care' AND p_new_stage NOT IN ('maintenance', 'completed') THEN
        RAISE EXCEPTION 'INVALID_CARE_STAGE_TRANSITION: Cannot transition from active_care to %.', p_new_stage;
    ELSIF v_current_stage = 'maintenance' AND p_new_stage NOT IN ('active_care', 'completed') THEN
        RAISE EXCEPTION 'INVALID_CARE_STAGE_TRANSITION: Cannot transition from maintenance to %.', p_new_stage;
    ELSIF v_current_stage = 'completed' THEN
        RAISE EXCEPTION 'INVALID_CARE_STAGE_TRANSITION: Care is already completed. Stage transitions out of completed are prohibited.';
    END IF;

    -- 7. Update care relationship atomically
    UPDATE public.therapy_care_relationships
    SET care_stage = p_new_stage,
        ended_at = CASE WHEN p_new_stage = 'completed' THEN COALESCE(ended_at, now()) ELSE ended_at END,
        updated_at = now()
    WHERE id = v_rel_id
    RETURNING to_jsonb(therapy_care_relationships.*) INTO v_rel_json;

    -- 8. Write immutable audit history record
    INSERT INTO public.therapy_care_stage_history (
        relationship_id,
        therapist_account_id,
        user_id,
        previous_stage,
        new_stage,
        changed_by,
        changed_at,
        reason
    ) VALUES (
        v_rel_id,
        p_therapist_account_id,
        p_user_id,
        v_current_stage,
        p_new_stage,
        p_therapist_account_id,
        now(),
        p_reason
    )
    RETURNING to_jsonb(therapy_care_stage_history.*) INTO v_hist_json;

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'relationship', v_rel_json,
        'transition', v_hist_json
    );
END;
$$;


-- 3. HARDEN SCHEDULING RPC AGAINST TERMINAL CARE RELATIONSHIPS
-- Replaces appointment scheduling validation to ensure completed care stages reject active scheduling
CREATE OR REPLACE FUNCTION public.therapist_schedule_appointment_atomic(
    p_therapist_account_id UUID,
    p_user_id UUID,
    p_scheduled_start TIMESTAMPTZ,
    p_scheduled_end TIMESTAMPTZ,
    p_session_type VARCHAR DEFAULT 'video',
    p_meeting_link TEXT DEFAULT NULL,
    p_client_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rel_id UUID;
    v_care_stage VARCHAR(30);
    v_conflict_id UUID;
    v_appointment_id UUID;
    v_appointment_json JSONB;
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

    -- 3b. Guard against scheduling on completed care stages
    IF v_care_stage = 'completed' THEN
        RAISE EXCEPTION 'RELATIONSHIP_TERMINATED: Care has been completed. New sessions cannot be scheduled.';
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
        RAISE EXCEPTION 'CLIENT_CONFLICT: Client already has another active appointment at this time.';
    END IF;

    -- 6. Insert appointment
    INSERT INTO public.therapist_clinical_appointments (
        therapist_account_id,
        user_id,
        relationship_id,
        scheduled_start,
        scheduled_end,
        session_type,
        meeting_link,
        client_notes,
        status,
        modality,
        care_stage
    ) VALUES (
        p_therapist_account_id,
        p_user_id,
        v_rel_id,
        p_scheduled_start,
        p_scheduled_end,
        p_session_type,
        p_meeting_link,
        p_client_notes,
        'scheduled',
        p_session_type,
        v_care_stage
    )
    RETURNING id INTO v_appointment_id;

    -- 7. Return JSON
    SELECT to_jsonb(a) INTO v_appointment_json
    FROM public.therapist_clinical_appointments a
    WHERE a.id = v_appointment_id;

    RETURN v_appointment_json;
END;
$$;

COMMIT;
