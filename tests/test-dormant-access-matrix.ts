import { NextRequest } from 'next/server';
process.env.BYPASS_REDIS = 'true';
import { supabase } from '../src/lib/db';
import { AccessControlService } from '../src/lib/billing/accessControlService';
import { CycleSync } from '../src/lib/cycles/cycleSync';
import { signJwt } from '../src/utils/crypto';
import { COOKIE_ACCESS_NAME } from '../src/utils/cookies';
import { GET as getCycles } from '../src/app/api/cycles/route';
import { GET as getCycleById } from '../src/app/api/cycles/[id]/route';
import { GET as getEntries, POST as postEntries } from '../src/app/api/entries/route';
import { GET as getReports } from '../src/app/api/reports/route';
import { GET as getFirstWeekly } from '../src/app/api/reports/first-weekly/route';
import { GET as getReportById } from '../src/app/api/reports/[id]/route';
import { POST as postGenerateReport } from '../src/app/api/reports/generate/route';
import { GET as getPatterns } from '../src/app/api/patterns/route';
import { POST as postGeneratePattern } from '../src/app/api/patterns/generate/route';
import { POST as postStartExercise } from '../src/app/api/exercises/start/route';
import { POST as postSubmitExercise } from '../src/app/api/exercises/submit/route';
import { POST as postSession } from '../src/app/api/session/route';

