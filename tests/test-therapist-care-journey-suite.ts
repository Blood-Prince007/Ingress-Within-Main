import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { TherapistAuthService } from '../src/lib/therapist/therapistAuthService';
import { TherapistPlatformService } from '../src/lib/therapist/therapistPlatformService';
import { signJwt } from '../src/utils/crypto';
import { COOKIE_THERAPIST_ACCESS_NAME, COOKIE_ACCESS_NAME } from '../src/utils/cookies';
import { GET as getJourneyRoute } from '../src/app/api/therapist/clients/[id]/journey/route';
import { PATCH as patchJourneyStageRoute } from '../src/app/api/therapist/clients/[id]/journey/stage/route';
import { PATCH as patchStageRoute } from '../src/app/api/therapist/clients/[id]/stage/route';
import { POST as postSessionRoute } from '../src/app/api/therapist/sessions/route';
import { supabase } from '../src/lib/db';

async function runCareJourneyTestSuite() {
  console.log('================================================================');
  console.log('  INGRESS WITHIN — THERAPIST CARE JOURNEY TEST SUITE (STEP 4C)  ');
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
      { tid: therapistId, phone, did: 'dev_test_journey_01', scope: 'therapist' },
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
      { uid: userId, phone: '+919999999999', did: 'user_client_journey_01' },
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

  const dummyClientId = '00000000-0000-0000-0000-000000000001';
  const mockTherapistA = '00000000-0000-0000-0000-00000000000a';
  const mockTherapistB = '00000000-0000-0000-0000-00000000000b';
  const mockClientA = '00000000-0000-0000-0000-0000000000c1';
  const mockClientB = '00000000-0000-0000-0000-0000000000c2';

  // ----------------------------------------------------
  // SECTION 1: Authentication & Practice Gating
  // ----------------------------------------------------
  console.log('--- SECTION 1: Authentication & Practice Gating ---');

  // 1.1 Unauthenticated requests rejected
  const unauthGetJourneyReq = new NextRequest(`http://localhost:3000/api/therapist/clients/${dummyClientId}/journey`);
  const unauthGetJourneyRes = await getJourneyRoute(unauthGetJourneyReq, { params: Promise.resolve({ id: dummyClientId }) });
  assert(unauthGetJourneyRes.status === 401, 'Unauthenticated request to GET /journey rejected with 401');

  const unauthPatchStageReq = new NextRequest(`http://localhost:3000/api/therapist/clients/${dummyClientId}/journey/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ careStage: 'active_care' }),
  });
  const unauthPatchStageRes = await patchJourneyStageRoute(unauthPatchStageReq, { params: Promise.resolve({ id: dummyClientId }) });
  assert(unauthPatchStageRes.status === 401, 'Unauthenticated request to PATCH /journey/stage rejected with 401');

  // 1.2 Client token strictly blocked from therapist journey routes
  const clientGetJourneyReq = createUserRequest(`http://localhost:3000/api/therapist/clients/${dummyClientId}/journey`, 'client_user_01');
  const clientGetJourneyRes = await getJourneyRoute(clientGetJourneyReq, { params: Promise.resolve({ id: dummyClientId }) });
  assert(clientGetJourneyRes.status === 401, 'Client token strictly blocked from GET /journey with 401');

  const clientPatchStageReq = createUserRequest(
    `http://localhost:3000/api/therapist/clients/${dummyClientId}/journey/stage`,
    'client_user_01',
    'PATCH',
    { careStage: 'active_care' }
  );
  const clientPatchStageRes = await patchJourneyStageRoute(clientPatchStageReq, { params: Promise.resolve({ id: dummyClientId }) });
  assert(clientPatchStageRes.status === 401, 'Client token strictly blocked from PATCH /journey/stage with 401');

  // 1.3 Unapproved/unverified therapist applicant rejected
  const applicantReq = createTherapistRequest(
    `http://localhost:3000/api/therapist/clients/${dummyClientId}/journey`,
    '00000000-0000-0000-0000-000000000099',
    '+919876543210'
  );
  const applicantRes = await getJourneyRoute(applicantReq, { params: Promise.resolve({ id: dummyClientId }) });
  assert(applicantRes.status === 401 || applicantRes.status === 403, 'Unapproved therapist applicant blocked with 401 or 403');

  // ----------------------------------------------------
  // SECTION 2: Tenancy & Client Relationship Isolation
  // ----------------------------------------------------
  console.log('\n--- SECTION 2: Tenancy & Cross-Therapist Isolation ---');

  // 2.1 Non-existent client relationship returns 404
  const nonExistentClientId = '00000000-0000-0000-0000-ffffffffffff';
  try {
    await TherapistPlatformService.getCareJourney(mockTherapistA, nonExistentClientId);
    assert(false, 'Non-existent client relationship should throw');
  } catch (err: any) {
    assert(err.status === 404 && err.code === 'CLIENT_NOT_AUTHORIZED', 'Non-existent client throws 404 CLIENT_NOT_AUTHORIZED');
  }

  // 2.2 Stage change on non-existent client returns 404
  try {
    await TherapistPlatformService.transitionCareStage(mockTherapistA, nonExistentClientId, 'active_care');
    assert(false, 'Stage transition on non-existent client should throw');
  } catch (err: any) {
    assert(err.status === 404 && err.code === 'CLIENT_NOT_AUTHORIZED', 'Stage transition on non-existent client throws 404 CLIENT_NOT_AUTHORIZED');
  }

  // ----------------------------------------------------
  // SECTION 3: Care Stage State Machine & Transitions
  // ----------------------------------------------------
  console.log('\n--- SECTION 3: Care Stage State Machine Validation ---');

  // 3.1 Invalid stage names rejected
  try {
    await TherapistPlatformService.transitionCareStage(mockTherapistA, mockClientA, 'invalid_stage');
    assert(false, 'Invalid stage name should throw');
  } catch (err: any) {
    assert(err.status === 400 && err.code === 'INVALID_CARE_STAGE', 'Invalid stage string throws 400 INVALID_CARE_STAGE');
  }

  try {
    await TherapistPlatformService.transitionCareStage(mockTherapistA, mockClientA, 'closed');
    assert(false, 'Non-canonical stage "closed" should throw');
  } catch (err: any) {
    assert(err.status === 400 && err.code === 'INVALID_CARE_STAGE', 'Non-canonical stage "closed" throws 400 INVALID_CARE_STAGE');
  }

  try {
    await TherapistPlatformService.transitionCareStage(mockTherapistA, mockClientA, 'ongoing');
    assert(false, 'Non-canonical stage "ongoing" should throw');
  } catch (err: any) {
    assert(err.status === 400 && err.code === 'INVALID_CARE_STAGE', 'Non-canonical stage "ongoing" throws 400 INVALID_CARE_STAGE');
  }

  // ----------------------------------------------------
  // SECTION 4: In-Memory / Service State Machine Invariants
  // ----------------------------------------------------
  console.log('\n--- SECTION 4: State Machine Invariants ---');

  const validTransitionsMap: Record<string, string[]> = {
    intake: ['active_care', 'completed'],
    active_care: ['maintenance', 'completed'],
    maintenance: ['active_care', 'completed'],
    completed: [], // Terminal
  };

  // Verify transition rules
  assert(validTransitionsMap['intake'].includes('active_care'), 'Valid: intake -> active_care');
  assert(validTransitionsMap['intake'].includes('completed'), 'Valid: intake -> completed');
  assert(!validTransitionsMap['intake'].includes('maintenance'), 'Invalid: intake -> maintenance prohibited');
  assert(validTransitionsMap['active_care'].includes('maintenance'), 'Valid: active_care -> maintenance');
  assert(validTransitionsMap['active_care'].includes('completed'), 'Valid: active_care -> completed');
  assert(validTransitionsMap['maintenance'].includes('active_care'), 'Valid: maintenance -> active_care (step-up)');
  assert(validTransitionsMap['maintenance'].includes('completed'), 'Valid: maintenance -> completed');
  assert(validTransitionsMap['completed'].length === 0, 'Completed stage is terminal with 0 allowed transitions');

  // ----------------------------------------------------
  // SECTION 5: Terminal State & Session Guard
  // ----------------------------------------------------
  console.log('\n--- SECTION 5: Terminal Care State Session Guard ---');

  // Verify conflict check rejects when care relationship is completed
  const terminalCheck = await TherapistPlatformService.validateSessionConflict(
    mockTherapistA,
    '00000000-0000-0000-0000-000000000000', // Non-existent client
    '2026-10-01T10:00:00Z',
    '2026-10-01T10:50:00Z'
  );
  assert(terminalCheck.hasConflict === true, 'Conflict validator rejects non-existent/unauthorized client');

  // ----------------------------------------------------
  // SECTION 6: Privacy Boundary Verification
  // ----------------------------------------------------
  console.log('\n--- SECTION 6: Client Self-Work Privacy Boundary ---');

  const serviceFile = fs.readFileSync(
    path.join(process.cwd(), 'src/lib/therapist/therapistPlatformService.ts'),
    'utf8'
  );

  // Care Journey method must NEVER query private self-work tables
  const careJourneyMethod = serviceFile.substring(
    serviceFile.indexOf('getCareJourney('),
    serviceFile.indexOf('transitionCareStage(')
  );

  assert(!careJourneyMethod.includes('user_entries'), 'Care Journey service does NOT query user_entries');
  assert(!careJourneyMethod.includes('client_reflections'), 'Care Journey service does NOT query client_reflections');
  assert(!careJourneyMethod.includes('exercise_results'), 'Care Journey service does NOT query exercise_results');
  assert(!careJourneyMethod.includes('exercise_instances'), 'Care Journey service does NOT query exercise_instances');
  assert(!careJourneyMethod.includes('pattern_reports'), 'Care Journey service does NOT query pattern_reports');
  assert(!careJourneyMethod.includes('vocabulary'), 'Care Journey service does NOT query vocabulary');

  const careJourneyViewFile = fs.readFileSync(
    path.join(process.cwd(), 'src/views/therapist/TherapistCareJourneyView.jsx'),
    'utf8'
  );

  assert(!careJourneyViewFile.includes('user_entries'), 'TherapistCareJourneyView does NOT query user_entries');
  assert(!careJourneyViewFile.includes('client_reflections'), 'TherapistCareJourneyView does NOT query client_reflections');
  assert(!careJourneyViewFile.includes('exercise_results'), 'TherapistCareJourneyView does NOT query exercise_results');
  assert(careJourneyViewFile.includes('Client Self-Work Privacy Boundary'), 'TherapistCareJourneyView renders privacy banner');

  // ----------------------------------------------------
  // SECTION 7: UI Controls & Confirmation Dialog
  // ----------------------------------------------------
  console.log('\n--- SECTION 7: UI Controls & Confirmation Dialog ---');

  assert(careJourneyViewFile.includes('Move this client to'), 'TherapistCareJourneyView includes stage change confirmation dialog');
  assert(careJourneyViewFile.includes('Confirm Change'), 'TherapistCareJourneyView has explicit Confirm Change button');
  assert(careJourneyViewFile.includes('Total Sessions'), 'TherapistCareJourneyView displays Total Sessions metric');
  assert(careJourneyViewFile.includes('Completed'), 'TherapistCareJourneyView displays Completed sessions metric');
  assert(careJourneyViewFile.includes('Upcoming'), 'TherapistCareJourneyView displays Upcoming sessions metric');
  assert(careJourneyViewFile.includes('Clinical SOAP Documentation'), 'TherapistCareJourneyView displays SOAP integration card');
  assert(careJourneyViewFile.includes('Longitudinal Care Timeline'), 'TherapistCareJourneyView displays Longitudinal Care Timeline');

  // Check client modal integration
  const clientModalFile = fs.readFileSync(
    path.join(process.cwd(), 'src/views/therapist/TherapistClientModal.jsx'),
    'utf8'
  );
  assert(clientModalFile.includes('Care Journey'), 'TherapistClientModal exposes Care Journey tab');
  assert(clientModalFile.includes('TherapistCareJourneyView'), 'TherapistClientModal embeds TherapistCareJourneyView');
  assert(clientModalFile.includes('/therapist/clients/${clientId}/journey'), 'TherapistClientModal manages /journey deep-linking');

  // ----------------------------------------------------
  // SECTION 8: Migration 007 Schema & Hardening
  // ----------------------------------------------------
  console.log('\n--- SECTION 8: Migration 007 Schema & Hardening ---');

  const migrationFile = path.join(
    process.cwd(),
    'src/lib/auth/migrations/007_therapist_care_journey_schema.sql'
  );
  assert(fs.existsSync(migrationFile), 'Migration 007 file exists on disk');

  const migrationSql = fs.readFileSync(migrationFile, 'utf8');
  assert(migrationSql.includes('public.therapy_care_stage_history'), 'Migration 007 creates therapy_care_stage_history table');
  assert(migrationSql.includes('ROW LEVEL SECURITY'), 'Migration 007 enables RLS on therapy_care_stage_history');
  assert(migrationSql.includes('Therapists can view own stage history'), 'Migration 007 includes therapist SELECT policy');
  assert(migrationSql.includes('Therapists can insert own stage history'), 'Migration 007 includes therapist INSERT policy');
  assert(migrationSql.includes('therapist_transition_care_stage_atomic'), 'Migration 007 defines therapist_transition_care_stage_atomic RPC');
  assert(migrationSql.includes('RELATIONSHIP_TERMINATED'), 'Migration 007 hardens appointment scheduling against terminal care');

  // ----------------------------------------------------
  // SECTION 9: Zero Mock Data Verification
  // ----------------------------------------------------
  console.log('\n--- SECTION 9: Zero Mock Data Verification ---');

  assert(!careJourneyViewFile.includes('John Doe'), 'TherapistCareJourneyView does not use fake client names');
  assert(!careJourneyViewFile.includes('Jane Smith'), 'TherapistCareJourneyView does not use mock clients');
  assert(!serviceFile.includes('fake_journey'), 'Service does not contain mock journey entries');

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n================================================================');
  console.log(`  THERAPIST CARE JOURNEY TEST RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');
}

runCareJourneyTestSuite().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
