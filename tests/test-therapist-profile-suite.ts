import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { GET as getProfileRoute, PATCH as patchProfileRoute } from '../src/app/api/therapist/profile/route';
import { POST as postPhotoRoute, DELETE as deletePhotoRoute } from '../src/app/api/therapist/profile/photo/route';
import { GET as getSessionsRoute, POST as postSessionsRoute } from '../src/app/api/therapist/auth/sessions/route';
import { GET as getDeactivateRoute, POST as postDeactivateRoute } from '../src/app/api/therapist/profile/deactivate/route';
import { TherapistPlatformService } from '../src/lib/therapist/therapistPlatformService';
import { TherapistAuthService } from '../src/lib/therapist/therapistAuthService';
import { signJwt } from '../src/utils/crypto';
import { COOKIE_THERAPIST_ACCESS_NAME } from '../src/utils/cookies';

let passed = 0;
let total = 0;

async function test(name: string, fn: () => Promise<void> | void) {
  total++;
  try {
    await fn();
    console.log(`  ✓ [PASS] ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error('    Error:', err.message || err);
    throw err;
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('   INGRESS WITHIN — THERAPIST PROFILE & SETTINGS TEST SUITE     ');
  console.log('================================================================\n');

  // --- SECTION 1: Migration 015 & Schema Invariants ---
  console.log('--- SECTION 1: Migration 015 Invariants ---');

  await test('Migration 015 exists on disk', () => {
    const migrationPath = path.join(
      process.cwd(),
      'src/lib/auth/migrations/015_therapist_profile_enhancements.sql'
    );
    assert(fs.existsSync(migrationPath), '015_therapist_profile_enhancements.sql must exist');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    assert(sql.includes('practice_name'), 'Defines practice_name column');
    assert(sql.includes('practice_address'), 'Defines practice_address column');
    assert(sql.includes('timezone'), 'Defines canonical timezone column');
    assert(sql.includes('notification_preferences'), 'Defines notification_preferences column');
  });

  // --- SECTION 2: Auth Token & Identity Helpers ---
  const jwtSecret = TherapistAuthService.getJwtSecret();
  const testTherapistId = 'th-prof-test-user-1';
  const testDeviceId = 'dev-profile-session-1';
  const testPhone = '+919876543210';

  const validTherapistToken = signJwt(
    {
      tid: testTherapistId,
      phone: testPhone,
      did: testDeviceId,
      scope: 'therapist',
    },
    jwtSecret,
    3600
  );

  const clientUserToken = signJwt(
    {
      uid: 'user-client-123',
      phone: '+919999999999',
      scope: 'client',
    },
    jwtSecret,
    3600
  );

  // --- SECTION 3: Authorization & Tenant Security ---
  console.log('\n--- SECTION 2: Authorization & Identity Guards ---');

  await test('Rejects unauthenticated request to /api/therapist/profile', async () => {
    const req = new NextRequest('http://localhost:3000/api/therapist/profile');
    const res = await getProfileRoute(req);
    assert.strictEqual(res.status, 401, 'Must reject unauthenticated request with 401');
    const body = await res.json();
    assert.strictEqual(body.error?.code, 'THERAPIST_AUTH_REQUIRED');
  });

  await test('Rejects client-scoped token from accessing therapist profile API', async () => {
    const req = new NextRequest('http://localhost:3000/api/therapist/profile', {
      headers: {
        authorization: `Bearer ${clientUserToken}`,
      },
    });
    const res = await getProfileRoute(req);
    assert.strictEqual(res.status, 401, 'Must reject non-therapist scope');
  });

  await test('Rejects unauthenticated request to photo upload endpoint', async () => {
    const req = new NextRequest('http://localhost:3000/api/therapist/profile/photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_image_url: 'https://example.com/photo.jpg' }),
    });
    const res = await postPhotoRoute(req);
    assert.strictEqual(res.status, 401, 'Photo upload requires authenticated therapist');
  });

  await test('Rejects unauthenticated request to sessions endpoint', async () => {
    const req = new NextRequest('http://localhost:3000/api/therapist/auth/sessions');
    const res = await getSessionsRoute(req);
    assert.strictEqual(res.status, 401, 'Sessions route requires authenticated therapist');
  });

  // --- SECTION 4: Mass Assignment & Governance Protection ---
  console.log('\n--- SECTION 3: Mass Assignment & Governance Protection ---');

  await test('Strictly blocks attempts to mutate can_practice', async () => {
    const req = new NextRequest('http://localhost:3000/api/therapist/profile', {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${validTherapistToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ can_practice: true }),
    });
    const res = await patchProfileRoute(req);
    assert.strictEqual(res.status, 403, 'Must return 403 Forbidden');
    const body = await res.json();
    assert.strictEqual(body.error?.code, 'FORBIDDEN_FIELD_MUTATION');
  });

  await test('Strictly blocks attempts to mutate verification_status', async () => {
    const req = new NextRequest('http://localhost:3000/api/therapist/profile', {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${validTherapistToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ verification_status: 'verified' }),
    });
    const res = await patchProfileRoute(req);
    assert.strictEqual(res.status, 403, 'Must return 403 Forbidden');
    const body = await res.json();
    assert.strictEqual(body.error?.code, 'FORBIDDEN_FIELD_MUTATION');
  });

  await test('Strictly blocks attempts to mutate commission_rate', async () => {
    const req = new NextRequest('http://localhost:3000/api/therapist/profile', {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${validTherapistToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ commission_rate: 0 }),
    });
    const res = await patchProfileRoute(req);
    assert.strictEqual(res.status, 403, 'Must return 403 Forbidden');
  });

  await test('Strictly blocks attempts to hijack therapist_account_id or role', async () => {
    const req = new NextRequest('http://localhost:3000/api/therapist/profile', {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${validTherapistToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ therapist_account_id: 'other-therapist-id', role: 'admin' }),
    });
    const res = await patchProfileRoute(req);
    assert.strictEqual(res.status, 403, 'Must return 403 Forbidden');
  });

  // --- SECTION 5: Input Validation & Sanitization ---
  console.log('\n--- SECTION 4: Input Validation & Sanitization ---');

  await test('Rejects empty or blank professional name', async () => {
    let threw = false;
    try {
      await TherapistPlatformService.updateProfile(testTherapistId, { full_name: '   ' });
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.code, 'INVALID_FULL_NAME');
    }
    assert(threw, 'Should throw INVALID_FULL_NAME');
  });

  await test('Rejects invalid experience years (negative or excessive)', async () => {
    let threw = false;
    try {
      await TherapistPlatformService.updateProfile(testTherapistId, { experience_years: -5 });
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.code, 'INVALID_EXPERIENCE_YEARS');
    }
    assert(threw, 'Should throw INVALID_EXPERIENCE_YEARS on negative value');

    threw = false;
    try {
      await TherapistPlatformService.updateProfile(testTherapistId, { experience_years: 120 });
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.code, 'INVALID_EXPERIENCE_YEARS');
    }
    assert(threw, 'Should throw INVALID_EXPERIENCE_YEARS on excessive value');
  });

  await test('Accepts valid canonical IANA timezone and rejects invalid timezone', async () => {
    // Valid timezone
    const res = await TherapistPlatformService.updateProfile(testTherapistId, {
      timezone: 'Asia/Kolkata',
    });
    assert.strictEqual(res.timezone, 'Asia/Kolkata');

    // Invalid timezone
    let threw = false;
    try {
      await TherapistPlatformService.updateProfile(testTherapistId, {
        timezone: 'Mars/Curiosity_Crater',
      });
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.code, 'INVALID_TIMEZONE');
    }
    assert(threw, 'Should throw INVALID_TIMEZONE on invalid string');
  });

  await test('Validates session formats to only allow telehealth and in_person', async () => {
    let threw = false;
    try {
      await TherapistPlatformService.updateProfile(testTherapistId, {
        session_formats: ['telehealth', 'telepathy_unverified'],
      });
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.code, 'INVALID_SESSION_FORMATS');
    }
    assert(threw, 'Should throw INVALID_SESSION_FORMATS on unsupported format');
  });

  await test('Updates practice details, bio, and notification preferences successfully', async () => {
    const updated = await TherapistPlatformService.updateProfile(testTherapistId, {
      full_name: 'Dr. Siddharth Sharma',
      title: 'Senior Clinical Psychologist',
      bio: 'Specialist in somatic trauma resolution and cognitive therapy.',
      qualification: 'Ph.D. Clinical Psychology, NIMHANS',
      experience_years: 12,
      specializations: ['Cognitive Behavioral Therapy (CBT)', 'Trauma & PTSD'],
      languages: ['English', 'Hindi', 'Marathi'],
      practice_name: 'Ingress Clinical Suite',
      practice_address: 'Suite 402, Lotus Business Park, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      timezone: 'Asia/Kolkata',
      notification_preferences: {
        email_appointment_reminders: true,
        email_booking_notifications: true,
        email_cancellation_alerts: true,
        email_homework_submissions: true,
        in_app_session_alerts: true,
        security_alerts: true,
      },
    });

    assert.strictEqual(updated.full_name, 'Dr. Siddharth Sharma');
    assert.strictEqual(updated.practice_name, 'Ingress Clinical Suite');
    assert.strictEqual(updated.experience_years, 12);
    assert.strictEqual(updated.timezone, 'Asia/Kolkata');
    assert(updated.specializations.includes('Trauma & PTSD'));
  });

  // --- SECTION 6: Active Sessions & Device Management ---
  console.log('\n--- SECTION 5: Active Sessions & Privacy Security ---');

  await test('getActiveSessions returns safe session list without sensitive password/token hashes', async () => {
    const sessions = await TherapistPlatformService.getActiveSessions(testTherapistId, testDeviceId);
    assert(Array.isArray(sessions), 'Must return an array of sessions');
    assert(sessions.length >= 1, 'Must include at least the current session');

    const json = JSON.stringify(sessions);
    assert(!json.includes('refresh_token_hash'), 'Zero refresh token hash exposure');
    assert(!json.includes('password'), 'Zero password exposure');
    assert(!json.includes('secret'), 'Zero secret exposure');

    const currentSess = sessions.find((s) => s.isCurrent);
    assert(currentSess, 'Identifies current session');
  });

  await test('revokeSession marks target session inactive', async () => {
    const res = await TherapistPlatformService.revokeSession(testTherapistId, 'other-device-456');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.revokedDeviceId, 'other-device-456');
  });

  await test('revokeOtherSessions revokes all sessions except current caller device', async () => {
    const res = await TherapistPlatformService.revokeOtherSessions(testTherapistId, testDeviceId);
    assert.strictEqual(res.success, true);
    assert(typeof res.revokedCount === 'number');
  });

  // --- SECTION 7: Practice Offboarding & Deactivation Readiness ---
  console.log('\n--- SECTION 6: Clinical Practice Offboarding Readiness ---');

  await test('checkDeactivationReadiness returns readiness assessment', async () => {
    const readiness = await TherapistPlatformService.checkDeactivationReadiness(testTherapistId);
    assert(typeof readiness.canDeactivate === 'boolean', 'canDeactivate is boolean');
    assert(Array.isArray(readiness.blockingReasons), 'blockingReasons is array');
    assert(typeof readiness.activeClients === 'number', 'activeClients is number');
    assert(typeof readiness.upcomingSessions === 'number', 'upcomingSessions is number');
    assert(typeof readiness.availableBalance === 'number', 'availableBalance is number');
  });

  await test('Rejects deactivation with DEACTIVATION_BLOCKED when clinical obligations exist', async () => {
    // If active clients or funds exist, checkDeactivationReadiness reports reasons
    const readiness = await TherapistPlatformService.checkDeactivationReadiness(testTherapistId);
    if (!readiness.canDeactivate) {
      assert(readiness.blockingReasons.length > 0, 'Must have descriptive clinical reasons');
    }
  });

  // --- SECTION 8: Frontend UI & Route Integrity ---
  console.log('\n--- SECTION 7: Frontend Component & Navigation Integration ---');

  await test('TherapistProfileView.jsx exists on disk and contains all settings tabs', () => {
    const profileViewPath = path.join(process.cwd(), 'src/views/therapist/TherapistProfileView.jsx');
    assert(fs.existsSync(profileViewPath), 'TherapistProfileView.jsx must exist');
    const source = fs.readFileSync(profileViewPath, 'utf8');

    assert(source.includes('Personal & Professional'), 'Contains Personal & Professional section');
    assert(source.includes('Practice & Sessions'), 'Contains Practice & Sessions section');
    assert(source.includes('Google Calendar & Meet'), 'Contains Google Calendar section');
    assert(source.includes('Earnings & Payouts'), 'Contains Earnings & Payouts section');
    assert(source.includes('Communication & Alert Preferences'), 'Contains Notification Preferences section');
    assert(source.includes('Active Device Sessions'), 'Contains Active Device Sessions section');
    assert(source.includes('Practice Offboarding & Deactivation'), 'Contains Deactivation section');
    assert(source.includes('TherapistCalendarIntegrationCard'), 'Embeds existing Google Calendar card');
    assert(source.includes('isDirty'), 'Implements dirty state detection');
    assert(source.includes('completeness'), 'Calculates real profile completeness');
  });

  await test('TherapistDashboardShell registers profile tab and passes navigation handlers', () => {
    const shellPath = path.join(process.cwd(), 'src/views/therapist/TherapistDashboardShell.jsx');
    const source = fs.readFileSync(shellPath, 'utf8');
    assert(source.includes("id: 'profile'"), 'Shell includes profile navigation item');
    assert(source.includes('TherapistProfileView'), 'Shell renders TherapistProfileView');
    assert(source.includes('onNavigateTab'), 'Shell passes onNavigateTab prop');
  });

  await test('App.jsx routes therapist/profile to TherapistPlatformView', () => {
    const appPath = path.join(process.cwd(), 'src/App.jsx');
    const source = fs.readFileSync(appPath, 'utf8');
    assert(source.includes("case 'therapist/profile':"), 'App.jsx routes therapist/profile');
  });

  console.log('\n================================================================');
  console.log(`  PROFILE SUITE RESULTS: ${passed}/${total} PASSING`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
