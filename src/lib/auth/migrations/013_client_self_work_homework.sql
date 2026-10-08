-- ==============================================================================
-- INGRESS WITHIN: CLIENT SELF-WORK & CLINICAL HOMEWORK SYSTEM SCHEMA
-- Migration: 013_client_self_work_homework.sql
-- ==============================================================================
-- Scope:
--   1. Creates public.therapy_homework_templates for clinical exercise catalog.
--   2. Creates public.client_homework_assignments for therapist-assigned self-work.
--   3. Creates public.client_homework_submissions for client reflections and clinician feedback.
--   4. Enforces strict multi-tenant Row Level Security (RLS).
--   5. Seeds standard evidence-based clinical templates.
-- ==============================================================================

BEGIN;

-- 1. THERAPY HOMEWORK TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.therapy_homework_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_account_id UUID REFERENCES public.therapist_accounts(id) ON DELETE CASCADE, -- NULL = platform standard
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    exercise_type VARCHAR(50) NOT NULL CHECK (exercise_type IN (
        'psychoeducation_module',
        'thought_record',
        'behavioral_activation',
        'journaling_reflection',
        'grounding_exercise',
        'custom_worksheet'
    )),
    resource_reference VARCHAR(100), -- e.g. module id, intervention key
    default_instructions TEXT NOT NULL DEFAULT '',
    estimated_minutes INTEGER NOT NULL DEFAULT 15 CHECK (estimated_minutes > 0 AND estimated_minutes <= 180),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hw_templates_therapist 
    ON public.therapy_homework_templates (therapist_account_id, is_active);

CREATE INDEX IF NOT EXISTS idx_hw_templates_type 
    ON public.therapy_homework_templates (exercise_type, is_active);


