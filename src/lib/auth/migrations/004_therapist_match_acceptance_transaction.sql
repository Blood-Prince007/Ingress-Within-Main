-- ==============================================================================
-- INGRESS WITHIN: ATOMIC THERAPY MATCH ACCEPTANCE & CARE RELATIONSHIP TRANSACTION
-- Migration: 004_therapist_match_acceptance_transaction.sql
-- ==============================================================================
-- Scope:
--   - Provides true PostgreSQL database transactions for therapy match acceptance.
--   - Eliminates application-level compensation/deletion.
--   - Guarantees ACID compliance: creating therapy_care_relationships and updating
--     therapy_matches occur within a single atomic transaction block.
--   - Enforces FOR UPDATE row-level locking to prevent concurrency race conditions.
--   - Idempotently handles duplicate acceptances without duplicating records.
-- ==============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.accept_therapy_match(
    p_therapist_account_id UUID,
    p_match_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_match public.therapy_matches%ROWTYPE;
    v_rel public.therapy_care_relationships%ROWTYPE;
    v_now TIMESTAMPTZ := now();
BEGIN
    -- 1. Lock match record for atomic transition and verify existence
    SELECT * INTO v_match
    FROM public.therapy_matches
    WHERE id = p_match_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'REQUEST_NOT_FOUND: Request not found' USING ERRCODE = 'P0002';
    END IF;

    -- 2. Strict tenancy check: match must be assigned to this therapist
    IF v_match.therapist_account_id IS DISTINCT FROM p_therapist_account_id THEN
        RAISE EXCEPTION 'REQUEST_FORBIDDEN: Request is not assigned to your practice' USING ERRCODE = '42501';
    END IF;

    -- 3. Idempotency check: if already selected, return existing relationship
    IF v_match.match_status = 'selected' THEN
        SELECT * INTO v_rel
        FROM public.therapy_care_relationships
        WHERE therapist_account_id = p_therapist_account_id
          AND user_id = v_match.user_id
          AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1;

        RETURN jsonb_build_object(
            'success', true,
            'action', 'accept',
            'match_id', v_match.id,
            'match_status', 'selected',
            'already_accepted', true,
            'relationship', to_jsonb(v_rel),
            'message', 'Client request was already accepted.'
        );
    END IF;

    -- 4. Stale status validation
    IF v_match.match_status = 'rejected' THEN
        RAISE EXCEPTION 'REQUEST_ALREADY_DECLINED: Request has already been declined' USING ERRCODE = 'P0001';
    END IF;

    IF v_match.match_status = 'unavailable' THEN
        RAISE EXCEPTION 'REQUEST_UNAVAILABLE: Request is no longer available' USING ERRCODE = 'P0001';
    END IF;

    IF v_match.match_status NOT IN ('candidate', 'shortlisted') THEN
        RAISE EXCEPTION 'INVALID_REQUEST_STATUS: Request cannot be accepted from status %', v_match.match_status USING ERRCODE = 'P0001';
    END IF;

    -- 5. Atomically find or create therapy_care_relationships inside the same transaction
    SELECT * INTO v_rel
    FROM public.therapy_care_relationships
    WHERE therapist_account_id = p_therapist_account_id
      AND user_id = v_match.user_id
      AND status = 'active'
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.therapy_care_relationships (
            therapist_account_id,
            user_id,
            therapy_session_id,
            status,
            care_stage,
            started_at,
            metadata,
            created_at,
            updated_at
        ) VALUES (
            p_therapist_account_id,
            v_match.user_id,
            v_match.therapy_session_id,
            'active',
            'intake',
            v_now,
            jsonb_build_object('source_match_id', v_match.id, 'accepted_at', v_now),
            v_now,
            v_now
        )
        RETURNING * INTO v_rel;
    END IF;

    -- 6. Atomically update therapy_matches in the exact same transaction
    UPDATE public.therapy_matches
    SET match_status = 'selected',
        updated_at = v_now
    WHERE id = v_match.id;

    -- 7. Atomically insert therapist notification
    INSERT INTO public.therapist_notifications (
        therapist_account_id,
        type,
        title,
        message,
        link,
        created_at
    ) VALUES (
        p_therapist_account_id,
        'request_accepted',
        'New Client Connected',
        'You have accepted the matching request. Client is now added to your care roster.',
        '/therapist/clients',
        v_now
    );

    RETURN jsonb_build_object(
        'success', true,
        'action', 'accept',
        'match_id', v_match.id,
        'match_status', 'selected',
        'already_accepted', false,
        'relationship', to_jsonb(v_rel),
        'message', 'Client request accepted successfully.'
    );
END;
$$;

-- Atomic decline procedure
CREATE OR REPLACE FUNCTION public.decline_therapy_match(
    p_therapist_account_id UUID,
    p_match_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_match public.therapy_matches%ROWTYPE;
    v_now TIMESTAMPTZ := now();
    v_meta JSONB;
BEGIN
    SELECT * INTO v_match
    FROM public.therapy_matches
    WHERE id = p_match_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'REQUEST_NOT_FOUND: Request not found' USING ERRCODE = 'P0002';
    END IF;

    IF v_match.therapist_account_id IS DISTINCT FROM p_therapist_account_id THEN
        RAISE EXCEPTION 'REQUEST_FORBIDDEN: Request is not assigned to your practice' USING ERRCODE = '42501';
    END IF;

    IF v_match.match_status = 'rejected' THEN
        RETURN jsonb_build_object(
            'success', true,
            'action', 'decline',
            'match_id', v_match.id,
            'match_status', 'rejected',
            'already_declined', true,
            'message', 'Client request was already declined.'
        );
    END IF;

    v_meta := coalesce(v_match.matching_metadata, '{}'::jsonb) || jsonb_build_object(
        'declined_at', v_now,
        'decline_reason', p_reason
    );

    UPDATE public.therapy_matches
    SET match_status = 'rejected',
        matching_metadata = v_meta,
        updated_at = v_now
    WHERE id = v_match.id;

    RETURN jsonb_build_object(
        'success', true,
        'action', 'decline',
        'match_id', v_match.id,
        'match_status', 'rejected',
        'already_declined', false,
        'message', 'Client request declined successfully.'
    );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.accept_therapy_match(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decline_therapy_match(UUID, UUID, TEXT) TO authenticated, service_role;

COMMIT;
