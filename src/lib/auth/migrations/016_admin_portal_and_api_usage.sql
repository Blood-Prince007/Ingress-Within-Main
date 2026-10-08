-- ============================================================================
-- INGRESS WITHIN — MIGRATION 016: ADMIN PORTAL & API USAGE TRACKING
-- ============================================================================
-- Description:
-- 1. Creates public.admin_accounts for dedicated, highly-privileged founder/admin
--    identities separate from normal therapist/client users.
--    - Roles: 'super_admin', 'admin', 'finance_admin', 'support_admin', 'analyst'.
--    - Status: 'active', 'suspended', 'deactivated'.
--    - Password hash using scrypt memory-hard algorithm.
--    - Rate-limiting lockout fields (failed_login_attempts, locked_until).
-- 2. Creates public.admin_sessions for server-side device session tracking.
-- 3. Formalizes public.webhook_events for incoming provider webhook idempotency & monitoring.
-- 4. Creates public.api_usage_events for tracking real external API usage & latency.
-- 5. Enables strict Row Level Security (RLS) ensuring ZERO client/therapist access.
-- ============================================================================

-- 1. CREATE ADMIN ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.admin_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'admin', 'finance_admin', 'support_admin', 'analyst')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated')),
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ NULL,
    last_login_at TIMESTAMPTZ NULL,
    last_login_ip TEXT NULL,
    created_by TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_accounts_email ON public.admin_accounts (email);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_status ON public.admin_accounts (status, role);

-- 2. CREATE ADMIN SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.admin_accounts(id) ON DELETE CASCADE,
    device_id VARCHAR(100) NOT NULL,
    token_hash VARCHAR(128) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    ip_address TEXT NULL,
    user_agent TEXT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_lookup
    ON public.admin_sessions (admin_id, device_id, is_active, expires_at DESC);

-- 3. FORMALIZE WEBHOOK EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(100) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    processed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure all formal columns exist if table was already created in earlier billing migration
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS provider VARCHAR(50) NOT NULL DEFAULT 'razorpay';
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'processed';
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS error_message TEXT NULL;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_webhook_events_lookup
    ON public.webhook_events (provider, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status
    ON public.webhook_events (status, created_at DESC);

-- 4. CREATE API USAGE EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.api_usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('razorpay', 'google_calendar', 'email', 'gemini_ai', 'supabase', 'system')),
    service VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    status_code INTEGER NULL,
    success BOOLEAN NOT NULL,
    latency_ms INTEGER NULL,
    error_category VARCHAR(100) NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_provider_time
    ON public.api_usage_events (provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_success
    ON public.api_usage_events (provider, success, created_at DESC);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_events ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-run
DROP POLICY IF EXISTS "Service role manages admin_accounts" ON public.admin_accounts;
DROP POLICY IF EXISTS "Service role manages admin_sessions" ON public.admin_sessions;
DROP POLICY IF EXISTS "Service role manages webhook_events" ON public.webhook_events;
DROP POLICY IF EXISTS "Service role manages api_usage_events" ON public.api_usage_events;

-- Strict Service Role Only Policies:
-- Absolutely NO therapist, client, or public user can access admin tables
CREATE POLICY "Service role manages admin_accounts"
    ON public.admin_accounts FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages admin_sessions"
    ON public.admin_sessions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages webhook_events"
    ON public.webhook_events FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages api_usage_events"
    ON public.api_usage_events FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');
