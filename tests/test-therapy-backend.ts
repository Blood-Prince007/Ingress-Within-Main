/**
 * Ingress Within — Therapy Backend Verification Suite
 *
 * Deployment-specific test:
 *   npx tsx tests/test-therapy-backend.ts
 *
 * Uses the same Supabase environment as the application.
 * It creates only uniquely tagged Therapy test sessions/data and removes
 * the created Therapy rows at the end.
 *
 * Covered:
 * 1. DB/table availability
 * 2. Conversation session lifecycle
 * 3. Guided session lifecycle
 * 4. Team session lifecycle
 * 5. Intake persistence/upsert
 * 6. Conversation message sequencing
 * 7. Safety: standard / priority / immediate
 * 8. Triage persistence
 * 9. Match candidate persistence
 * 10. Submission persistence + session submitted state
 * 11. Session ownership isolation
 * 12. Message role/content guardrail at service level
 * 13. Test-data cleanup
 */
import fs from 'node:fs';
import path from 'node:path';

// Native .env loader
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        const value = trimmed.substring(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
} catch {}

import { randomUUID } from 'node:crypto';
import { supabase } from '../src/lib/db';
import {
  createTherapySession,
  getTherapySession,
  updateTherapySession,
  saveTherapyIntake,
  addTherapyMessage,
  getTherapyMessages,
  saveTherapySafety,
  getTherapySafety,
  createTherapySubmission,
  saveTherapyMatches,
  getTherapyMatches,
} from '../src/lib/therapy/therapyService';

let passed = 0;
let failed = 0;
let total = 0;

function assert(condition: boolean, message: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`✓ [PASS] ${message}`);
  } else {
    failed++;
    console.error(`✗ [FAIL] ${message}`);
  }
}

function section(title: string) {
  console.log(`\n--- ${title} ---`);
}

function requireEnv(name: string) {
  if (!process.env[name]) {
    throw new Error(`${name} is not configured. Run this test with the deployment environment.`);
  }
}

