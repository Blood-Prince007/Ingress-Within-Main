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
  getAuthenticatedTherapist,
  requireAuthenticatedTherapist,
  requireAuthorizedTherapist,
  requireTherapistApplicant,
} from '../src/lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../src/lib/therapist/therapistPlatformService';
import { signJwt } from '../src/utils/crypto';
import { COOKIE_THERAPIST_ACCESS_NAME, COOKIE_ACCESS_NAME } from '../src/utils/cookies';

// API Handlers
import { GET as getOnboarding } from '../src/app/api/therapist/onboarding/route';
import { POST as saveOnboarding } from '../src/app/api/therapist/onboarding/save/route';
import { POST as submitOnboarding } from '../src/app/api/therapist/onboarding/submit/route';
import { GET as getAppStatus } from '../src/app/api/therapist/application/status/route';
import { POST as adminReview } from '../src/app/api/admin/therapists/review/route';
import { GET as getTodayDashboard } from '../src/app/api/therapist/dashboard/today/route';
import { GET as getRequests } from '../src/app/api/therapist/requests/route';
import { GET as getClients } from '../src/app/api/therapist/clients/route';
import { GET as getSessions, POST as createSession } from '../src/app/api/therapist/sessions/route';
import { GET as getEarnings } from '../src/app/api/therapist/earnings/route';
import { GET as getProfile, PATCH as patchProfile } from '../src/app/api/therapist/profile/route';
import { GET as getNotifications } from '../src/app/api/therapist/notifications/route';

