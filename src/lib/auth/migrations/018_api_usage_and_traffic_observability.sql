-- ==============================================================================
-- INGRESS WITHIN: MIGRATION 018 — API USAGE & TRAFFIC OBSERVABILITY SCHEMA
-- ==============================================================================
-- Scope:
--   1. Enhances public.api_usage_events with comprehensive telemetry columns:
--      - provider CHECK updated to include all real providers:
--        'internal', 'claude', 'groq', 'gemini', 'synthesizer', 'razorpay',
--        'google_calendar', 'email', 'supabase', 'system'
--      - route, method, actor_type, logical_request_id, model
--      - input_tokens, output_tokens, cache_tokens, estimated_cost_paise, currency
--   2. Creates aggregated tables for performant dashboards:
--      - public.api_usage_hourly
--      - public.api_usage_daily
--   3. Creates performance indexes on route, actor_type, logical_request_id, created_at
--   4. Configures Row Level Security (RLS) guaranteeing strict service-role isolation
-- ==============================================================================

BEGIN;

-- 1. DROP RESTRICTIVE CHECK CONSTRAINT ON PROVIDER IF PRESENT AND RE-ADD COMPREHENSIVE ONE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'api_usage_events_provider_check'
    ) THEN
        ALTER TABLE public.api_usage_events DROP CONSTRAINT api_usage_events_provider_check;
    END IF;
END $$;

ALTER TABLE public.api_usage_events 
    ADD CONSTRAINT api_usage_events_provider_check 
    CHECK (provider IN (
        'internal', 'claude', 'groq', 'gemini', 'gemini_ai', 'synthesizer',
        'razorpay', 'google_calendar', 'email', 'supabase', 'system'
    ));

-- 2. EXTEND API_USAGE_EVENTS WITH OBSERVABILITY METRICS
ALTER TABLE public.api_usage_events 
    ADD COLUMN IF NOT EXISTS route VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS method VARCHAR(10) NULL,
    ADD COLUMN IF NOT EXISTS actor_type VARCHAR(50) NULL DEFAULT 'anonymous',
    ADD COLUMN IF NOT EXISTS logical_request_id VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS is_fallback BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS model VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS input_tokens INTEGER NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS output_tokens INTEGER NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cache_tokens INTEGER NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS estimated_cost_paise BIGINT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'INR';

-- 3. CREATE PERFORMANCE INDEXES ON API_USAGE_EVENTS
CREATE INDEX IF NOT EXISTS idx_api_usage_route_time 
    ON public.api_usage_events (route, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_usage_actor_time 
    ON public.api_usage_events (actor_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_usage_logical_req 
    ON public.api_usage_events (logical_request_id);

CREATE INDEX IF NOT EXISTS idx_api_usage_model_time 
    ON public.api_usage_events (model, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_usage_created_at_brin 
    ON public.api_usage_events (created_at DESC);

-- 4. CREATE HOURLY AGGREGATE TABLE
CREATE TABLE IF NOT EXISTS public.api_usage_hourly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_start TIMESTAMPTZ NOT NULL,
    provider VARCHAR(50) NOT NULL,
    route VARCHAR(255) NOT NULL DEFAULT 'all',
    actor_type VARCHAR(50) NOT NULL DEFAULT 'all',
    total_requests INTEGER NOT NULL DEFAULT 0,
    successful_requests INTEGER NOT NULL DEFAULT 0,
    failed_requests INTEGER NOT NULL DEFAULT 0,
    total_latency_ms BIGINT NOT NULL DEFAULT 0,
    p95_latency_ms INTEGER NOT NULL DEFAULT 0,
    input_tokens BIGINT NOT NULL DEFAULT 0,
    output_tokens BIGINT NOT NULL DEFAULT 0,
    estimated_cost_paise BIGINT NOT NULL DEFAULT 0,
    error_count_4xx INTEGER NOT NULL DEFAULT 0,
    error_count_5xx INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (bucket_start, provider, route, actor_type)
);

CREATE INDEX IF NOT EXISTS idx_api_usage_hourly_bucket 
    ON public.api_usage_hourly (bucket_start DESC, provider);

-- 5. CREATE DAILY AGGREGATE TABLE
CREATE TABLE IF NOT EXISTS public.api_usage_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_date DATE NOT NULL,
    provider VARCHAR(50) NOT NULL,
    route VARCHAR(255) NOT NULL DEFAULT 'all',
    actor_type VARCHAR(50) NOT NULL DEFAULT 'all',
    total_requests INTEGER NOT NULL DEFAULT 0,
    successful_requests INTEGER NOT NULL DEFAULT 0,
    failed_requests INTEGER NOT NULL DEFAULT 0,
    avg_latency_ms INTEGER NOT NULL DEFAULT 0,
    p95_latency_ms INTEGER NOT NULL DEFAULT 0,
    input_tokens BIGINT NOT NULL DEFAULT 0,
    output_tokens BIGINT NOT NULL DEFAULT 0,
    estimated_cost_paise BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (bucket_date, provider, route, actor_type)
);

CREATE INDEX IF NOT EXISTS idx_api_usage_daily_bucket 
    ON public.api_usage_daily (bucket_date DESC, provider);

-- 6. ENABLE ROW LEVEL SECURITY (RLS) ON ALL AGGREGATE TABLES
ALTER TABLE public.api_usage_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages api_usage_hourly" ON public.api_usage_hourly;
DROP POLICY IF EXISTS "Service role manages api_usage_daily" ON public.api_usage_daily;

CREATE POLICY "Service role manages api_usage_hourly"
    ON public.api_usage_hourly FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages api_usage_daily"
    ON public.api_usage_daily FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

COMMIT;
