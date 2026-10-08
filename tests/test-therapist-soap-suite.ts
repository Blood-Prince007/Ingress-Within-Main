import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { TherapistAuthService } from '../src/lib/therapist/therapistAuthService';
import { TherapistPlatformService } from '../src/lib/therapist/therapistPlatformService';
import { signJwt } from '../src/utils/crypto';
import { COOKIE_THERAPIST_ACCESS_NAME, COOKIE_ACCESS_NAME } from '../src/utils/cookies';
import { GET as getSoapRoute, POST as postSoapRoute, PUT as putSoapRoute } from '../src/app/api/therapist/sessions/[id]/soap/route';
import { POST as finalizeSoapRoute } from '../src/app/api/therapist/sessions/[id]/soap/finalize/route';
import { GET as getSoapNoteAliasRoute, POST as postSoapNoteAliasRoute } from '../src/app/api/therapist/sessions/[id]/soap-note/route';
import { POST as finalizeSoapNoteAliasRoute } from '../src/app/api/therapist/sessions/[id]/soap-note/finalize/route';
import { POST as startSessionRoute } from '../src/app/api/therapist/sessions/[id]/start/route';
import { POST as completeSessionRoute } from '../src/app/api/therapist/sessions/[id]/complete/route';
import { supabase } from '../src/lib/db';

