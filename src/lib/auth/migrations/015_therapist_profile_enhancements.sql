-- ==============================================================================
-- INGRESS WITHIN: MIGRATION 015 - THERAPIST PROFILE & SETTINGS ENHANCEMENTS
-- ==============================================================================
-- Scope:
--   - Extends therapist_profiles with practice metadata, timezone, and notification preferences.
--   - Completely backward-compatible and non-destructive.
-- ==============================================================================

BEGIN;

-- 1. ADD PRACTICE METADATA
ALTER TABLE public.therapist_profiles
    ADD COLUMN IF NOT EXISTS practice_name TEXT DEFAULT '';

ALTER TABLE public.therapist_profiles
    ADD COLUMN IF NOT EXISTS practice_address TEXT DEFAULT '';

-- 2. ADD TIMEZONE CONFIGURATION (Canonical IANA timezone, defaults to Asia/Kolkata)
ALTER TABLE public.therapist_profiles
    ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Kolkata';

-- 3. ADD NOTIFICATION PREFERENCES (JSONB with granular email & in-app alerts)
ALTER TABLE public.therapist_profiles
    ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
        "email_appointment_reminders": true,
        "email_booking_notifications": true,
        "email_cancellation_alerts": true,
        "email_homework_submissions": true,
        "in_app_session_alerts": true,
        "security_alerts": true
    }'::jsonb;

-- 4. ENSURE INDEX ON SESSIONS LOOKUP
CREATE INDEX IF NOT EXISTS idx_therapist_sessions_active_list
    ON public.therapist_sessions (therapist_account_id, is_active, last_active_at DESC);

COMMIT;
