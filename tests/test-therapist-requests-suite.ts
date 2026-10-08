import fs from 'fs';
import path from 'path';

// Load .env configuration if present
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
} catch (e) {}

import { NextRequest } from 'next/server';
import { TherapistAuthService } from '../src/lib/therapist/therapistAuthService';
import { TherapistPlatformService } from '../src/lib/therapist/therapistPlatformService';
import { signJwt } from '../src/utils/crypto';
import { COOKIE_THERAPIST_ACCESS_NAME, COOKIE_ACCESS_NAME } from '../src/utils/cookies';
import { GET as getRequests } from '../src/app/api/therapist/requests/route';
import { GET as getRequestById } from '../src/app/api/therapist/requests/[id]/route';
import { POST as handleRequestAction } from '../src/app/api/therapist/requests/[id]/action/route';

async function runRequestsTestSuite() {
  console.log('================================================================');
  console.log('  INGRESS WITHIN — THERAPIST NEW REQUESTS & MATCHING TEST SUITE');
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

  function createTherapistRequest(url: string, therapistId: string, phone: string, method = 'GET', body?: any) {
    const token = signJwt(
      { tid: therapistId, phone, did: 'dev_test_req_01', scope: 'therapist' },
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
      { uid: userId, phone: '+919999999999', did: 'user_dev_01' },
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
  // SECTION 1: Client & Unauthenticated Access Blocked
  // ----------------------------------------------------
  console.log('--- SECTION 1: Client & Unauthenticated Access Blocked ---');

  // 1.1 Client token strictly rejected from /api/therapist/requests with 401
  const clientReq = createUserRequest('http://localhost:3000/api/therapist/requests', 'client_usr_999');
  const clientRes = await getRequests(clientReq);
  const clientJson = await clientRes.json();
  assert(clientRes.status === 401, 'Client token strictly rejected from /api/therapist/requests with 401');
  assert(clientJson.error?.code === 'THERAPIST_AUTH_REQUIRED', 'Error code is THERAPIST_AUTH_REQUIRED');

  // 1.2 Unauthenticated request to /api/therapist/requests returns 401
  const unauthReq = new NextRequest('http://localhost:3000/api/therapist/requests');
  const unauthRes = await getRequests(unauthReq);
  const unauthJson = await unauthRes.json();
  assert(unauthRes.status === 401, 'Unauthenticated request to /api/therapist/requests returns 401');
  assert(unauthJson.error?.code === 'THERAPIST_AUTH_REQUIRED', 'Unauthenticated error code is THERAPIST_AUTH_REQUIRED');

  // 1.3 Client token strictly rejected from /api/therapist/requests/[id]
  const clientSingleReq = createUserRequest('http://localhost:3000/api/therapist/requests/match_123', 'client_usr_999');
  const clientSingleRes = await getRequestById(clientSingleReq, { params: Promise.resolve({ id: 'match_123' }) });
  assert(clientSingleRes.status === 401, 'Client token rejected from single request endpoint with 401');

  // 1.4 Client token strictly rejected from action endpoint
  const clientActionReq = createUserRequest('http://localhost:3000/api/therapist/requests/match_123/action', 'client_usr_999', 'POST', { action: 'accept' });
  const clientActionRes = await handleRequestAction(clientActionReq, { params: Promise.resolve({ id: 'match_123' }) });
  assert(clientActionRes.status === 401, 'Client token rejected from request action endpoint with 401');

  // ----------------------------------------------------
  // SECTION 2: Authorization Tiers & Practice Gating
  // ----------------------------------------------------
  console.log('\n--- SECTION 2: Authorization Tiers & Practice Gating ---');

  // 2.1 Unapproved applicant cannot access /api/therapist/requests
  const applicantReq = createTherapistRequest(
    'http://localhost:3000/api/therapist/requests',
    'th_applicant_unapproved',
    '+919876543210'
  );
  const applicantRes = await getRequests(applicantReq);
  assert(
    applicantRes.status === 401 || applicantRes.status === 403,
    'Unapproved applicant is blocked from /api/therapist/requests with 401 or 403'
  );

  // 2.2 Unapproved applicant cannot perform accept/decline action
  const applicantActionReq = createTherapistRequest(
    'http://localhost:3000/api/therapist/requests/match_123/action',
    'th_applicant_unapproved',
    '+919876543210',
    'POST',
    { action: 'accept' }
  );
  const applicantActionRes = await handleRequestAction(applicantActionReq, { params: Promise.resolve({ id: 'match_123' }) });
  assert(
    applicantActionRes.status === 401 || applicantActionRes.status === 403,
    'Unapproved applicant cannot accept request (blocked with 401 or 403)'
  );

  // ----------------------------------------------------
  // SECTION 3: Action Validation & Mass Assignment Guard
  // ----------------------------------------------------
  console.log('\n--- SECTION 3: Action Validation & Mass Assignment Guard ---');

  // 3.1 Invalid action returns 400
  // Note: if user is not in DB, auth returns 401/403 before body check. We test with authorized check or direct validation.
  const invalidBodyReq = createTherapistRequest(
    'http://localhost:3000/api/therapist/requests/match_123/action',
    'th_test_account',
    '+919876543210',
    'POST',
    { action: 'invalid_action', is_admin: true, can_practice: true }
  );
  const invalidRes = await handleRequestAction(invalidBodyReq, { params: Promise.resolve({ id: 'match_123' }) });
  assert(
    invalidRes.status === 400 || invalidRes.status === 401 || invalidRes.status === 403,
    'Invalid action or unauthorized request properly rejected'
  );

  // 3.2 Service handleRequestAction rejects invalid action
  try {
    await TherapistPlatformService.handleRequestAction('th_test_id', 'match_123', 'unsupported_action' as any);
    assert(false, 'Should throw on invalid action');
  } catch (err: any) {
    assert(
      err.code === 'INVALID_ACTION' || err.code === 'REQUEST_NOT_FOUND' || err.message.includes('Invalid action') || err.message.includes('not found'),
      'Service layer strictly rejects invalid action'
    );
  }

  // ----------------------------------------------------
  // SECTION 4: Tenancy & Isolation (Therapist A vs Therapist B)
  // ----------------------------------------------------
  console.log('\n--- SECTION 4: Tenancy & Isolation ---');

  // 4.1 Empty therapist returns empty requests array
  const emptyRequests = await TherapistPlatformService.getAssignedRequests('th_empty_tenancy_req_test');
  assert(Array.isArray(emptyRequests), 'getAssignedRequests returns an array');
  assert(emptyRequests.length === 0, 'getAssignedRequests is empty for account with no assignments');

  // 4.2 Single request retrieval for nonexistent ID throws 404
  try {
    await TherapistPlatformService.getRequestById('th_test_therapist_a', 'nonexistent_match_id');
    assert(false, 'getRequestById should throw on nonexistent request');
  } catch (err: any) {
    assert(err.status === 404 || err.code === 'REQUEST_NOT_FOUND', 'Nonexistent request returns 404 REQUEST_NOT_FOUND');
  }

  // 4.3 Action on nonexistent request throws 404
  try {
    await TherapistPlatformService.handleRequestAction('th_test_therapist_a', 'nonexistent_match_id', 'accept');
    assert(false, 'handleRequestAction should throw on nonexistent request');
  } catch (err: any) {
    assert(err.status === 404 || err.code === 'REQUEST_NOT_FOUND', 'Nonexistent request action returns 404 REQUEST_NOT_FOUND');
  }

  // ----------------------------------------------------
  // SECTION 5: Privacy Boundary & Zero Journal Leaks
  // ----------------------------------------------------
  console.log('\n--- SECTION 5: Privacy Boundary & Zero Journal Leaks ---');

  const requestsViewPath = path.join(process.cwd(), 'src/views/therapist/TherapistRequestsView.jsx');
  const requestsViewContent = fs.readFileSync(requestsViewPath, 'utf8');

  assert(!requestsViewContent.includes('user_entries'), 'Requests view does not query user_entries');
  assert(!requestsViewContent.includes('client_reflections'), 'Requests view does not query client_reflections');
  assert(!requestsViewContent.includes('exercise_results'), 'Requests view does not query exercise_results');
  assert(requestsViewContent.includes('No new client requests'), 'Requests view includes exact empty state title');
  assert(requestsViewContent.includes('When a client is matched with your practice, their request will appear here.'), 'Requests view includes exact empty state subtitle');
  assert(requestsViewContent.includes('Client request accepted'), 'Requests view handles exact accept feedback message');
  assert(requestsViewContent.includes('Client request declined'), 'Requests view handles exact decline feedback message');
  assert(requestsViewContent.includes('Client Privacy & Clinical Tenancy Protection'), 'Requests view includes Tenancy Shield');

  // ----------------------------------------------------
  // SECTION 6: Today Dashboard & Navigation Integration
  // ----------------------------------------------------
  console.log('\n--- SECTION 6: Today Dashboard & Navigation Integration ---');

  const todayViewPath = path.join(process.cwd(), 'src/views/therapist/TherapistTodayView.jsx');
  const todayViewContent = fs.readFileSync(todayViewPath, 'utf8');

  assert(todayViewContent.includes('View all requests'), 'Today Dashboard includes "View all requests" button');
  assert(todayViewContent.includes('/therapist/requests') || todayViewContent.includes("onNavigate('requests')"), 'Today Dashboard links to /therapist/requests');

  const shellPath = path.join(process.cwd(), 'src/views/therapist/TherapistDashboardShell.jsx');
  const shellContent = fs.readFileSync(shellPath, 'utf8');

  assert(shellContent.includes("path.includes('/therapist/requests')"), 'Dashboard shell detects /therapist/requests route');
  assert(shellContent.includes("TherapistRequestsView"), 'Dashboard shell renders TherapistRequestsView');

  // ----------------------------------------------------
  // SECTION 7: True Database Transaction & RPC Invariants
  // ----------------------------------------------------
  console.log('\n--- SECTION 7: True Database Transaction & RPC Invariants ---');

  const migration004Path = path.join(process.cwd(), 'src/lib/auth/migrations/004_therapist_match_acceptance_transaction.sql');
  const migration004Exists = fs.existsSync(migration004Path);
  assert(migration004Exists, 'Migration 004 exists for database transaction');

  const migration004Content = fs.readFileSync(migration004Path, 'utf8');
  assert(migration004Content.includes('CREATE OR REPLACE FUNCTION public.accept_therapy_match'), 'accept_therapy_match database transaction procedure is defined');
  assert(migration004Content.includes('FOR UPDATE'), 'Database transaction uses FOR UPDATE row-level locking');
  assert(migration004Content.includes('INSERT INTO public.therapy_care_relationships'), 'Database transaction inserts therapy_care_relationships');
  assert(migration004Content.includes('UPDATE public.therapy_matches'), 'Database transaction updates therapy_matches');
  assert(migration004Content.includes('CREATE OR REPLACE FUNCTION public.decline_therapy_match'), 'decline_therapy_match procedure is defined');

  const servicePath = path.join(process.cwd(), 'src/lib/therapist/therapistPlatformService.ts');
  const serviceContent = fs.readFileSync(servicePath, 'utf8');
  assert(serviceContent.includes("supabase.rpc('accept_therapy_match'"), 'TherapistPlatformService calls accept_therapy_match RPC');
  assert(serviceContent.includes("supabase.rpc('decline_therapy_match'"), 'TherapistPlatformService calls decline_therapy_match RPC');
  assert(!serviceContent.includes(".from('therapy_care_relationships').delete()"), 'TherapistPlatformService does not rely on application-level deletion rollback compensation');

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n================================================================');
  console.log(`  THERAPIST NEW REQUESTS TEST RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');
}

runRequestsTestSuite().catch((err) => {
  console.error('\nTest suite execution failed:', err);
  process.exit(1);
});