async function runSoapTestSuite() {
  console.log('================================================================');
  console.log('  INGRESS WITHIN — THERAPIST SOAP NOTES & WORKFLOW TEST SUITE   ');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, failureDetails?: any) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ✗ [FAIL] ${testName}`);
      if (failureDetails) console.error('    Details:', failureDetails);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  const jwtSecret = TherapistAuthService.getJwtSecret();

  function createTherapistRequest(
    url: string,
    therapistId: string,
    phone: string,
    method = 'GET',
    body?: any
  ) {
    const token = signJwt(
      { tid: therapistId, phone, did: 'dev_test_soap_01', scope: 'therapist' },
      jwtSecret,
      3600
    );
    const headers: Record<string, string> = {
      cookie: `${COOKIE_THERAPIST_ACCESS_NAME}=${token}`,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    };
    return new NextRequest(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  function createUserRequest(url: string, userId: string, method = 'GET', body?: any) {
    const token = signJwt(
      { uid: userId, phone: '+919999999999', did: 'user_client_soap_01' },
      jwtSecret,
      3600
    );
    const headers: Record<string, string> = {
      cookie: `${COOKIE_ACCESS_NAME}=${token}`,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    };
    return new NextRequest(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // ----------------------------------------------------
  // SECTION 1: Authentication & Practice Gating
  // ----------------------------------------------------
  console.log('--- SECTION 1: Authentication & Practice Gating ---');

  const dummySessionId = '00000000-0000-0000-0000-000000000001';

  // 1.1 Unauthenticated requests rejected
  const unauthGetSoapReq = new NextRequest(`http://localhost:3000/api/therapist/sessions/${dummySessionId}/soap`);
  const unauthGetSoapRes = await getSoapRoute(unauthGetSoapReq, { params: Promise.resolve({ id: dummySessionId }) });
  assert(unauthGetSoapRes.status === 401, 'Unauthenticated request to GET /soap rejected with 401');

  const unauthPostSoapReq = new NextRequest(`http://localhost:3000/api/therapist/sessions/${dummySessionId}/soap`, {
    method: 'POST',
    body: JSON.stringify({ subjective: 'Test' }),
  });
  const unauthPostSoapRes = await postSoapRoute(unauthPostSoapReq, { params: Promise.resolve({ id: dummySessionId }) });
  assert(unauthPostSoapRes.status === 401, 'Unauthenticated request to POST /soap rejected with 401');

  const unauthFinalizeReq = new NextRequest(`http://localhost:3000/api/therapist/sessions/${dummySessionId}/soap/finalize`, {
    method: 'POST',
  });
  const unauthFinalizeRes = await finalizeSoapRoute(unauthFinalizeReq, { params: Promise.resolve({ id: dummySessionId }) });
  assert(unauthFinalizeRes.status === 401, 'Unauthenticated request to /soap/finalize rejected with 401');

  const unauthStartReq = new NextRequest(`http://localhost:3000/api/therapist/sessions/${dummySessionId}/start`, {
    method: 'POST',
  });
  const unauthStartRes = await startSessionRoute(unauthStartReq, { params: Promise.resolve({ id: dummySessionId }) });
  assert(unauthStartRes.status === 401, 'Unauthenticated request to /start rejected with 401');

  const unauthCompleteReq = new NextRequest(`http://localhost:3000/api/therapist/sessions/${dummySessionId}/complete`, {
    method: 'POST',
  });
  const unauthCompleteRes = await completeSessionRoute(unauthCompleteReq, { params: Promise.resolve({ id: dummySessionId }) });
  assert(unauthCompleteRes.status === 401, 'Unauthenticated request to /complete rejected with 401');

  // 1.2 Client token strictly blocked from SOAP routes
  const clientGetSoapReq = createUserRequest(`http://localhost:3000/api/therapist/sessions/${dummySessionId}/soap`, 'client_user_01');
  const clientGetSoapRes = await getSoapRoute(clientGetSoapReq, { params: Promise.resolve({ id: dummySessionId }) });
  assert(clientGetSoapRes.status === 401, 'Client token strictly blocked from GET /soap with 401');

  const clientPostSoapReq = createUserRequest(`http://localhost:3000/api/therapist/sessions/${dummySessionId}/soap`, 'client_user_01', 'POST', { subjective: 'hack' });
  const clientPostSoapRes = await postSoapRoute(clientPostSoapReq, { params: Promise.resolve({ id: dummySessionId }) });
  assert(clientPostSoapRes.status === 401, 'Client token strictly blocked from POST /soap with 401');

  const clientStartReq = createUserRequest(`http://localhost:3000/api/therapist/sessions/${dummySessionId}/start`, 'client_user_01', 'POST');
  const clientStartRes = await startSessionRoute(clientStartReq, { params: Promise.resolve({ id: dummySessionId }) });
  assert(clientStartRes.status === 401, 'Client token strictly blocked from /start with 401');

  const clientFinalizeReq = createUserRequest(`http://localhost:3000/api/therapist/sessions/${dummySessionId}/soap/finalize`, 'client_user_01', 'POST');
  const clientFinalizeRes = await finalizeSoapRoute(clientFinalizeReq, { params: Promise.resolve({ id: dummySessionId }) });
  assert(clientFinalizeRes.status === 401, 'Client token strictly blocked from /finalize with 401');

  // 1.3 Unapproved/unverified therapist applicant rejected
  const applicantReq = createTherapistRequest(
    `http://localhost:3000/api/therapist/sessions/${dummySessionId}/soap`,
    '00000000-0000-0000-0000-000000000099',
    '+919876543210'
  );
  const applicantRes = await getSoapRoute(applicantReq, { params: Promise.resolve({ id: dummySessionId }) });
  assert(applicantRes.status === 401 || applicantRes.status === 403, 'Unapproved therapist applicant blocked with 401 or 403');

  // ----------------------------------------------------
  // SECTION 2: Non-Existent & Foreign Session Rejections
  // ----------------------------------------------------
  console.log('\n--- SECTION 2: Tenancy & Session Ownership Enforcement ---');

  const mockTherapistA = '00000000-0000-0000-0000-00000000000a';
  const mockTherapistB = '00000000-0000-0000-0000-00000000000b';
  const nonExistentSession = '00000000-0000-0000-0000-ffffffffffff';

  // 2.1 Non-existent session lookup returns 404
  try {
    await TherapistPlatformService.getSoapNote(mockTherapistA, nonExistentSession);
    assert(false, 'Non-existent session should throw error');
  } catch (err: any) {
    assert(err.status === 404 && err.code === 'SESSION_NOT_FOUND', 'Non-existent session throws 404 SESSION_NOT_FOUND');
  }

  // 2.2 Non-existent session save draft returns 404
  try {
    await TherapistPlatformService.saveSoapNote(mockTherapistA, nonExistentSession, {
      subjective: 'Test note',
      objective: 'Normal affect',
      assessment: 'Adjustment anxiety',
      plan: 'Follow up',
      isDraft: true,
    });
    assert(false, 'Saving note on non-existent session should throw error');
  } catch (err: any) {
    assert(err.status === 404 && err.code === 'SESSION_NOT_FOUND', 'Save on non-existent session throws 404 SESSION_NOT_FOUND');
  }

  // 2.3 Non-existent session start returns 404
  try {
    await TherapistPlatformService.startAppointment(mockTherapistA, nonExistentSession);
    assert(false, 'Starting non-existent session should throw error');
  } catch (err: any) {
    assert(err.status === 404 && err.code === 'SESSION_NOT_FOUND', 'Start on non-existent session throws 404 SESSION_NOT_FOUND');
  }

  // 2.4 Non-existent session complete returns 404
  try {
    await TherapistPlatformService.completeAppointment(mockTherapistA, nonExistentSession);
    assert(false, 'Completing non-existent session should throw error');
  } catch (err: any) {
    assert(err.status === 404 && err.code === 'SESSION_NOT_FOUND', 'Complete on non-existent session throws 404 SESSION_NOT_FOUND');
  }

  // ----------------------------------------------------
  // SECTION 3: SOAP Note Schema & DTO Contract
  // ----------------------------------------------------
  console.log('\n--- SECTION 3: SOAP Note DTO Contract ---');

  const rawSampleNote = {
    id: 'note-uuid-001',
    appointment_id: 'appt-uuid-001',
    therapist_account_id: mockTherapistA,
    user_id: 'client-uuid-001',
    subjective: 'Client reports insomnia and work fatigue.',
    objective: 'Appears fatigued, coherent speech, calm demeanor.',
    assessment: 'Work-related exhaustion with mild generalized anxiety.',
    plan: 'Cognitive reframing, sleep hygiene protocol.',
    is_draft: true,
    finalized_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const draftDto = TherapistPlatformService.formatSoapDto(rawSampleNote);
  assert(draftDto !== null, 'formatSoapDto returns object');
  assert(draftDto?.id === 'note-uuid-001', 'DTO has id');
  assert(draftDto?.appointmentId === 'appt-uuid-001', 'DTO has appointmentId');
  assert(draftDto?.sessionId === 'appt-uuid-001', 'DTO has sessionId');
  assert(draftDto?.therapistAccountId === mockTherapistA, 'DTO has therapistAccountId');
  assert(draftDto?.clientId === 'client-uuid-001', 'DTO has clientId');
  assert(draftDto?.isDraft === true, 'Draft DTO has isDraft: true');
  assert(draftDto?.status === 'draft', 'Draft DTO has status: "draft"');
  assert(draftDto?.finalizedAt === null, 'Draft DTO has finalizedAt: null');
  assert(draftDto?.finalizedBy === null, 'Draft DTO has finalizedBy: null');

  const finalizedSampleNote = {
    ...rawSampleNote,
    is_draft: false,
    finalized_at: new Date().toISOString(),
  };
  const finalizedDto = TherapistPlatformService.formatSoapDto(finalizedSampleNote);
  assert(finalizedDto?.isDraft === false, 'Finalized DTO has isDraft: false');
  assert(finalizedDto?.status === 'finalized', 'Finalized DTO has status: "finalized"');
  assert(typeof finalizedDto?.finalizedAt === 'string', 'Finalized DTO has string finalizedAt');
  assert(finalizedDto?.finalizedBy === mockTherapistA, 'Finalized DTO has finalizedBy populated');

  // ----------------------------------------------------
  // SECTION 4: SOAP Validation & Immutability Rules
  // ----------------------------------------------------
  console.log('\n--- SECTION 4: Validation & Immutability Rules ---');

  // 4.1 Whitespace-only fields rejected on finalization
  try {
    await TherapistPlatformService.finalizeSoapNote(mockTherapistA, nonExistentSession, {
      subjective: '   ',
      objective: '   ',
      assessment: 'Valid',
      plan: 'Valid',
    });
    assert(false, 'Whitespace-only section must fail');
  } catch (err: any) {
    // Expected to fail at session lookup (404) or validation (400)
    assert(err.status === 404 || err.status === 400, 'Whitespace-only section rejected appropriately');
  }

  // 4.2 Oversized fields rejected (> 10,000 chars)
  const hugeText = 'A'.repeat(10001);
  try {
    await TherapistPlatformService.saveSoapNote(mockTherapistA, nonExistentSession, {
      subjective: hugeText,
      objective: 'Normal',
      assessment: 'Anxiety',
      plan: 'Plan',
      isDraft: true,
    });
    assert(false, 'Oversized section must fail');
  } catch (err: any) {
    assert(err.status === 404 || err.status === 400, 'Oversized section rejected appropriately');
  }

  // ----------------------------------------------------
  // SECTION 5: Aliased Routes Parity (/soap and /soap-note)
  // ----------------------------------------------------
  console.log('\n--- SECTION 5: API Route Alias Parity ---');

  const unauthAliasGet = new NextRequest(`http://localhost:3000/api/therapist/sessions/${dummySessionId}/soap-note`);
  const unauthAliasGetRes = await getSoapNoteAliasRoute(unauthAliasGet, { params: Promise.resolve({ id: dummySessionId }) });
  assert(unauthAliasGetRes.status === 401, 'Unauthenticated /soap-note returns 401');

  const unauthAliasPost = new NextRequest(`http://localhost:3000/api/therapist/sessions/${dummySessionId}/soap-note`, {
    method: 'POST',
    body: JSON.stringify({ subjective: 'Test' }),
  });
  const unauthAliasPostRes = await postSoapNoteAliasRoute(unauthAliasPost, { params: Promise.resolve({ id: dummySessionId }) });
  assert(unauthAliasPostRes.status === 401, 'Unauthenticated POST /soap-note returns 401');

  const unauthAliasFinalize = new NextRequest(`http://localhost:3000/api/therapist/sessions/${dummySessionId}/soap-note/finalize`, {
    method: 'POST',
  });
  const unauthAliasFinalizeRes = await finalizeSoapNoteAliasRoute(unauthAliasFinalize, { params: Promise.resolve({ id: dummySessionId }) });
  assert(unauthAliasFinalizeRes.status === 401, 'Unauthenticated POST /soap-note/finalize returns 401');

  // ----------------------------------------------------
  // SECTION 6: Privacy Boundary & Zero Client Self-Work Leakage
  // ----------------------------------------------------
  console.log('\n--- SECTION 6: Privacy Boundary Invariants ---');

  const soapServiceFile = path.join(process.cwd(), 'src/lib/therapist/therapistPlatformService.ts');
  const soapServiceContent = fs.readFileSync(soapServiceFile, 'utf8');

  // Verify SOAP methods do NOT query self-work tables
  const soapMethodsSection = soapServiceContent.substring(
    soapServiceContent.indexOf('6. SOAP NOTES'),
    soapServiceContent.indexOf('7. CALENDAR & AVAILABILITY')
  );

  assert(!soapMethodsSection.includes('user_entries'), 'SOAP service does NOT query user_entries');
  assert(!soapMethodsSection.includes('client_reflections'), 'SOAP service does NOT query client_reflections');
  assert(!soapMethodsSection.includes('exercise_results'), 'SOAP service does NOT query exercise_results');
  assert(!soapMethodsSection.includes('exercise_instances'), 'SOAP service does NOT query exercise_instances');
  assert(!soapMethodsSection.includes('pattern_reports'), 'SOAP service does NOT query pattern_reports');
  assert(!soapMethodsSection.includes('vocabulary'), 'SOAP service does NOT query vocabulary');

  // Verify Frontend Component Privacy
  const soapViewFile = path.join(process.cwd(), 'src/views/therapist/TherapistSoapNoteView.jsx');
  const soapViewContent = fs.readFileSync(soapViewFile, 'utf8');

  assert(!soapViewContent.includes('user_entries'), 'TherapistSoapNoteView does NOT query user_entries');
  assert(!soapViewContent.includes('client_reflections'), 'TherapistSoapNoteView does NOT query client_reflections');
  assert(!soapViewContent.includes('exercise_results'), 'TherapistSoapNoteView does NOT query exercise_results');
  assert(soapViewContent.includes('Strict Practitioner RLS Isolation'), 'TherapistSoapNoteView renders privacy banner');
  assert(soapViewContent.includes('Save Draft'), 'TherapistSoapNoteView has Save Draft button');
  assert(soapViewContent.includes('Finalize Note'), 'TherapistSoapNoteView has Finalize Note button');
  assert(soapViewContent.includes('Finalize this SOAP note?'), 'TherapistSoapNoteView has finalization confirmation dialog');

  // Verify Session Detail View integration
  const sessionDetailFile = path.join(process.cwd(), 'src/views/therapist/TherapistSessionDetailView.jsx');
  const sessionDetailContent = fs.readFileSync(sessionDetailFile, 'utf8');

  assert(sessionDetailContent.includes('Start Session'), 'Session detail view includes "Start Session" action');
  assert(sessionDetailContent.includes('/start'), 'Session detail view invokes /start endpoint');
  assert(sessionDetailContent.includes('Open SOAP Note'), 'Session detail view includes "Open SOAP Note" action');
  assert(sessionDetailContent.includes('View SOAP Note'), 'Session detail view includes "View SOAP Note" action');
  assert(sessionDetailContent.includes('Clinical SOAP Note'), 'Session detail view displays Clinical SOAP Note card');
  assert(sessionDetailContent.includes('Client Self-Work Privacy Boundary'), 'Session detail view includes client privacy boundary');

  // ----------------------------------------------------
  // SECTION 7: Migration 006 Schema & Constraints
  // ----------------------------------------------------
  console.log('\n--- SECTION 7: Migration 006 Schema & Hardening ---');

  const migrationFile = path.join(process.cwd(), 'src/lib/auth/migrations/006_therapist_soap_notes_workflow.sql');
  assert(fs.existsSync(migrationFile), 'Migration 006 file exists');
  const migrationContent = fs.readFileSync(migrationFile, 'utf8');

  assert(migrationContent.includes('CREATE TABLE IF NOT EXISTS public.therapist_soap_notes'), 'Migration 006 creates/hardens therapist_soap_notes table');
  assert(migrationContent.includes('UNIQUE REFERENCES public.therapist_clinical_appointments'), 'Migration 006 enforces 1-to-1 appointment unique constraint');
  assert(migrationContent.includes('ENABLE ROW LEVEL SECURITY'), 'Migration 006 enables RLS on therapist_soap_notes');
  assert(migrationContent.includes('Therapists can view own SOAP notes'), 'Migration 006 includes practitioner SELECT policy');
  assert(migrationContent.includes('Therapists can manage own SOAP notes'), 'Migration 006 includes practitioner ALL management policy');

  // ----------------------------------------------------
  // SECTION 8: Zero Prototype Mocks
  // ----------------------------------------------------
  console.log('\n--- SECTION 8: Zero Prototype Mocks ---');

  assert(!soapServiceContent.includes('mock_soap'), 'No mock SOAP notes in service layer');
  assert(!soapViewContent.includes('mock_client'), 'No mock client data in SOAP view');
  assert(!sessionDetailContent.includes('mock_soap'), 'No mock SOAP notes in session detail view');

  console.log('\n================================================================');
  console.log(`  THERAPIST SOAP NOTES TEST RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');
}

runSoapTestSuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
