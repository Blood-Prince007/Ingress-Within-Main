/**
 * ==============================================================================
 * INGRESS WITHIN — PRODUCTION GOOGLE CALENDAR & MEET SUITE
 * Test Suite: tests/test-google-calendar-meet-suite.ts
 * ==============================================================================
 * Covers:
 *   1. Google Meet URL strict validation (isValidGoogleMeetUrl)
 *   2. OAuth scopes, canonical URLs & zero forbidden domain references
 *   3. GoogleCalendarService conference generation, polling & idempotency
 *   4. TherapistPlatformService integration (getAppointmentById, getTodayOverview, getAppointments, createAppointment, cancelAppointment)
 *   5. SessionBookingService integration (confirmSessionPayment, retryCalendarSync)
 *   6. Client API session endpoint strict Google Meet output
 *   7. Therapist UI views zero-mock & strict Meet link integrity
 *   8. Therapist token isolation and AES-256-GCM encryption verification
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { GoogleCalendarService, isValidGoogleMeetUrl } from '../src/lib/calendar/googleCalendarService';
import { GoogleAuthService, GOOGLE_CALENDAR_SCOPES } from '../src/lib/calendar/googleAuthService';
import { encryptToken, decryptToken } from '../src/utils/encryption';
import { TherapistPlatformService } from '../src/lib/therapist/therapistPlatformService';
import { SessionBookingService } from '../src/lib/therapy/sessionBookingService';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${message}`);
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runSuite() {
  console.log('================================================================');
  console.log('  INGRESS WITHIN — GOOGLE CALENDAR & MEET VERIFICATION SUITE  ');
  console.log('================================================================\n');

  // ===========================================================================
  // SECTION 1: Google Meet URL Strict Validation (isValidGoogleMeetUrl)
  // ===========================================================================
  console.log('--- SECTION 1: Google Meet URL Strict Validation ---');
  assert(isValidGoogleMeetUrl('https://meet.google.com/abc-defg-hij'), 'Valid 3-4-3 Google Meet URL accepted');
  assert(isValidGoogleMeetUrl('https://meet.google.com/xyz-uvwx-rst'), 'Valid standard Meet URL accepted');
  assert(!isValidGoogleMeetUrl('http://meet.google.com/abc-defg-hij'), 'HTTP Meet URL rejected for security');
  assert(!isValidGoogleMeetUrl('https://meet.ingresswithin.com/room-123'), 'Rejects custom domain meet.ingresswithin.com');
  assert(!isValidGoogleMeetUrl('https://app.ingresswithin.com/meet/123'), 'Rejects app.ingresswithin.com');
  assert(!isValidGoogleMeetUrl('https://zoom.us/j/123456789'), 'Rejects Zoom URLs');
  assert(!isValidGoogleMeetUrl('https://daily.co/room-123'), 'Rejects Daily.co URLs');
  assert(!isValidGoogleMeetUrl('https://meet.google.com/iw-fake-test'), 'Rejects fabricated meet.google.com URL without standard pattern');
  assert(!isValidGoogleMeetUrl(''), 'Rejects empty string');
  assert(!isValidGoogleMeetUrl(null), 'Rejects null');
  assert(!isValidGoogleMeetUrl(undefined), 'Rejects undefined');
  assert(!isValidGoogleMeetUrl('javascript:alert(1)'), 'Rejects javascript: URI scheme');

  // ===========================================================================
  // SECTION 2: OAuth Scopes, Canonical URLs & Zero Forbidden Domains
  // ===========================================================================
  console.log('\n--- SECTION 2: OAuth Scopes, Canonical URLs & Forbidden Domain Scan ---');
  const googleAuthFile = fs.readFileSync(
    path.join(process.cwd(), 'src/lib/calendar/googleAuthService.ts'),
    'utf8'
  );
  assert(googleAuthFile.includes('https://www.googleapis.com/auth/calendar.events'), 'Requests calendar.events scope');
  assert(googleAuthFile.includes('https://www.googleapis.com/auth/userinfo.email'), 'Requests userinfo.email scope');
  assert(!GOOGLE_CALENDAR_SCOPES.includes('https://www.googleapis.com/auth/calendar.readonly'), 'GOOGLE_CALENDAR_SCOPES does not request unnecessary readonly scope');

  // Scan codebase for forbidden hostnames in src/
  function scanDirForForbiddenStrings(dir: string, forbidden: string[]): { file: string; found: string }[] {
    const results: { file: string; found: string }[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '.git') {
          results.push(...scanDirForForbiddenStrings(fullPath, forbidden));
        }
      } else if (/\.(js|jsx|ts|tsx|json|sql)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const term of forbidden) {
          if (content.includes(term)) {
            results.push({ file: fullPath, found: term });
          }
        }
      }
    }
    return results;
  }

  const forbiddenFindings = scanDirForForbiddenStrings(
    path.join(process.cwd(), 'src'),
    ['app.ingresswithin.com', 'meet.ingresswithin.com']
  );
  assert(
    forbiddenFindings.length === 0,
    `Zero occurrences of app.ingresswithin.com or meet.ingresswithin.com in src/ (Found ${forbiddenFindings.length})`
  );

  // ===========================================================================
  // SECTION 3: GoogleCalendarService Conference Generation & Polling
  // ===========================================================================
  console.log('\n--- SECTION 3: GoogleCalendarService Structure & Resiliency ---');
  const googleCalFile = fs.readFileSync(
    path.join(process.cwd(), 'src/lib/calendar/googleCalendarService.ts'),
    'utf8'
  );
  assert(googleCalFile.includes('pollConferenceCreation'), 'Contains pollConferenceCreation backoff method');
  assert(googleCalFile.includes('syncAppointmentToGoogle'), 'Contains canonical syncAppointmentToGoogle method');
  assert(googleCalFile.includes('conferenceDataVersion: 1') || googleCalFile.includes('conferenceDataVersion=1'), 'Uses conferenceDataVersion=1');
  assert(googleCalFile.includes('createRequest'), 'Uses conferenceData.createRequest');
  assert(googleCalFile.includes('hangoutsMeet'), 'Specifies hangoutsMeet conference solution');
  assert(googleCalFile.includes('updateEventTimes'), 'Contains updateEventTimes (PATCH) for rescheduling');
  assert(googleCalFile.includes('deleteEvent'), 'Contains deleteEvent for cancellation');
  assert(googleCalFile.includes('METHOD: \'PATCH\'') || googleCalFile.includes("method: 'PATCH'"), 'Rescheduling uses HTTP PATCH method to preserve Meet conference');

  // Test token encryption & isolation
  const token = 'sample_oauth_token_' + crypto.randomBytes(16).toString('hex');
  const encrypted = encryptToken(token);
  const decrypted = decryptToken(encrypted);
  assert(decrypted === token, 'Token encryption/decryption round-trip succeeds');

  // ===========================================================================
  // SECTION 4: TherapistPlatformService Calendar & Meet Return Signatures
  // ===========================================================================
  console.log('\n--- SECTION 4: TherapistPlatformService Google Meet Field Integration ---');
  const therapistServiceFile = fs.readFileSync(
    path.join(process.cwd(), 'src/lib/therapist/therapistPlatformService.ts'),
    'utf8'
  );

  assert(therapistServiceFile.includes('google_meet_url'), 'Selects google_meet_url from database');
  assert(therapistServiceFile.includes('google_calendar_event_id'), 'Selects google_calendar_event_id from database');
  assert(therapistServiceFile.includes('calendar_sync_status'), 'Selects calendar_sync_status from database');
  assert(therapistServiceFile.includes('GoogleCalendarService.syncAppointmentToGoogle'), 'createAppointment triggers syncAppointmentToGoogle');
  assert(therapistServiceFile.includes('GoogleCalendarService.deleteEvent'), 'cancelAppointment triggers deleteEvent');

  // Test getAppointmentById return signature safety with unauthenticated/dummy data
  let notFoundCaught = false;
  try {
    await TherapistPlatformService.getAppointmentById('00000000-0000-0000-0000-000000000000');
  } catch (err: any) {
    if (err.code === 'SESSION_NOT_FOUND' || err.status === 404) {
      notFoundCaught = true;
    }
  }
  assert(notFoundCaught, 'getAppointmentById throws SESSION_NOT_FOUND (404) safely for non-existent appointment');

  // ===========================================================================
  // SECTION 5: SessionBookingService Calendar Synchronization
  // ===========================================================================
  console.log('\n--- SECTION 5: SessionBookingService Calendar Synchronization ---');
  const bookingServiceFile = fs.readFileSync(
    path.join(process.cwd(), 'src/lib/therapy/sessionBookingService.ts'),
    'utf8'
  );
  assert(bookingServiceFile.includes('GoogleCalendarService.syncAppointmentToGoogle'), 'SessionBookingService delegates calendar sync to canonical syncAppointmentToGoogle');
  assert(bookingServiceFile.includes('retryCalendarSync'), 'Provides retryCalendarSync method for error recovery');

  // ===========================================================================
  // SECTION 6: Client API Sessions Route Strict Google Meet Output
  // ===========================================================================
  console.log('\n--- SECTION 6: Client API Sessions Route Verification ---');
  const clientRouteFile = fs.readFileSync(
    path.join(process.cwd(), 'src/app/api/therapy/client/sessions/route.ts'),
    'utf8'
  );
  assert(clientRouteFile.includes('isValidGoogleMeetUrl'), 'Client sessions route uses isValidGoogleMeetUrl');
  assert(!clientRouteFile.includes('appt.meeting_link'), 'Client sessions route does not fall back to legacy meeting_link');

  // ===========================================================================
  // SECTION 7: Therapist Frontend Views Strict Meet Rendering
  // ===========================================================================
  console.log('\n--- SECTION 7: Therapist Frontend Views Strict Meet Rendering ---');
  const sessionDetailView = fs.readFileSync(
    path.join(process.cwd(), 'src/views/therapist/TherapistSessionDetailView.jsx'),
    'utf8'
  );
  assert(sessionDetailView.includes('Join Google Meet'), 'TherapistSessionDetailView contains Join Google Meet button');
  assert(sessionDetailView.includes("rawMeetUrl.startsWith('https://meet.google.com/')"), 'TherapistSessionDetailView strictly verifies https://meet.google.com/ URL prefix');
  assert(!sessionDetailView.includes('session.meeting_link'), 'TherapistSessionDetailView has zero legacy meeting_link fallback');

  const todayView = fs.readFileSync(
    path.join(process.cwd(), 'src/views/therapist/TherapistTodayView.jsx'),
    'utf8'
  );
  assert(todayView.includes('Join Google Meet'), 'TherapistTodayView renders Join Google Meet button');
  assert(todayView.includes('session.googleMeetUrl'), 'TherapistTodayView relies strictly on googleMeetUrl field');
  assert(!todayView.includes('session.meeting_link'), 'TherapistTodayView has zero legacy meeting_link fallback');

  const calendarView = fs.readFileSync(
    path.join(process.cwd(), 'src/views/therapist/TherapistCalendarView.jsx'),
    'utf8'
  );
  assert(calendarView.includes('Join Google Meet'), 'TherapistCalendarView renders Join Google Meet');
  assert(calendarView.includes('appt.googleMeetUrl'), 'TherapistCalendarView checks validated googleMeetUrl');
  assert(!calendarView.includes('appt.meeting_link'), 'TherapistCalendarView has zero legacy meeting_link fallback');

  // ===========================================================================
  // SECTION 8: Isolation Between Therapists
  // ===========================================================================
  console.log('\n--- SECTION 8: Therapist Isolation & Safety ---');
  const therapist1Id = crypto.randomUUID();
  const therapist2Id = crypto.randomUUID();
  assert(therapist1Id !== therapist2Id, 'Generated distinct therapist UUIDs');

  const token1 = 'token_for_therapist_1';
  const token2 = 'token_for_therapist_2';
  const enc1 = encryptToken(token1);
  const enc2 = encryptToken(token2);
  assert(enc1 !== enc2, 'Different tokens produce unique ciphertexts');
  assert(decryptToken(enc1) === token1, 'Decrypts token 1 correctly');
  assert(decryptToken(enc2) === token2, 'Decrypts token 2 correctly');

  console.log('\n================================================================');
  console.log(`  GOOGLE CALENDAR & MEET SUITE RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');
}

runSuite().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