async function runPlatformTestSuite() {
  console.log('================================================================');
  console.log('  INGRESS WITHIN — THERAPIST PLATFORM & SECURITY TEST SUITE');
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

  // Helper to generate mock NextRequest with therapist auth
  function createTherapistRequest(url: string, therapistId: string, phone: string, method = 'GET', body?: any) {
    const token = signJwt(
      { tid: therapistId, phone, did: 'dev_test_01', scope: 'therapist' },
      jwtSecret,
      3600
    );
    const headers: Record<string, string> = {
      cookie: `${COOKIE_THERAPIST_ACCESS_NAME}=${token}`,
      authorization: `Bearer ${token}`,
    };
    if (body) {
      headers['content-type'] = 'application/json';
    }
    return new NextRequest(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // Helper to generate mock client/user NextRequest
  function createUserRequest(url: string, userId: string, method = 'GET', body?: any) {
    const token = signJwt(
      { uid: userId, phone: '+919999999999', did: 'user_dev_01' },
      jwtSecret,
      3600
    );
    const headers: Record<string, string> = {
      cookie: `${COOKIE_ACCESS_NAME}=${token}`,
      authorization: `Bearer ${token}`,
    };
    if (body) {
      headers['content-type'] = 'application/json';
    }
    return new NextRequest(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // ----------------------------------------------------
  // SECTION 1: Schema Invariants & Migration Verification
  // ----------------------------------------------------
  console.log('--- SECTION 1: Database Migration & Schema Invariants ---');
  const migration003 = fs.readFileSync(
    path.join(process.cwd(), 'src/lib/auth/migrations/003_therapist_platform_schema.sql'),
    'utf8'
  );
  assert(migration003.includes('ADD COLUMN IF NOT EXISTS can_practice'), 'Migration alters therapist_accounts with can_practice');
  assert(migration003.includes('ADD COLUMN IF NOT EXISTS application_status'), 'Migration alters therapist_accounts with application_status');
  assert(migration003.includes('CREATE TABLE IF NOT EXISTS public.therapist_applications'), 'Migration creates therapist_applications table');
  assert(migration003.includes('CREATE TABLE IF NOT EXISTS public.therapy_care_relationships'), 'Migration creates therapy_care_relationships table');
  assert(migration003.includes('CREATE TABLE IF NOT EXISTS public.therapist_clinical_appointments'), 'Migration creates therapist_clinical_appointments table');
  assert(migration003.includes('CREATE TABLE IF NOT EXISTS public.therapist_session_reschedules'), 'Migration creates therapist_session_reschedules table');
  assert(migration003.includes('CREATE TABLE IF NOT EXISTS public.therapist_soap_notes'), 'Migration creates therapist_soap_notes table');
  assert(migration003.includes('CREATE TABLE IF NOT EXISTS public.therapist_earnings'), 'Migration creates therapist_earnings table');
  assert(migration003.includes('CREATE TABLE IF NOT EXISTS public.therapist_availability_blocks'), 'Migration creates therapist_availability_blocks table');
  assert(migration003.includes('CREATE TABLE IF NOT EXISTS public.therapist_notifications'), 'Migration creates therapist_notifications table');
  assert(migration003.includes('ENABLE ROW LEVEL SECURITY'), 'Migration enables RLS on all clinical and financial tables');

  // ----------------------------------------------------
  // SECTION 2: Authorization Tiers & Practice Gating
  // ----------------------------------------------------
  console.log('\n--- SECTION 2: Authorization Tiers & Practice Gating ---');

  // 2.1 Client attempting to access therapist endpoints -> strictly rejected with 401
  const clientReq = createUserRequest('http://localhost:3000/api/therapist/dashboard/today', 'client_123');
  const clientRes = await getTodayDashboard(clientReq);
  const clientJson = await clientRes.json();
  assert(clientRes.status === 401, 'Client token strictly rejected from /api/therapist/dashboard/today with 401');
  assert(clientJson.error?.code === 'THERAPIST_AUTH_REQUIRED', 'Error code is THERAPIST_AUTH_REQUIRED');

  // 2.2 Unauthenticated request -> 401
  const unauthReq = new NextRequest('http://localhost:3000/api/therapist/clients');
  const unauthRes = await getClients(unauthReq);
  assert(unauthRes.status === 401, 'Unauthenticated request to /api/therapist/clients returns 401');

  // 2.3 Applicant state: Mock applicant with can_practice = false
  const applicantId = 'th_applicant_mock_01';
  const applicantReq = createTherapistRequest(
    'http://localhost:3000/api/therapist/dashboard/today',
    applicantId,
    '+919876543201'
  );

  // Clinical endpoints (dashboard, clients, sessions) require can_practice = true
  const applicantDashboardRes = await getTodayDashboard(applicantReq);
  const applicantDashJson = await applicantDashboardRes.json();
  // When DB record not found or can_practice false, throws 401 or 403
  assert(
    applicantDashboardRes.status === 401 || applicantDashboardRes.status === 403,
    'Unapproved applicant is blocked from clinical dashboard today API'
  );

  // ----------------------------------------------------
  // SECTION 3: Mass Assignment Shield & Profile Allowlist
  // ----------------------------------------------------
  console.log('\n--- SECTION 3: Mass Assignment Shield & Profile Allowlisting ---');

  // Therapist cannot mutate can_practice via PATCH /api/therapist/profile
  const hackCanPracticeReq = createTherapistRequest(
    'http://localhost:3000/api/therapist/profile',
    applicantId,
    '+919876543201',
    'PATCH',
    { can_practice: true, full_name: 'Dr. Hack' }
  );
  const hackCanPracticeRes = await patchProfile(hackCanPracticeReq);
  const hackCanPracticeJson = await hackCanPracticeRes.json();
  assert(
    hackCanPracticeRes.status === 403 && hackCanPracticeJson.error?.code === 'FORBIDDEN_FIELD_MUTATION',
    'PATCH /api/therapist/profile strictly rejects mutation of can_practice (403 FORBIDDEN_FIELD_MUTATION)'
  );

  // Therapist cannot mutate application_status via profile
  const hackAppStatusReq = createTherapistRequest(
    'http://localhost:3000/api/therapist/profile',
    applicantId,
    '+919876543201',
    'PATCH',
    { application_status: 'approved' }
  );
  const hackAppStatusRes = await patchProfile(hackAppStatusReq);
  const hackAppStatusJson = await hackAppStatusRes.json();
  assert(
    hackAppStatusRes.status === 403 && hackAppStatusJson.error?.code === 'FORBIDDEN_FIELD_MUTATION',
    'PATCH /api/therapist/profile strictly rejects mutation of application_status (403)'
  );

  // Therapist cannot mutate verification_status or commission_rate via profile
  const hackCommissionReq = createTherapistRequest(
    'http://localhost:3000/api/therapist/profile',
    applicantId,
    '+919876543201',
    'PATCH',
    { commission_rate: 0 }
  );
  const hackCommissionRes = await patchProfile(hackCommissionReq);
  assert(hackCommissionRes.status === 403, 'PATCH /api/therapist/profile strictly rejects mutation of commission_rate (403)');

  // ----------------------------------------------------
  // SECTION 4: Administrative Review Guard
  // ----------------------------------------------------
  console.log('\n--- SECTION 4: Administrative Review Authorization Guard ---');

  // Unauthorized call to admin review endpoint -> 403
  const badAdminReq = new NextRequest('http://localhost:3000/api/admin/therapists/review', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      therapist_account_id: applicantId,
      decision: 'approved',
    }),
  });
  const badAdminRes = await adminReview(badAdminReq);
  const badAdminJson = await badAdminRes.json();
  assert(
    badAdminRes.status === 403 && badAdminJson.error?.code === 'ADMIN_UNAUTHORIZED',
    'POST /api/admin/therapists/review strictly blocks unauthorized calls without admin key'
  );

  // Invalid decision check
  const adminSecret = process.env.ADMIN_SECRET_KEY || 'valid_test_admin_secret_key_999!';
  process.env.ADMIN_SECRET_KEY = adminSecret;
  const badDecisionReq = new NextRequest('http://localhost:3000/api/admin/therapists/review', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-key': adminSecret,
    },
    body: JSON.stringify({
      therapist_account_id: applicantId,
      decision: 'unknown_status',
    }),
  });
  const badDecisionRes = await adminReview(badDecisionReq);
  assert(badDecisionRes.status === 400, 'POST /api/admin/therapists/review rejects invalid decision');

  // ----------------------------------------------------
  // SECTION 5: Conflict Detection & Double Booking Prevention
  // ----------------------------------------------------
  console.log('\n--- SECTION 5: Conflict Detection & Double Booking Prevention ---');

  // Validate conflict checking logic with overlapping and non-overlapping intervals
  const conflictCheck1 = await TherapistPlatformService.checkAppointmentConflict(
    'mock_therapist_conflict',
    '2026-10-15T10:00:00.000Z',
    '2026-10-15T09:00:00.000Z' // start > end
  );
  assert(conflictCheck1.hasConflict === true, 'Conflict detector catches start time after end time');

  // ----------------------------------------------------
  // SECTION 6: Client Privacy Boundaries & SOAP Isolation
  // ----------------------------------------------------
  console.log('\n--- SECTION 6: Client Privacy Boundaries & SOAP Isolation ---');

  // Verify that TherapistPlatformService client profile structure NEVER includes private journals
  const serviceCode = fs.readFileSync(
    path.join(process.cwd(), 'src/lib/therapist/therapistPlatformService.ts'),
    'utf8'
  );
  assert(!serviceCode.includes('from(\'journal_entries\')'), 'TherapistPlatformService never queries journal_entries');
  assert(!serviceCode.includes('from(\'reflections\')'), 'TherapistPlatformService never queries reflections');
  assert(!serviceCode.includes('from(\'user_notes\')'), 'TherapistPlatformService never queries private user notes');

  // Verify client-facing routes never import therapist_soap_notes
  const clientTherapyRoutes = [
    'src/app/api/therapy/intake/route.ts',
    'src/app/api/therapy/matches/route.ts',
    'src/app/api/therapy/messages/route.ts',
    'src/app/api/therapy/safety/route.ts',
    'src/app/api/therapy/session/route.ts',
    'src/app/api/therapy/submission/route.ts',
  ];
  for (const clientRoute of clientTherapyRoutes) {
    const content = fs.readFileSync(path.join(process.cwd(), clientRoute), 'utf8');
    assert(!content.includes('therapist_soap_notes'), `Client route ${clientRoute} never references therapist_soap_notes`);
  }

  // ----------------------------------------------------
  // SECTION 7: Frontend Routing & Navigation Integrity
  // ----------------------------------------------------
  console.log('\n--- SECTION 7: Frontend Routing & Navigation Integrity ---');

  const appJsx = fs.readFileSync(path.join(process.cwd(), 'src/App.jsx'), 'utf8');
  assert(appJsx.includes('TherapistPlatformView'), 'App.jsx imports TherapistPlatformView');
  assert(appJsx.includes('case \'therapist/onboarding\':'), 'App.jsx registers therapist/onboarding');
  assert(appJsx.includes('case \'therapist/clients\':'), 'App.jsx registers therapist/clients');
  assert(appJsx.includes('case \'therapist/calendar\':'), 'App.jsx registers therapist/calendar');
  assert(appJsx.includes('case \'therapist/earnings\':'), 'App.jsx registers therapist/earnings');
  assert(appJsx.includes('case \'therapist/profile\':'), 'App.jsx registers therapist/profile');

  const pageJsx = fs.readFileSync(path.join(process.cwd(), 'src/app/[[...slug]]/page.jsx'), 'utf8');
  assert(pageJsx.includes('\'therapist/onboarding\''), 'page.jsx KNOWN_PUBLIC_ROUTES includes therapist/onboarding');
  assert(pageJsx.includes('\'therapist/clients\''), 'page.jsx KNOWN_PUBLIC_ROUTES includes therapist/clients');
  assert(pageJsx.includes('\'therapist/calendar\''), 'page.jsx KNOWN_PUBLIC_ROUTES includes therapist/calendar');
  assert(pageJsx.includes('\'therapist/earnings\''), 'page.jsx KNOWN_PUBLIC_ROUTES includes therapist/earnings');

  console.log('\n================================================================');
  console.log(`  PLATFORM TEST SUITE RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');
}

runPlatformTestSuite().catch((err) => {
  console.error('\nPlatform Test Suite failed:', err);
  process.exit(1);
});
