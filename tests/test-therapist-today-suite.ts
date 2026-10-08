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
import {
  requireAuthorizedTherapist,
  requireAuthenticatedTherapist,
} from '../src/lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../src/lib/therapist/therapistPlatformService';
import { signJwt } from '../src/utils/crypto';
import { COOKIE_THERAPIST_ACCESS_NAME, COOKIE_ACCESS_NAME } from '../src/utils/cookies';
import { GET as getTodayDashboard } from '../src/app/api/therapist/dashboard/today/route';

async function runTodayTestSuite() {
  console.log('================================================================');
  console.log('  INGRESS WITHIN — THERAPIST "TODAY" DASHBOARD TEST SUITE');
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

  function createTherapistRequest(url: string, therapistId: string, phone: string, method = 'GET') {
    const token = signJwt(
      { tid: therapistId, phone, did: 'dev_test_01', scope: 'therapist' },
      jwtSecret,
      3600
    );
    const headers: Record<string, string> = {
      cookie: `${COOKIE_THERAPIST_ACCESS_NAME}=${token}`,
      authorization: `Bearer ${token}`,
    };
    return new NextRequest(url, { method, headers });
  }

  function createUserRequest(url: string, userId: string, method = 'GET') {
    const token = signJwt(
      { uid: userId, phone: '+919999999999', did: 'user_dev_01' },
      jwtSecret,
      3600
    );
    const headers: Record<string, string> = {
      cookie: `${COOKIE_ACCESS_NAME}=${token}`,
      authorization: `Bearer ${token}`,
    };
    return new NextRequest(url, { method, headers });
  }

  // ----------------------------------------------------
  // SECTION 1: Client & Unauthenticated Access Blocked
  // ----------------------------------------------------
  console.log('--- SECTION 1: Client & Unauthenticated Access Blocked ---');

  // 1.1 Client token strictly rejected with 401
  const clientReq = createUserRequest('http://localhost:3000/api/therapist/dashboard/today', 'client_usr_999');
  const clientRes = await getTodayDashboard(clientReq);
  const clientJson = await clientRes.json();
  assert(clientRes.status === 401, 'Client token strictly rejected from /api/therapist/dashboard/today with 401');
  assert(clientJson.error?.code === 'THERAPIST_AUTH_REQUIRED', 'Error code is THERAPIST_AUTH_REQUIRED');

  // 1.2 Unauthenticated request rejected with 401
  const unauthReq = new NextRequest('http://localhost:3000/api/therapist/dashboard/today');
  const unauthRes = await getTodayDashboard(unauthReq);
  const unauthJson = await unauthRes.json();
  assert(unauthRes.status === 401, 'Unauthenticated request to /api/therapist/dashboard/today returns 401');
  assert(unauthJson.error?.code === 'THERAPIST_AUTH_REQUIRED', 'Unauthenticated error code is THERAPIST_AUTH_REQUIRED');

  // ----------------------------------------------------
  // SECTION 2: Authorization Tiers (Applicant vs Approved)
  // ----------------------------------------------------
  console.log('\n--- SECTION 2: Authorization Tiers & Practice Gating ---');

  // 2.1 Unapproved applicant cannot access /api/therapist/dashboard/today
  const applicantReq = createTherapistRequest(
    'http://localhost:3000/api/therapist/dashboard/today',
    'th_applicant_unapproved',
    '+919876543210'
  );
  const applicantRes = await getTodayDashboard(applicantReq);
  assert(
    applicantRes.status === 401 || applicantRes.status === 403,
    'Unapproved applicant is blocked from Today dashboard with 401 or 403'
  );

  // ----------------------------------------------------
  // SECTION 3: Service-Level Tenancy & Scoping Tests
  // ----------------------------------------------------
  console.log('\n--- SECTION 3: Data Scoping & Empty States ---');

  // 3.1 Empty therapist returns valid empty arrays and nulls
  const emptyOverview = await TherapistPlatformService.getTodayOverview('th_empty_tenancy_test');
  assert(Array.isArray(emptyOverview.todaySessions), 'todaySessions is an array');
  assert(emptyOverview.todaySessions.length === 0, 'todaySessions is empty for empty account');
  assert(emptyOverview.nextSession === null, 'nextSession is null when no upcoming sessions exist');
  assert(Array.isArray(emptyOverview.pendingRequests), 'pendingRequests is an array');
  assert(emptyOverview.pendingRequests.length === 0, 'pendingRequests is empty for empty account');
  assert(Array.isArray(emptyOverview.activeClients), 'activeClients is an array');
  assert(emptyOverview.activeClients.length === 0, 'activeClients is empty for empty account');
  assert(Array.isArray(emptyOverview.notesDue), 'notesDue is an array');
  assert(emptyOverview.notesDue.length === 0, 'notesDue is empty for empty account');
  assert(Array.isArray(emptyOverview.notifications), 'notifications is an array');
  assert(emptyOverview.notifications.length === 0, 'notifications is empty for empty account');
  assert(emptyOverview.metrics.todaySessionsCount === 0, 'metrics.todaySessionsCount is 0');
  assert(emptyOverview.metrics.pendingRequestsCount === 0, 'metrics.pendingRequestsCount is 0');
  assert(emptyOverview.metrics.activeClientsCount === 0, 'metrics.activeClientsCount is 0');
  assert(emptyOverview.metrics.outstandingSoapNotesCount === 0, 'metrics.outstandingSoapNotesCount is 0');
  assert(emptyOverview.metrics.unreadNotificationsCount === 0, 'metrics.unreadNotificationsCount is 0');

  // ----------------------------------------------------
  // SECTION 4: Client Privacy & Tenancy Boundary Shield
  // ----------------------------------------------------
  console.log('\n--- SECTION 4: Client Privacy Boundary Shield ---');

  const todayViewFile = fs.readFileSync(
    path.join(process.cwd(), 'src/views/therapist/TherapistTodayView.jsx'),
    'utf8'
  );
  assert(!todayViewFile.includes('journal_entries'), 'Today view does not reference client journal entries');
  assert(!todayViewFile.includes('new_entry_text_encrypted'), 'Today view does not reference decrypted user entries');
  assert(!todayViewFile.includes('reflections'), 'Today view does not reference private reflections');
  assert(todayViewFile.includes("No sessions scheduled today."), 'Today view renders exact empty state for sessions');
  assert(todayViewFile.includes("No upcoming sessions."), 'Today view renders exact empty state for next session');
  assert(todayViewFile.includes("No new client requests."), 'Today view renders exact empty state for requests');
  assert(todayViewFile.includes("No active clients yet."), 'Today view renders exact empty state for clients');
  assert(todayViewFile.includes("No notes due."), 'Today view renders exact empty state for notes due');
  assert(todayViewFile.includes("You're all caught up."), 'Today view renders exact empty state for notifications');

  // ----------------------------------------------------
  // SECTION 5: Frontend Component & Shell Integration
  // ----------------------------------------------------
  console.log('\n--- SECTION 5: Component & Shell Integration ---');

  const shellFile = fs.readFileSync(
    path.join(process.cwd(), 'src/views/therapist/TherapistDashboardShell.jsx'),
    'utf8'
  );
  assert(shellFile.includes("import TherapistTodayView from './TherapistTodayView'"), 'TherapistDashboardShell imports TherapistTodayView');
  assert(shellFile.includes("<TherapistTodayView"), 'TherapistDashboardShell renders TherapistTodayView');
  assert(shellFile.includes("activeTab === 'today'"), 'TherapistDashboardShell handles activeTab today');

  const platformFile = fs.readFileSync(
    path.join(process.cwd(), 'src/views/therapist/TherapistPlatformView.jsx'),
    'utf8'
  );
  assert(platformFile.includes("<TherapistDashboardShell"), 'TherapistPlatformView routes verified therapist to TherapistDashboardShell');

  console.log('\n================================================================');
  console.log(`  TODAY DASHBOARD TEST RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');
}

runTodayTestSuite().catch((err) => {
  console.error('Test suite execution failed:', err);
  process.exit(1);
});
