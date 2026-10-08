-- ==============================================================================
-- INGRESS WITHIN: THERAPIST SOAP NOTES & CLINICAL WORKFLOW SCHEMA
-- Migration: 006_therapist_soap_notes_workflow.sql
-- ==============================================================================
-- Scope:
--   - Documents and hardens canonical public.therapist_soap_notes table.
--   - Enforces unique 1-to-1 session-to-SOAP constraint (appointment_id).
--   - Enforces RLS: strictly therapist-isolated; clients NEVER have access.
--   - Supports clinical lifecycle: Draft -> Finalized (immutable clinical record).
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.therapist_soap_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL UNIQUE REFERENCES public.therapist_clinical_appointments(id) ON DELETE CASCADE,
    therapist_account_id UUID NOT NULL REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subjective TEXT NOT NULL DEFAULT '',
    objective TEXT NOT NULL DEFAULT '',
    assessment TEXT NOT NULL DEFAULT '',
    plan TEXT NOT NULL DEFAULT '',
    is_draft BOOLEAN NOT NULL DEFAULT true,
    finalized_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optimize indexes for lookups and audit queries
CREATE INDEX IF NOT EXISTS idx_th_soap_appt 
    ON public.therapist_soap_notes (appointment_id);

CREATE INDEX IF NOT EXISTS idx_th_soap_therapist_created 
    ON public.therapist_soap_notes (therapist_account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_th_soap_user 
    ON public.therapist_soap_notes (user_id);

-- Row-Level Security
ALTER TABLE public.therapist_soap_notes ENABLE ROW LEVEL SECURITY;

-- Therapists can only view their own notes
DROP POLICY IF EXISTS "Therapists can view own SOAP notes" ON public.therapist_soap_notes;
CREATE POLICY "Therapists can view own SOAP notes"
    ON public.therapist_soap_notes FOR SELECT
    USING (therapist_account_id IN (
        SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
    ));

-- Therapists can insert or update their own notes
DROP POLICY IF EXISTS "Therapists can manage own SOAP notes" ON public.therapist_soap_notes;
CREATE POLICY "Therapists can manage own SOAP notes"
    ON public.therapist_soap_notes FOR ALL
    USING (therapist_account_id IN (
        SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
    ))
    WITH CHECK (therapist_account_id IN (
        SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
    ));

COMMIT;
