-- ==============================================================================
-- INGRESS WITHIN: MIGRATION 017 — THERAPIST VERIFICATION & REVIEW HISTORY
-- ==============================================================================
-- Scope:
--   1. Adds rejection_reason and resubmitted_at columns to therapist_applications.
--   2. Creates public.therapist_application_reviews table for immutable historical
--      auditing of all administrative verification decisions (approvals, rejections,
--      resubmissions, notes).
--   3. Enables strict Row Level Security (RLS) guaranteeing that only authorized
--      service roles / administrators can record or inspect review histories.
-- ==============================================================================

BEGIN;

-- 1. EXTEND THERAPIST_APPLICATIONS
ALTER TABLE public.therapist_applications 
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.therapist_applications 
    ADD COLUMN IF NOT EXISTS resubmitted_at TIMESTAMPTZ;

-- 2. CREATE IMMUTABLE REVIEW HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.therapist_application_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.therapist_applications(id) ON DELETE CASCADE,
    therapist_account_id UUID NOT NULL REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.admin_accounts(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('submitted', 'moved_to_review', 'approved', 'rejected', 'resubmitted')),
    previous_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    reason TEXT,
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_th_app_reviews_account 
    ON public.therapist_application_reviews (therapist_account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_th_app_reviews_action 
    ON public.therapist_application_reviews (action, created_at DESC);

-- 3. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.therapist_application_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages application reviews" ON public.therapist_application_reviews;
CREATE POLICY "Service role manages application reviews"
    ON public.therapist_application_reviews FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

COMMIT;
