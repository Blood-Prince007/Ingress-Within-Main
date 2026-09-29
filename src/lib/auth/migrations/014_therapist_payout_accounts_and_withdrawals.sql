-- ==============================================================================
-- INGRESS WITHIN — MIGRATION 014: THERAPIST PAYOUT ACCOUNTS & SECURE WITHDRAWALS
-- ==============================================================================
-- Description:
-- 1. Creates public.therapist_payout_accounts:
--    - Secure tokenized payout destination storage for therapists.
--    - Stores provider account reference (e.g. RazorpayX Fund Account fa_xxx).
--    - Stores masked identifiers (e.g. ••••9012 or si••••@upi) and bank name.
--    - STRICT PRIVACY: NEVER stores raw full bank account numbers, PINs, or credentials.
--    - Status check: 'pending', 'verification_required', 'verified', 'disabled'.
--    - Type: 'bank', 'upi'.
-- 2. Creates public.therapist_withdrawal_requests:
--    - Explicit record for therapist-initiated withdrawals.
--    - References verified therapist_payout_accounts.
--    - State machine: 'requested', 'processing', 'completed', 'failed', 'reversed', 'cancelled'.
--    - Tracks provider payout ID, UTR number, and idempotency key.
-- 3. Enables strict Row Level Security (RLS) ensuring therapists view and manage only their own data.
-- ==============================================================================

BEGIN;

-- 1. CREATE THERAPIST PAYOUT ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.therapist_payout_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_account_id UUID NOT NULL REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    provider VARCHAR(30) NOT NULL DEFAULT 'razorpayx',
    provider_account_id VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('bank', 'upi')),
    status VARCHAR(30) NOT NULL DEFAULT 'verified' CHECK (status IN (
        'pending',
        'verification_required',
        'verified',
        'disabled'
    )),
    beneficiary_name TEXT NOT NULL,
    masked_identifier VARCHAR(100) NOT NULL,
    bank_name VARCHAR(100),
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_th_payout_acc_therapist 
    ON public.therapist_payout_accounts (therapist_account_id, status);

CREATE INDEX IF NOT EXISTS idx_th_payout_acc_provider_ref 
    ON public.therapist_payout_accounts (provider, provider_account_id);


-- 2. CREATE THERAPIST WITHDRAWAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.therapist_withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_account_id UUID NOT NULL REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    payout_account_id UUID NOT NULL REFERENCES public.therapist_payout_accounts(id) ON DELETE RESTRICT,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL DEFAULT 'requested' CHECK (status IN (
        'requested',
        'processing',
        'completed',
        'failed',
        'reversed',
        'cancelled'
    )),
    provider_payout_id VARCHAR(100),
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    batch_id UUID REFERENCES public.therapist_payout_batches(id) ON DELETE SET NULL,
    failure_reason TEXT,
    reversal_reason TEXT,
    utr_number VARCHAR(100),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_th_withdraw_lookup 
    ON public.therapist_withdrawal_requests (therapist_account_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_th_withdraw_provider_payout 
    ON public.therapist_withdrawal_requests (provider_payout_id);

CREATE INDEX IF NOT EXISTS idx_th_withdraw_idempotency 
    ON public.therapist_withdrawal_requests (idempotency_key);


-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.therapist_payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapist_withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Therapists can view own payout accounts" ON public.therapist_payout_accounts;
DROP POLICY IF EXISTS "Therapists can view own withdrawal requests" ON public.therapist_withdrawal_requests;
DROP POLICY IF EXISTS "Service role manages payout accounts" ON public.therapist_payout_accounts;
DROP POLICY IF EXISTS "Service role manages withdrawal requests" ON public.therapist_withdrawal_requests;

-- Therapists can only view their own payout accounts
CREATE POLICY "Therapists can view own payout accounts"
    ON public.therapist_payout_accounts FOR SELECT
    USING (
        therapist_account_id IN (
            SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
        )
    );

-- Therapists can only view their own withdrawal requests
CREATE POLICY "Therapists can view own withdrawal requests"
    ON public.therapist_withdrawal_requests FOR SELECT
    USING (
        therapist_account_id IN (
            SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
        )
    );

-- Service role full access
CREATE POLICY "Service role manages payout accounts"
    ON public.therapist_payout_accounts FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role manages withdrawal requests"
    ON public.therapist_withdrawal_requests FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

COMMIT;
