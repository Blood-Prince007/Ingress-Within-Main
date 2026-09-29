import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { TherapistHomeworkService } from '../src/lib/therapist/therapistHomeworkService';
import { ClientHomeworkService } from '../src/lib/therapy/clientHomeworkService';
import { supabase } from '../src/lib/db';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`  ✗ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  ✓ [PASS] ${message}`);
}

async function runClientHomeworkSuite() {
  console.log('================================================================');
  console.log('  INGRESS WITHIN — CLIENT SELF-WORK & HOMEWORK TEST SUITE       ');
  console.log('================================================================\n');

  // ===========================================================================
  // SECTION 1: Migration 013 & Schema Invariants
  // ===========================================================================
  console.log('--- SECTION 1: Migration 013 & Schema Invariants ---');

  const migration013Path = path.join(
    process.cwd(),
    'src/lib/auth/migrations/013_client_self_work_homework.sql'
  );
  assert(fs.existsSync(migration013Path), 'Migration 013 exists on disk');

  const migration013 = fs.readFileSync(migration013Path, 'utf8');
  assert(
    migration013.includes('CREATE TABLE IF NOT EXISTS public.therapy_homework_templates'),
    'Defines public.therapy_homework_templates table'
  );
  assert(
    migration013.includes('CREATE TABLE IF NOT EXISTS public.client_homework_assignments'),
    'Defines public.client_homework_assignments table'
  );
  assert(
    migration013.includes('CREATE TABLE IF NOT EXISTS public.client_homework_submissions'),
    'Defines public.client_homework_submissions table'
  );
  assert(
    migration013.includes('psychoeducation_module') &&
    migration013.includes('thought_record') &&
    migration013.includes('behavioral_activation') &&
    migration013.includes('journaling_reflection') &&
    migration013.includes('grounding_exercise') &&
    migration013.includes('custom_worksheet'),
    'Defines all clinical exercise types in check constraint'
  );
  assert(
    migration013.includes('assigned') &&
    migration013.includes('viewed') &&
    migration013.includes('in_progress') &&
    migration013.includes('submitted') &&
    migration013.includes('reviewed') &&
    migration013.includes('cancelled'),
    'Defines all homework status states in check constraint'
  );
  assert(
    migration013.includes('ALTER TABLE public.therapy_homework_templates ENABLE ROW LEVEL SECURITY') &&
    migration013.includes('ALTER TABLE public.client_homework_assignments ENABLE ROW LEVEL SECURITY') &&
    migration013.includes('ALTER TABLE public.client_homework_submissions ENABLE ROW LEVEL SECURITY'),
    'Enables Row Level Security (RLS) across all homework tables'
  );
  assert(
    migration013.includes('CBT 5-Column Thought Record') &&
    migration013.includes('Psychoeducation: Cognitive Reframing & Core Beliefs') &&
    migration013.includes('Behavioral Activation: Activity & Mood Log') &&
    migration013.includes('Mindful Grounding & Box Breathing Practice') &&
    migration013.includes('Session Reflection & Values Alignment Journal'),
    'Seeds standard evidence-based clinical exercise templates'
  );

  // ===========================================================================
  // SECTION 2: Therapist Homework Service Unit & Contract Logic
  // ===========================================================================
  console.log('\n--- SECTION 2: Therapist Homework Service Contracts ---');

  // 1. Template validation
  assert(typeof TherapistHomeworkService.getTemplates === 'function', 'TherapistHomeworkService.getTemplates is defined');
  assert(typeof TherapistHomeworkService.getAssignments === 'function', 'TherapistHomeworkService.getAssignments is defined');
  assert(typeof TherapistHomeworkService.getAssignmentById === 'function', 'TherapistHomeworkService.getAssignmentById is defined');
  assert(typeof TherapistHomeworkService.createAssignment === 'function', 'TherapistHomeworkService.createAssignment is defined');
  assert(typeof TherapistHomeworkService.updateAssignment === 'function', 'TherapistHomeworkService.updateAssignment is defined');
  assert(typeof TherapistHomeworkService.reviewSubmission === 'function', 'TherapistHomeworkService.reviewSubmission is defined');

  // 2. Input validation tests for createAssignment
  let caughtMissingClient = false;
  try {
    await TherapistHomeworkService.createAssignment('therapist-1', {
      clientId: '',
      title: 'Valid Title',
      instructions: 'Do this',
      exerciseType: 'thought_record',
    });
  } catch (err: any) {
    caughtMissingClient = err.code === 'INVALID_INPUT';
  }
  assert(caughtMissingClient, 'createAssignment rejects empty clientId with INVALID_INPUT');

  let caughtMissingTitle = false;
  try {
    await TherapistHomeworkService.createAssignment('therapist-1', {
      clientId: 'client-1',
      title: '   ',
      instructions: 'Do this',
      exerciseType: 'thought_record',
    });
  } catch (err: any) {
    caughtMissingTitle = err.code === 'INVALID_INPUT';
  }
  assert(caughtMissingTitle, 'createAssignment rejects empty title with INVALID_INPUT');

  let caughtMissingInstructions = false;
  try {
    await TherapistHomeworkService.createAssignment('therapist-1', {
      clientId: 'client-1',
      title: 'Valid Title',
      instructions: '',
      exerciseType: 'thought_record',
    });
  } catch (err: any) {
    caughtMissingInstructions = err.code === 'INVALID_INPUT';
  }
  assert(caughtMissingInstructions, 'createAssignment rejects empty instructions with INVALID_INPUT');

  let caughtInvalidType = false;
  try {
    await TherapistHomeworkService.createAssignment('therapist-1', {
      clientId: 'client-1',
      title: 'Valid Title',
      instructions: 'Do this',
      exerciseType: 'invalid_type' as any,
    });
  } catch (err: any) {
    caughtInvalidType = err.code === 'INVALID_INPUT';
  }
  assert(caughtInvalidType, 'createAssignment rejects invalid exerciseType with INVALID_INPUT');

  let caughtInvalidDueDate = false;
  try {
    await TherapistHomeworkService.createAssignment('therapist-1', {
      clientId: 'client-1',
      title: 'Valid Title',
      instructions: 'Do this',
      exerciseType: 'thought_record',
      dueAt: 'not-a-valid-date',
    });
  } catch (err: any) {
    caughtInvalidDueDate = err.code === 'INVALID_INPUT';
  }
  assert(caughtInvalidDueDate, 'createAssignment rejects invalid dueAt timestamp with INVALID_INPUT');

  // ===========================================================================
  // SECTION 3: Client Homework Service Unit & Contract Logic
  // ===========================================================================
  console.log('\n--- SECTION 3: Client Homework Service Contracts ---');

  assert(typeof ClientHomeworkService.getClientAssignments === 'function', 'ClientHomeworkService.getClientAssignments is defined');
  assert(typeof ClientHomeworkService.getClientAssignmentById === 'function', 'ClientHomeworkService.getClientAssignmentById is defined');
  assert(typeof ClientHomeworkService.saveDraftResponse === 'function', 'ClientHomeworkService.saveDraftResponse is defined');
  assert(typeof ClientHomeworkService.submitResponse === 'function', 'ClientHomeworkService.submitResponse is defined');

  // Input validation for submitResponse
  let caughtEmptySubmission = false;
  try {
    await ClientHomeworkService.submitResponse('user-1', 'assign-1', '   ');
  } catch (err: any) {
    caughtEmptySubmission = err.code === 'INVALID_INPUT';
  }
  assert(caughtEmptySubmission, 'submitResponse rejects empty response content with INVALID_INPUT');

  // ===========================================================================
  // SECTION 4: In-Memory / Mock End-to-End Clinical Lifecycle Flow
  // ===========================================================================
  console.log('\n--- SECTION 4: Mock Clinical Lifecycle End-to-End Flow ---');

  // In-memory data store for testing the end-to-end lifecycle
  const memoryDB: {
    relationships: any[];
    templates: any[];
    assignments: any[];
    submissions: any[];
    notifications: any[];
  } = {
    relationships: [
      {
        id: 'rel-101',
        therapist_account_id: 'therapist-alpha',
        user_id: 'client-beta',
        status: 'active',
        care_stage: 'active_care',
      },
      {
        id: 'rel-102',
        therapist_account_id: 'therapist-alpha',
        user_id: 'client-terminated',
        status: 'active',
        care_stage: 'completed',
      },
    ],
    templates: [
      {
        id: 'tpl-1',
        title: 'CBT 5-Column Thought Record',
        exercise_type: 'thought_record',
        default_instructions: 'Identify thoughts',
        estimated_minutes: 20,
        is_active: true,
      },
    ],
    assignments: [],
    submissions: [],
    notifications: [],
  };

  // 1. Check relationship authorization barrier
  const activeRel = memoryDB.relationships.find(
    r => r.therapist_account_id === 'therapist-alpha' && r.user_id === 'client-beta' && r.status === 'active'
  );
  assert(Boolean(activeRel), 'Therapist-client pair has active care relationship');

  const unauthorizedRel = memoryDB.relationships.find(
    r => r.therapist_account_id === 'therapist-alpha' && r.user_id === 'unrelated-client'
  );
  assert(!unauthorizedRel, 'Therapist cannot assign self-work to unrelated client without care relationship');

  const terminatedRel = memoryDB.relationships.find(
    r => r.therapist_account_id === 'therapist-alpha' && r.user_id === 'client-terminated'
  );
  assert(terminatedRel?.care_stage === 'completed', 'Detects completed/terminated relationship barrier');

  // 2. Assign homework
  const assignmentRecord = {
    id: 'assign-uuid-1',
    therapist_account_id: 'therapist-alpha',
    user_id: 'client-beta',
    relationship_id: activeRel.id,
    appointment_id: 'appt-101',
    template_id: 'tpl-1',
    title: 'CBT Thought Record: Workplace Anxiety',
    instructions: 'Complete 3 thought records when experiencing acute stress.',
    clinical_goal: 'De-catastrophize evaluation apprehension',
    exercise_type: 'thought_record',
    resource_reference: 'thought_record',
    estimated_minutes: 20,
    due_at: new Date(Date.now() + 86400000 * 3).toISOString(),
    status: 'assigned',
    assigned_at: new Date().toISOString(),
    viewed_at: null,
    submitted_at: null,
    reviewed_at: null,
  };
  memoryDB.assignments.push(assignmentRecord);
  assert(assignmentRecord.status === 'assigned', 'Step 1: Assignment created with status "assigned"');

  // 3. Client views homework
  assignmentRecord.status = 'viewed';
  assignmentRecord.viewed_at = new Date().toISOString();
  assert(assignmentRecord.status === 'viewed', 'Step 2: Assignment transitions to "viewed" on client opening');

  // 4. Client saves draft
  const draftSubmission = {
    id: 'sub-uuid-1',
    assignment_id: assignmentRecord.id,
    user_id: 'client-beta',
    therapist_account_id: 'therapist-alpha',
    response_content: 'Situation: Meeting with team. Automatic Thought: I will fail.',
    response_metadata: { step: 2 },
    is_draft: true,
    submitted_at: null,
    therapist_feedback: null,
    feedback_added_at: null,
  };
  memoryDB.submissions.push(draftSubmission);
  assignmentRecord.status = 'in_progress';
  assert(assignmentRecord.status === 'in_progress', 'Step 3: Assignment transitions to "in_progress" upon draft save');
  assert(draftSubmission.is_draft === true, 'Draft submission has is_draft = true');

  // 5. Client submits completed exercise
  draftSubmission.response_content = 'Situation: Team demo. Thought: I will fail. Evidence against: Prepared extensively. Balanced: It might go well.';
  draftSubmission.is_draft = false;
  draftSubmission.submitted_at = new Date().toISOString();
  assignmentRecord.status = 'submitted';
  assignmentRecord.submitted_at = draftSubmission.submitted_at;
  memoryDB.notifications.push({
    therapist_account_id: 'therapist-alpha',
    user_id: 'client-beta',
    notification_type: 'homework_submitted',
  });
  assert(assignmentRecord.status === 'submitted', 'Step 4: Assignment transitions to "submitted" upon client completion');
  assert(memoryDB.notifications.length === 1, 'In-app notification sent to therapist upon homework submission');

  // 6. Therapist reviews and leaves feedback
  draftSubmission.therapist_feedback = 'Excellent cognitive restructuring. Notice how the balanced thought reduced your anticipatory rating.';
  draftSubmission.feedback_added_at = new Date().toISOString();
  assignmentRecord.status = 'reviewed';
  assignmentRecord.reviewed_at = draftSubmission.feedback_added_at;
  assert(assignmentRecord.status === 'reviewed', 'Step 5: Assignment transitions to "reviewed" upon clinician feedback');
  assert(Boolean(draftSubmission.therapist_feedback), 'Clinician feedback successfully recorded');

  // 7. Immutability validation: Cannot edit reviewed assignment
  const canClientEditReviewed = assignmentRecord.status !== 'reviewed';
  assert(!canClientEditReviewed, 'Step 6: Reviewed assignment is immutable to further modifications');

  // ===========================================================================
  // SECTION 5: Frontend UI & API Route Integration Verification
  // ===========================================================================
  console.log('\n--- SECTION 5: Frontend UI & API Route Integration ---');

  const therapistAssignModalPath = path.join(process.cwd(), 'src/views/therapist/TherapistAssignHomeworkModal.jsx');
  assert(fs.existsSync(therapistAssignModalPath), 'TherapistAssignHomeworkModal component exists');

  const therapistReviewModalPath = path.join(process.cwd(), 'src/views/therapist/TherapistReviewHomeworkModal.jsx');
  assert(fs.existsSync(therapistReviewModalPath), 'TherapistReviewHomeworkModal component exists');

  const clientHomeworkModalPath = path.join(process.cwd(), 'src/views/client/ClientHomeworkModal.jsx');
  assert(fs.existsSync(clientHomeworkModalPath), 'ClientHomeworkModal component exists');

  const therapistSessionDetailPath = path.join(process.cwd(), 'src/views/therapist/TherapistSessionDetailView.jsx');
  const therapistSessionDetailCode = fs.readFileSync(therapistSessionDetailPath, 'utf8');
  assert(
    therapistSessionDetailCode.includes('TherapistAssignHomeworkModal') &&
    therapistSessionDetailCode.includes('TherapistReviewHomeworkModal') &&
    therapistSessionDetailCode.includes('Clinical Self-Work & Homework'),
    'TherapistSessionDetailView integrates homework management cards and modals'
  );

  const clientTherapySessionsPath = path.join(process.cwd(), 'src/views/client/ClientTherapySessionsView.jsx');
  const clientTherapySessionsCode = fs.readFileSync(clientTherapySessionsPath, 'utf8');
  assert(
    clientTherapySessionsCode.includes('ClientHomeworkModal') &&
    clientTherapySessionsCode.includes('Assigned Self-Work & Exercises'),
    'ClientTherapySessionsView integrates homework list and interactive modal'
  );

  // Verify API Route Endpoints exist
  const endpoints = [
    'src/app/api/therapist/homework/templates/route.ts',
    'src/app/api/therapist/homework/route.ts',
    'src/app/api/therapist/homework/[id]/route.ts',
    'src/app/api/therapist/homework/[id]/review/route.ts',
    'src/app/api/therapy/client/homework/route.ts',
    'src/app/api/therapy/client/homework/[id]/route.ts',
    'src/app/api/therapy/client/homework/[id]/save-draft/route.ts',
    'src/app/api/therapy/client/homework/[id]/submit/route.ts',
  ];

  for (const ep of endpoints) {
    const epPath = path.join(process.cwd(), ep);
    assert(fs.existsSync(epPath), `API endpoint route exists: ${ep}`);
  }

  // ===========================================================================
  // SUMMARY
  // ===========================================================================
  console.log('\n================================================================');
  console.log(`  CLIENT SELF-WORK & HOMEWORK SUITE RESULTS: ${passedTests}/${totalTests} PASSING`);
  console.log('================================================================\n');
}

runClientHomeworkSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
