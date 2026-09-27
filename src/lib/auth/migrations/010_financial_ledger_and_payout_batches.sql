-- ============================================================================
-- INGRESS WITHIN — MIGRATION 010: FINANCIAL LEDGER & PAYOUT BATCHES
-- ============================================================================
-- Description:
-- 1. Hardens public.therapist_earnings:
--    - Enforces strict single earning per appointment via UNIQUE constraint/index.
--    - Constrains payment_status to strict financial state machine:
--      'pending', 'collected', 'paid', 'cancelled', 'reversed'.
--    - Adds updated_at timestamp.
-- 2. Creates public.therapist_payout_batches:
--    - Tracks explicit payout batches for therapist disbursements.
--    - Status: 'pending', 'processing', 'paid', 'failed', 'reversed'.
-- 3. Creates public.therapist_payout_batch_items:
--    - Enforces earning_id UNIQUE: an earning belongs to at most one payout batch.
-- 4. Links therapist_earnings.payout_batch_id to therapist_payout_batches(id).
-- 5. Enables strict Row Level Security (RLS) ensuring therapists view only own data
--    and only administrative service roles can create or transition payouts.
-- ============================================================================

-- 1. HARDEN THERAPIST EARNINGS TABLE
CREATE TABLE IF NOT EXISTS public.therapist_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_account_id UUID NOT NULL REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.therapist_clinical_appointments(id) ON DELETE SET NULL,
    gross_amount NUMERIC(10,2) NOT NULL,
    platform_fee NUMERIC(10,2) NOT NULL,
    net_earnings NUMERIC(10,2) NOT NULL,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'collected',
    collected_at TIMESTAMPTZ DEFAULT now(),
    payout_batch_id UUID,
    payout_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure updated_at exists if table already existed
ALTER TABLE public.therapist_earnings
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Enforce UNIQUE appointment_id on therapist_earnings (One earning per appointment)
CREATE UNIQUE INDEX IF NOT EXISTS idx_th_earnings_appointment_unique
    ON public.therapist_earnings (appointment_id)
    WHERE appointment_id IS NOT NULL;

-- Enforce strict financial state machine check constraint on payment_status
DO $$
BEGIN
    ALTER TABLE public.therapist_earnings
        DROP CONSTRAINT IF EXISTS therapist_earnings_payment_status_check;
    ALTER TABLE public.therapist_earnings
        DROP CONSTRAINT IF EXISTS chk_therapist_earnings_status;
    ALTER TABLE public.therapist_earnings
        ADD CONSTRAINT chk_therapist_earnings_status
        CHECK (payment_status IN ('pending', 'collected', 'paid', 'cancelled', 'reversed'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;


-- 2. CREATE THERAPIST PAYOUT BATCHES TABLE
CREATE TABLE IF NOT EXISTS public.therapist_payout_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_account_id UUID NOT NULL REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    total_net NUMERIC(10,2) NOT NULL CHECK (total_net >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'processing',
        'paid',
        'failed',
        'reversed'
    )),
    paid_at TIMESTAMPTZ,
    bank_reference TEXT,
    failure_reason TEXT,
    reversal_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_payout_period_order CHECK (period_start <= period_end)
);

CREATE INDEX IF NOT EXISTS idx_th_payout_batches_lookup
    ON public.therapist_payout_batches (therapist_account_id, status, created_at DESC);


-- 3. CREATE THERAPIST PAYOUT BATCH ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.therapist_payout_batch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_batch_id UUID NOT NULL REFERENCES public.therapist_payout_batches(id) ON DELETE CASCADE,
    earning_id UUID NOT NULL REFERENCES public.therapist_earnings(id) ON DELETE RESTRICT,
    net_amount NUMERIC(10,2) NOT NULL CHECK (net_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_payout_batch_items_earning UNIQUE (earning_id)
);

CREATE INDEX IF NOT EXISTS idx_th_payout_batch_items_batch
    ON public.therapist_payout_batch_items (payout_batch_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_th_payout_batch_items_earning_uq
    ON public.therapist_payout_batch_items (earning_id);


-- 4. LINK THERAPIST EARNINGS TO PAYOUT BATCHES
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_therapist_earnings_batch'
    ) THEN
        ALTER TABLE public.therapist_earnings
            ADD CONSTRAINT fk_therapist_earnings_batch
            FOREIGN KEY (payout_batch_id)
            REFERENCES public.therapist_payout_batches(id)
            ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_th_earnings_batch
    ON public.therapist_earnings (payout_batch_id);

CREATE INDEX IF NOT EXISTS idx_th_earnings_status
    ON public.therapist_earnings (therapist_account_id, payment_status, collected_at DESC);


-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.therapist_payout_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapist_payout_batch_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Therapists can view own payout batches" ON public.therapist_payout_batches;
DROP POLICY IF EXISTS "Therapists can view own payout batch items" ON public.therapist_payout_batch_items;
DROP POLICY IF EXISTS "Service role manages payout batches" ON public.therapist_payout_batches;
DROP POLICY IF EXISTS "Service role manages payout batch items" ON public.therapist_payout_batch_items;

-- Therapists can only view their own payout batches
CREATE POLICY "Therapists can view own payout batches"
    ON public.therapist_payout_batches FOR SELECT
    USING (
        therapist_account_id IN (
            SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
        )
    );

-- Therapists can only view items belonging to their payout batches
CREATE POLICY "Therapists can view own payout batch items"
    ON public.therapist_payout_batch_items FOR SELECT
    USING (
        payout_batch_id IN (
            SELECT b.id FROM public.therapist_payout_batches b
            JOIN public.therapist_accounts a ON a.id = b.therapist_account_id
            WHERE a.auth_user_id = auth.uid()
        )
    );

-- Service role bypass for mutations
CREATE POLICY "Service role manages payout batches"
    ON public.therapist_payout_batches FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages payout batch items"
    ON public.therapist_payout_batch_items FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');