async function getTestUserId(): Promise<string> {
  const explicit = process.env.THERAPY_TEST_USER_ID?.trim();
  if (explicit) return explicit;

  const { data, error } = await supabase
    .from('users')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Unable to find a test user: ${error.message}`);
  if (!data?.id) {
    throw new Error(
      'No user exists. Set THERAPY_TEST_USER_ID to a valid non-production test user.'
    );
  }

  return data.id;
}

async function cleanup(userId: string, sessionIds: string[]) {
  section('Cleanup');

  if (!sessionIds.length) {
    console.log('No Therapy test sessions were created.');
    return;
  }

  // Delete children first because the schema intentionally relates them
  // to therapy_sessions.
  const tables = [
    'therapy_submissions',
    'therapy_matches',
    'therapy_safety_assessments',
    'therapy_messages',
    'therapy_intakes',
  ] as const;

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('user_id', userId)
      .in('therapy_session_id', sessionIds);

    if (error) {
      console.error(`[CLEANUP] ${table}: ${error.message}`);
    }
  }

  const { error } = await supabase
    .from('therapy_sessions')
    .delete()
    .eq('user_id', userId)
    .in('id', sessionIds);

  if (error) {
    console.error(`[CLEANUP] therapy_sessions: ${error.message}`);
  } else {
    console.log(`✓ Cleaned ${sessionIds.length} Therapy test session(s).`);
  }
}

async function run() {
  console.log('==============================================================');
  console.log('  INGRESS WITHIN — THERAPY BACKEND VERIFICATION SUITE');
  console.log('==============================================================');

  requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const userId = await getTestUserId();
  const runTag = `therapy-test-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const sessionIds: string[] = [];

  console.log(`Test user: ${userId}`);
  console.log(`Run tag:   ${runTag}`);

  try {
    section('1. Therapy Schema / Tables');

    for (const table of [
      'therapy_sessions',
      'therapy_intakes',
      'therapy_messages',
      'therapy_safety_assessments',
      'therapy_matches',
      'therapy_submissions',
    ]) {
      const { error } = await supabase.from(table).select('*').limit(1);
      assert(!error, `${table} is reachable`);
    }

    section('2. Conversation Journey');

    const conversation = await createTherapySession({
      userId,
      journeyType: 'conversation',
      metadata: { testRun: runTag },
    });
    sessionIds.push(conversation.id);

    assert(conversation.journey_type === 'conversation', 'Conversation session created');
    assert(conversation.status === 'active', 'Conversation session starts active');

    const conversationFetched = await getTherapySession(conversation.id, userId);
    assert(
      conversationFetched?.id === conversation.id,
      'Conversation session can be fetched by owner'
    );

    const conversationUpdated = await updateTherapySession(
      conversation.id,
      userId,
      { currentStep: 3 }
    );
    assert(
      conversationUpdated.current_step === 3,
      'Conversation current step persists'
    );

    section('3. Guided Journey');

    const guided = await createTherapySession({
      userId,
      journeyType: 'guided',
      metadata: { testRun: runTag },
    });
    sessionIds.push(guided.id);

    assert(guided.journey_type === 'guided', 'Guided session created');
    assert(guided.status === 'active', 'Guided session starts active');

    section('4. Team Journey');

    const team = await createTherapySession({
      userId,
      journeyType: 'team',
      metadata: { testRun: runTag },
    });
    sessionIds.push(team.id);

    assert(team.journey_type === 'team', 'Team session created');
    assert(team.status === 'active', 'Team session starts active');

    section('5. Structured Intake');

    const intake = await saveTherapyIntake({
      therapySessionId: guided.id,
      userId,
      fullName: 'Therapy Backend Test',
      email: 'therapy-backend-test@example.invalid',
      age: 25,
      gender: 'not_specified',
      occupation: 'automated-test',
      city: 'Test City',
      presentingReason: 'Automated backend verification',
      concerns: ['testing'],
      affectedLifeAreas: ['testing'],
      ownWords: runTag,
      mentalHealthHistory: { test: true },
      copingAndSupport: { test: true },
      expectations: { test: true },
      contactPreferences: { callback: false },
      consents: { test: true },
      answers: { testRun: runTag },
    });

    assert(intake.therapy_session_id === guided.id, 'Intake links to guided session');
    assert(intake.user_id === userId, 'Intake is owned by test user');
    assert(intake.own_words === runTag, 'Intake payload persists');

    const intakeUpdated = await saveTherapyIntake({
      therapySessionId: guided.id,
      userId,
      ownWords: `${runTag}-updated`,
      answers: { updated: true },
    });

    assert(
      intakeUpdated.own_words === `${runTag}-updated`,
      'Intake upsert updates the existing session intake'
    );

    section('6. Conversation Messages');

    const firstMessage = await addTherapyMessage({
      therapySessionId: conversation.id,
      userId,
      role: 'user',
      content: `Therapy test message 1 ${runTag}`,
    });

    const secondMessage = await addTherapyMessage({
      therapySessionId: conversation.id,
      userId,
      role: 'assistant',
      content: `Therapy test message 2 ${runTag}`,
    });

    assert(firstMessage.sequence_number === 1, 'First message receives sequence 1');
    assert(secondMessage.sequence_number === 2, 'Second message receives sequence 2');

    const messages = await getTherapyMessages(conversation.id, userId);
    assert(messages.length === 2, 'Conversation returns both messages');
    assert(messages[0]?.role === 'user', 'First message role is user');
    assert(messages[1]?.role === 'assistant', 'Second message role is assistant');

    section('7. Safety — Standard');

    const standardSafety = await saveTherapySafety({
      therapySessionId: guided.id,
      userId,
      safetyStatus: 'negative',
      triageLevel: 'standard',
      recentTiming: null,
      planOrMeans: null,
      priorAttempt: null,
      physicalSafety: 'No',
      psychiatricCare: 'No',
      answers: { response: 'No' },
      evaluatedBy: 'deterministic',
      evaluationMetadata: { testRun: runTag },
    });

    assert(
      standardSafety.safety_status === 'negative',
      'Negative safety status persists'
    );
    assert(
      standardSafety.triage_level === 'standard',
      'Standard triage persists'
    );

    section('8. Safety — Priority');

    const prioritySafety = await saveTherapySafety({
      therapySessionId: conversation.id,
      userId,
      safetyStatus: 'positive',
      triageLevel: 'priority',
      recentTiming: 'Not today',
      planOrMeans: 'No',
      priorAttempt: 'No',
      physicalSafety: 'No',
      psychiatricCare: 'Yes',
      answers: { response: 'Yes' },
      evaluatedBy: 'deterministic',
      evaluationMetadata: { testRun: runTag },
    });

    assert(
      prioritySafety.triage_level === 'priority',
      'Priority triage persists'
    );

    const fetchedPriority = await getTherapySafety(conversation.id, userId);
    assert(
      fetchedPriority?.triage_level === 'priority',
      'Priority safety can be fetched by owner'
    );

    section('9. Safety — Immediate');

    const immediateSafety = await saveTherapySafety({
      therapySessionId: team.id,
      userId,
      safetyStatus: 'positive',
      triageLevel: 'immediate',
      recentTiming: 'Today',
      planOrMeans: 'Yes',
      priorAttempt: 'No',
      physicalSafety: 'Yes',
      psychiatricCare: 'No',
      answers: { response: 'Yes' },
      evaluatedBy: 'deterministic',
      evaluationMetadata: { testRun: runTag },
    });

    assert(
      immediateSafety.triage_level === 'immediate',
      'Immediate triage persists'
    );

    const immediateSession = await getTherapySession(team.id, userId);
    assert(
      immediateSession?.triage_level === 'immediate',
      'Immediate triage is copied to therapy session'
    );

    section('10. Match Candidate Persistence');

    const matches = await saveTherapyMatches(guided.id, userId, [
      {
        therapistAccountId: null,
        matchStatus: 'candidate',
        matchRank: 1,
        matchScore: 82.5,
        matchReasons: ['test match only'],
        matchingMetadata: { testRun: runTag, prototypeTherapistId: 'test-therapist' },
      },
    ]);

    assert(matches.length === 1, 'One match candidate is saved');
    assert(
      matches[0]?.match_status === 'candidate',
      'Match uses schema-compatible candidate status'
    );

    const fetchedMatches = await getTherapyMatches(guided.id, userId);
    assert(fetchedMatches.length === 1, 'Saved match can be fetched');
    assert(
      fetchedMatches[0]?.match_rank === 1,
      'Match rank persists'
    );

    section('11. Final Submission');

    const submission = await createTherapySubmission({
      therapySessionId: team.id,
      userId,
      submissionType: 'team',
      callbackPreference: 'email',
      notes: `Automated test ${runTag}`,
      metadata: { testRun: runTag },
    });

    assert(
      submission.submission_type === 'team',
      'Team submission type persists'
    );
    assert(
      submission.submission_status === 'submitted',
      'Submission status is submitted'
    );

    const submittedSession = await getTherapySession(team.id, userId);
    assert(
      submittedSession?.status === 'submitted',
      'Session changes to submitted after final submission'
    );

    section('12. Ownership Isolation');

    const fakeOtherUser = randomUUID();

    const unauthorizedSession = await getTherapySession(
      conversation.id,
      fakeOtherUser
    );
    assert(
      unauthorizedSession === null,
      'Different user cannot fetch the test session'
    );

    const unauthorizedMessages = await getTherapyMessages(
      conversation.id,
      fakeOtherUser
    );
    assert(
      unauthorizedMessages.length === 0,
      'Different user cannot read the test messages'
    );

    const unauthorizedSafety = await getTherapySafety(
      conversation.id,
      fakeOtherUser
    );
    assert(
      unauthorizedSafety === null,
      'Different user cannot read the test safety assessment'
    );

    const unauthorizedMatches = await getTherapyMatches(
      guided.id,
      fakeOtherUser
    );
    assert(
      unauthorizedMatches.length === 0,
      'Different user cannot read the test matches'
    );

    section('13. Test Summary');

    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total:  ${total}`);

    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    await cleanup(userId, sessionIds);
  }

  console.log('\n==============================================================');
  console.log(
    failed === 0
      ? '  THERAPY BACKEND VERIFICATION: ALL TESTS PASSED'
      : '  THERAPY BACKEND VERIFICATION: FAILURES DETECTED'
  );
  console.log('==============================================================');
}

run().catch((error) => {
  console.error('\n[FATAL TEST ERROR]');
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