-- 2. CLIENT HOMEWORK ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.client_homework_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_account_id UUID NOT NULL REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    relationship_id UUID NOT NULL REFERENCES public.therapy_care_relationships(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.therapist_clinical_appointments(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.therapy_homework_templates(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    instructions TEXT NOT NULL,
    clinical_goal TEXT,
    exercise_type VARCHAR(50) NOT NULL CHECK (exercise_type IN (
        'psychoeducation_module',
        'thought_record',
        'behavioral_activation',
        'journaling_reflection',
        'grounding_exercise',
        'custom_worksheet'
    )),
    resource_reference VARCHAR(100),
    estimated_minutes INTEGER NOT NULL DEFAULT 15 CHECK (estimated_minutes > 0 AND estimated_minutes <= 180),
    due_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL CHECK (status IN (
        'assigned',
        'viewed',
        'in_progress',
        'submitted',
        'reviewed',
        'cancelled'
    )) DEFAULT 'assigned',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    viewed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hw_assign_therapist_status 
    ON public.client_homework_assignments (therapist_account_id, status, due_at);

CREATE INDEX IF NOT EXISTS idx_hw_assign_user_status 
    ON public.client_homework_assignments (user_id, status, due_at);

CREATE INDEX IF NOT EXISTS idx_hw_assign_appt 
    ON public.client_homework_assignments (appointment_id);

CREATE INDEX IF NOT EXISTS idx_hw_assign_rel 
    ON public.client_homework_assignments (relationship_id);


-- 3. CLIENT HOMEWORK SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.client_homework_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL UNIQUE REFERENCES public.client_homework_assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    therapist_account_id UUID NOT NULL REFERENCES public.therapist_accounts(id) ON DELETE CASCADE,
    response_content TEXT NOT NULL DEFAULT '',
    response_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_draft BOOLEAN NOT NULL DEFAULT false,
    submitted_at TIMESTAMPTZ,
    therapist_feedback TEXT,
    feedback_added_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hw_sub_assignment 
    ON public.client_homework_submissions (assignment_id);

CREATE INDEX IF NOT EXISTS idx_hw_sub_user 
    ON public.client_homework_submissions (user_id);

CREATE INDEX IF NOT EXISTS idx_hw_sub_therapist 
    ON public.client_homework_submissions (therapist_account_id);


-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.therapy_homework_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_homework_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_homework_submissions ENABLE ROW LEVEL SECURITY;

-- Templates: Everyone authenticated can view platform templates (therapist_account_id IS NULL) or their own
DROP POLICY IF EXISTS "Anyone can view platform or own templates" ON public.therapy_homework_templates;
CREATE POLICY "Anyone can view platform or own templates"
    ON public.therapy_homework_templates FOR SELECT
    USING (
        therapist_account_id IS NULL OR
        therapist_account_id IN (
            SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
        )
    );

-- Assignments: Therapists can view and manage their assignments
DROP POLICY IF EXISTS "Therapists can view own assignments" ON public.client_homework_assignments;
CREATE POLICY "Therapists can view own assignments"
    ON public.client_homework_assignments FOR SELECT
    USING (
        therapist_account_id IN (
            SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Therapists can manage own assignments" ON public.client_homework_assignments;
CREATE POLICY "Therapists can manage own assignments"
    ON public.client_homework_assignments FOR ALL
    USING (
        therapist_account_id IN (
            SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        therapist_account_id IN (
            SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
        )
    );

-- Assignments: Clients can view their own assignments
DROP POLICY IF EXISTS "Clients can view own assignments" ON public.client_homework_assignments;
CREATE POLICY "Clients can view own assignments"
    ON public.client_homework_assignments FOR SELECT
    USING (user_id = auth.uid());

-- Submissions: Clients can manage their own submissions
DROP POLICY IF EXISTS "Clients can manage own submissions" ON public.client_homework_submissions;
CREATE POLICY "Clients can manage own submissions"
    ON public.client_homework_submissions FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Submissions: Therapists can view and add feedback to submissions of their clients
DROP POLICY IF EXISTS "Therapists can view client submissions" ON public.client_homework_submissions;
CREATE POLICY "Therapists can view client submissions"
    ON public.client_homework_submissions FOR SELECT
    USING (
        therapist_account_id IN (
            SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Therapists can update feedback on client submissions" ON public.client_homework_submissions;
CREATE POLICY "Therapists can update feedback on client submissions"
    ON public.client_homework_submissions FOR UPDATE
    USING (
        therapist_account_id IN (
            SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        therapist_account_id IN (
            SELECT id FROM public.therapist_accounts WHERE auth_user_id = auth.uid()
        )
    );


-- 5. SEED STANDARD CLINICAL EXERCISE TEMPLATES
INSERT INTO public.therapy_homework_templates (
    id,
    therapist_account_id,
    title,
    description,
    exercise_type,
    resource_reference,
    default_instructions,
    estimated_minutes,
    is_active
) VALUES
(
    '00000000-0000-0000-0000-000000000101',
    NULL,
    'CBT 5-Column Thought Record',
    'Identify automatic negative thoughts, cognitive distortions, and construct balanced alternative perspectives.',
    'thought_record',
    'thought_record',
    'When you notice a sudden shift in your mood or an emotional spike: 1) Record the situation. 2) Note the automatic thought. 3) Rate the intensity of your emotion (1-100%). 4) Write down evidence for and against this thought. 5) Create a balanced, realistic alternative thought.',
    20,
    true
),
(
    '00000000-0000-0000-0000-000000000102',
    NULL,
    'Psychoeducation: Cognitive Reframing & Core Beliefs',
    'Read and reflect on foundational CBT mechanisms regarding how core schemas shape emotional responses.',
    'psychoeducation_module',
    'module_1',
    'Please complete the designated psychoeducation reading on identifying intermediate beliefs and cognitive restructuring before our next encounter. Reflect on one personal scenario where this pattern appeared.',
    15,
    true
),
(
    '00000000-0000-0000-0000-000000000103',
    NULL,
    'Behavioral Activation: Activity & Mood Log',
    'Schedule and engage in one nourishing or mastery activity between sessions, tracking your mood before and after.',
    'behavioral_activation',
    'behavioral_activation',
    'Select one manageable activity associated with either pleasure or accomplishment. Schedule a specific 30-minute block for it. Rate your mood on a scale of 1-10 immediately before and after completing it.',
    30,
    true
),
(
    '00000000-0000-0000-0000-000000000104',
    NULL,
    'Mindful Grounding & Box Breathing Practice',
    'Practice somatic regulation and autonomic stabilization through 5-4-3-2-1 sensory grounding and 4x4 box breathing.',
    'grounding_exercise',
    'grounding',
    'Engage in 5 minutes of box breathing (4s inhale, 4s hold, 4s exhale, 4s hold) followed by the 5-4-3-2-1 sensory grounding exercise once daily when experiencing anticipatory anxiety or stress.',
    10,
    true
),
(
    '00000000-0000-0000-0000-000000000105',
    NULL,
    'Session Reflection & Values Alignment Journal',
    'Deepen integration of our clinical conversation by reflecting on key insights and intentional commitments.',
    'journaling_reflection',
    'values_reflection',
    'Reflect on the central theme we explored in our recent session: 1) What was the most meaningful realization for you? 2) What is one small, value-aligned action you want to experiment with this week?',
    15,
    true
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