let passed = 0;
let failed = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS ${passed}] ${desc}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${desc}`);
  }
}

function makeAuthRequest(url: string, method: string, userId: string, body?: any): NextRequest {
  const jwtSecret = process.env.JWT_SECRET || 'jwt_default_secret_dev';
  const token = signJwt({ uid: userId, phone: '+919999999999', did: 'test_dev' }, jwtSecret, 3600);

  const init: any = {
    method,
    headers: {
      'authorization': `Bearer ${token}`,
      'content-type': 'application/json',
      'cookie': `${COOKIE_ACCESS_NAME}=${token}`
    }
  };
  if (body) {
    init.body = JSON.stringify(body);
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

async function runMatrixTests() {
  console.log('================================================================');
  console.log('INGRESS WITHIN: COMPREHENSIVE DORMANT ACCESS MATRIX TEST SUITE');
  console.log('================================================================\n');

  const DORMANT_USER_ID = 'a2b22566-5c72-426c-b044-a8213ed3873b';
  const OTHER_USER_ID = '4db16305-2d8c-44bf-a854-d587020d52d2';

  // Ensure active session exists in DB for both test users
  const ensureSession = async (uid: string) => {
    const { data: existingSession } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', uid)
      .eq('device_id', 'test_dev')
      .maybeSingle();

    if (!existingSession) {
      const { error: insErr } = await supabase.from('user_sessions').insert({
        user_id: uid,
        device_id: 'test_dev',
        device_name: 'Test Device',
        ip_address: '127.0.0.1',
        user_agent: 'Test-Agent/1.0',
        refresh_token_hash: `dummy_hash_${uid}`,
        is_active: true,
        expires_at: new Date(Date.now() + 86400000).toISOString()
      });
      if (insErr) console.warn('Session insert warning:', insErr.message);
    } else {
      await supabase.from('user_sessions').update({
        is_active: true,
        expires_at: new Date(Date.now() + 86400000).toISOString()
      }).eq('id', existingSession.id);
    }
  };

  await ensureSession(DORMANT_USER_ID);
  await ensureSession(OTHER_USER_ID);

  // 1. Verify user exists and data integrity in real DB
  console.log('--- PART 1: Real Database Data Integrity ---');
  const { data: userRecord } = await supabase.from('users').select('id, name').eq('id', DORMANT_USER_ID).single();
  assert(!!userRecord, 'Dormant user record exists in database');

  const { data: realEntries } = await supabase.from('entries').select('id, cycle_id').eq('user_id', DORMANT_USER_ID);
  const realEntryCount = realEntries ? realEntries.length : 0;
  assert(realEntryCount === 12, `Dormant user has exactly 12 real entries in DB (actual: ${realEntryCount})`);

  const { data: userCycles } = await supabase.from('cycles').select('id, entries_count, cycle_number').eq('user_id', DORMANT_USER_ID);
  assert(!!userCycles && userCycles.length > 0, 'Dormant user has at least 1 cycle in DB');
  const primaryCycle = userCycles![0];
  assert(primaryCycle.entries_count === 12, `Cycle entries_count was synced to 12 in DB (actual: ${primaryCycle.entries_count})`);

  // 2. Test CustomerAccess capabilities
  console.log('\n--- PART 2: Canonical CustomerAccess Capabilities ---');
  const access = await AccessControlService.getCustomerAccess(DORMANT_USER_ID);
  assert(access.state === 'DORMANT', 'Customer state is DORMANT');
  assert(access.selfHelp.canWrite === false, 'selfHelp.canWrite is false');
  assert(access.selfHelp.canStartSession === false, 'selfHelp.canStartSession is false');
  assert(access.selfHelp.canStartDailySession === false, 'selfHelp.canStartDailySession is false');
  assert(access.selfHelp.canUseExercises === false, 'selfHelp.canUseExercises is false');
  assert(access.selfHelp.canStartNewExercise === false, 'selfHelp.canStartNewExercise is false');
  assert(access.selfHelp.canSubmitExercise === false, 'selfHelp.canSubmitExercise is false');
  assert(access.selfHelp.canCreateReflection === false, 'selfHelp.canCreateReflection is false');
  assert(access.selfHelp.canGenerateReports === false, 'selfHelp.canGenerateReports is false');
  assert(access.selfHelp.canGeneratePatterns === false, 'selfHelp.canGeneratePatterns is false');

  // Read / history capabilities
  assert(access.history.canViewEntries === true, 'history.canViewEntries is true');
  assert(access.history.canViewCycles === true, 'history.canViewCycles is true');
  assert(access.history.canViewReflections === true, 'history.canViewReflections is true');
  assert(access.history.canViewReports === true, 'history.canViewReports is true');
  assert(access.history.canViewPatterns === true, 'history.canViewPatterns is true');
  assert(access.history.canViewVocabulary === true, 'history.canViewVocabulary is true');
  assert(access.history.canViewExerciseResults === true, 'history.canViewExerciseResults is true');
  assert(access.firstWeeklyReport.canView === true, 'firstWeeklyReport.canView is true');
  assert(access.firstWeeklyReport.permanent === true, 'firstWeeklyReport.permanent is true');
  assert(access.workshops.canBrowse === true, 'workshops.canBrowse is true');
  assert(access.interventions.canAccess === true, 'interventions.canAccess is true');

  // 3. API Read Access for Dormant User (Must all return 200 with real data)
  console.log('\n--- PART 3: API Read Endpoints (Must return 200 for Dormant User) ---');
  
  // GET /api/cycles
  const reqCycles = makeAuthRequest('http://localhost:3000/api/cycles', 'GET', DORMANT_USER_ID);
  const resCycles = await getCycles(reqCycles);
  const dataCycles = await resCycles.json();
  assert(resCycles.status === 200, 'GET /api/cycles returns 200 for dormant user');
  assert(dataCycles.success === true, 'GET /api/cycles response has success: true');
  const matchedCycle = dataCycles.cycles?.find((c: any) => c.id === primaryCycle.id);
  assert(matchedCycle && matchedCycle.entries_count === 12, `GET /api/cycles returns entries_count = 12 (actual: ${matchedCycle?.entries_count})`);

  // GET /api/cycles/[id]
  const reqCycleById = makeAuthRequest(`http://localhost:3000/api/cycles/${primaryCycle.id}`, 'GET', DORMANT_USER_ID);
  const resCycleById = await getCycleById(reqCycleById, { params: Promise.resolve({ id: primaryCycle.id }) } as any);
  assert(resCycleById.status === 200, 'GET /api/cycles/[id] returns 200 for dormant user');
  const dataCycleById = await resCycleById.json();
  assert(dataCycleById.cycle.entries && dataCycleById.cycle.entries.length === 12, `GET /api/cycles/[id] returns 12 entries (actual: ${dataCycleById.cycle.entries?.length})`);
  assert(dataCycleById.cycle.entries_count === 12, 'GET /api/cycles/[id] returns entries_count = 12');

  // GET /api/entries
  const reqEntries = makeAuthRequest('http://localhost:3000/api/entries', 'GET', DORMANT_USER_ID);
  const resEntries = await getEntries(reqEntries);
  assert(resEntries.status === 200, 'GET /api/entries returns 200 for dormant user');
  const dataEntries = await resEntries.json();
  assert(dataEntries.entries && dataEntries.entries.length === 12, `GET /api/entries returns all 12 entries (actual: ${dataEntries.entries?.length})`);

  // GET /api/reports
  const reqReports = makeAuthRequest('http://localhost:3000/api/reports', 'GET', DORMANT_USER_ID);
  const resReports = await getReports(reqReports);
  assert(resReports.status === 200, 'GET /api/reports returns 200 for dormant user');
  const dataReports = await resReports.json();
  assert(dataReports.success === true && dataReports.reports.length >= 1, `GET /api/reports returns historical reports (count: ${dataReports.reports?.length})`);
  const firstReport = dataReports.reports[0];

  // GET /api/reports/first-weekly
  const reqFirstWeekly = makeAuthRequest('http://localhost:3000/api/reports/first-weekly', 'GET', DORMANT_USER_ID);
  const resFirstWeekly = await getFirstWeekly(reqFirstWeekly);
  assert(resFirstWeekly.status === 200, 'GET /api/reports/first-weekly returns 200 for dormant user');
  const dataFirstWeekly = await resFirstWeekly.json();
  assert(dataFirstWeekly.success === true && !!dataFirstWeekly.report, 'GET /api/reports/first-weekly returns report object');
  assert(dataFirstWeekly.report.week_number === 1, 'First weekly report has week_number = 1');

  // GET /api/reports/[id]
  const reqReportById = makeAuthRequest(`http://localhost:3000/api/reports/${firstReport.id}`, 'GET', DORMANT_USER_ID);
  const resReportById = await getReportById(reqReportById, { params: Promise.resolve({ id: firstReport.id }) } as any);
  assert(resReportById.status === 200, 'GET /api/reports/[id] returns 200 for dormant user');
  const dataReportById = await resReportById.json();
  assert(dataReportById.report.id === firstReport.id, 'GET /api/reports/[id] matches report ID');

  // GET /api/patterns
  const reqPatterns = makeAuthRequest('http://localhost:3000/api/patterns', 'GET', DORMANT_USER_ID);
  const resPatterns = await getPatterns(reqPatterns);
  assert(resPatterns.status === 200, 'GET /api/patterns returns 200 for dormant user');
  const dataPatterns = await resPatterns.json();
  assert(dataPatterns.success === true, 'GET /api/patterns success is true');
  assert(dataPatterns.patterns && dataPatterns.patterns.length > 0, `GET /api/patterns returns historical patterns (count: ${dataPatterns.patterns?.length})`);

  // 4. API Write/Generation Blocking for Dormant User (Must all return 403 SELF_HELP_SUBSCRIPTION_REQUIRED)
  console.log('\n--- PART 4: API Write/Generate Endpoints (Must block Dormant User with 403) ---');

  // POST /api/entries
  const reqPostEntry = makeAuthRequest('http://localhost:3000/api/entries', 'POST', DORMANT_USER_ID, {
    content: 'Attempting to write journal as dormant user',
    cycle_id: primaryCycle.id
  });
  const resPostEntry = await postEntries(reqPostEntry);
  assert(resPostEntry.status === 403, 'POST /api/entries blocked with 403 for dormant user');
  const dataPostEntry = await resPostEntry.json();
  assert(dataPostEntry.error.code === 'SELF_HELP_SUBSCRIPTION_REQUIRED', `POST /api/entries error code is SELF_HELP_SUBSCRIPTION_REQUIRED (actual: ${dataPostEntry.error?.code})`);

  // POST /api/session
  const reqPostSession = makeAuthRequest('http://localhost:3000/api/session', 'POST', DORMANT_USER_ID, {
    cycle_id: primaryCycle.id,
    session_type: 'daily_reflection'
  });
  const resPostSession = await postSession(reqPostSession);
  assert(resPostSession.status === 403, 'POST /api/session blocked with 403 for dormant user');
  const dataPostSession = await resPostSession.json();
  assert(dataPostSession.error.code === 'SELF_HELP_SUBSCRIPTION_REQUIRED', `POST /api/session error code is SELF_HELP_SUBSCRIPTION_REQUIRED (actual: ${dataPostSession.error?.code})`);

  // POST /api/reports/generate
  const reqPostReport = makeAuthRequest('http://localhost:3000/api/reports/generate', 'POST', DORMANT_USER_ID, {
    cycle_id: primaryCycle.id,
    week_number: 2
  });
  const resPostReport = await postGenerateReport(reqPostReport);
  assert(resPostReport.status === 403, 'POST /api/reports/generate blocked with 403 for dormant user');
  const dataPostReport = await resPostReport.json();
  assert(dataPostReport.error.code === 'SELF_HELP_SUBSCRIPTION_REQUIRED', `POST /api/reports/generate error code is SELF_HELP_SUBSCRIPTION_REQUIRED (actual: ${dataPostReport.error?.code})`);

  // POST /api/patterns/generate
  const reqPostPattern = makeAuthRequest('http://localhost:3000/api/patterns/generate', 'POST', DORMANT_USER_ID, {
    cycle_id: primaryCycle.id
  });
  const resPostPattern = await postGeneratePattern(reqPostPattern);
  assert(resPostPattern.status === 403, 'POST /api/patterns/generate blocked with 403 for dormant user');
  const dataPostPattern = await resPostPattern.json();
  assert(dataPostPattern.error.code === 'SELF_HELP_SUBSCRIPTION_REQUIRED', `POST /api/patterns/generate error code is SELF_HELP_SUBSCRIPTION_REQUIRED (actual: ${dataPostPattern.error?.code})`);

  // POST /api/exercises/start
  const reqPostExStart = makeAuthRequest('http://localhost:3000/api/exercises/start', 'POST', DORMANT_USER_ID, {
    exercise_id: 'ex_somatic_01'
  });
  const resPostExStart = await postStartExercise(reqPostExStart);
  assert(resPostExStart.status === 403, 'POST /api/exercises/start blocked with 403 for dormant user');
  const dataPostExStart = await resPostExStart.json();
  assert(dataPostExStart.error.code === 'SELF_HELP_SUBSCRIPTION_REQUIRED', `POST /api/exercises/start error code is SELF_HELP_SUBSCRIPTION_REQUIRED (actual: ${dataPostExStart.error?.code})`);

  // POST /api/exercises/submit
  const reqPostExSubmit = makeAuthRequest('http://localhost:3000/api/exercises/submit', 'POST', DORMANT_USER_ID, {
    session_id: 'sess_123',
    responses: { q1: 'answer' }
  });
  const resPostExSubmit = await postSubmitExercise(reqPostExSubmit);
  assert(resPostExSubmit.status === 403, 'POST /api/exercises/submit blocked with 403 for dormant user');
  const dataPostExSubmit = await resPostExSubmit.json();
  assert(dataPostExSubmit.error.code === 'SELF_HELP_SUBSCRIPTION_REQUIRED', `POST /api/exercises/submit error code is SELF_HELP_SUBSCRIPTION_REQUIRED (actual: ${dataPostExSubmit.error?.code})`);

  // 5. Cross-User Isolation
  console.log('\n--- PART 5: Cross-User Isolation ---');
  // Other user trying to fetch dormant user's cycle
  const reqForeignCycle = makeAuthRequest(`http://localhost:3000/api/cycles/${primaryCycle.id}`, 'GET', OTHER_USER_ID);
  const resForeignCycle = await getCycleById(reqForeignCycle, { params: Promise.resolve({ id: primaryCycle.id }) } as any);
  assert(resForeignCycle.status === 404 || resForeignCycle.status === 403, `Foreign user cannot access cycle (status: ${resForeignCycle.status})`);

  // Other user trying to fetch dormant user's report
  const reqForeignReport = makeAuthRequest(`http://localhost:3000/api/reports/${firstReport.id}`, 'GET', OTHER_USER_ID);
  const resForeignReport = await getReportById(reqForeignReport, { params: Promise.resolve({ id: firstReport.id }) } as any);
  assert(resForeignReport.status === 404 || resForeignReport.status === 403, `Foreign user cannot access report (status: ${resForeignReport.status})`);

  // 6. CycleSync Integrity
  console.log('\n--- PART 6: CycleSync Integrity ---');
  const syncedCount = await CycleSync.syncCycleEntriesCount(primaryCycle.id);
  assert(syncedCount === 12, `CycleSync recalculated exact count of 12 entries (actual: ${syncedCount})`);

  console.log('\n================================================================');
  console.log(`MATRIX TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runMatrixTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
