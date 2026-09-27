import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { requireAuthorizedAdmin } from '../src/lib/auth/adminAuthHelper';
import { AdminAuditService } from '../src/lib/admin/adminAuditService';
import { SessionBookingService } from '../src/lib/therapy/sessionBookingService';
import { TherapistPayoutService } from '../src/lib/therapist/therapistPayoutService';
import { TherapistPlatformService } from '../src/lib/therapist/therapistPlatformService';
import { BillingService } from '../src/lib/billing/billingService';
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

async function runHardeningSuite() {
  console.log('================================================================');
  console.log('  INGRESS WITHIN — ADMIN AUTH, REFUND & NO-SHOW HARDENING SUITE ');
  console.log('================================================================\n');

  // ===========================================================================
  // SECTION 1: Migration 011 & Database Schema Verification
  // ===========================================================================
  console.log('--- SECTION 1: Migration 011 & Database Invariants ---');

  const migration011Path = path.join(
    process.cwd(),
    'src/lib/auth/migrations/011_admin_authorization_and_audit_logs.sql'
  );
  assert(fs.existsSync(migration011Path), 'Migration 011 exists on disk');

  const migration011 = fs.readFileSync(migration011Path, 'utf8');
  assert(
    migration011.includes('CREATE TABLE IF NOT EXISTS public.admin_audit_logs'),
    'Defines public.admin_audit_logs table'
  );
  assert(
    migration011.includes('chk_appt_refund_status') &&
    migration011.includes("'none', 'eligible', 'pending', 'full', 'partial', 'denied', 'failed'"),
    'Enforces explicit refund status check constraint on appointments'
  );
  assert(
    migration011.includes('chk_booking_refund_status') &&
    migration011.includes("'none', 'eligible', 'pending', 'full', 'partial', 'denied', 'failed'"),
    'Enforces explicit refund status check constraint on therapy bookings'
  );
  assert(
    migration011.includes('ENABLE ROW LEVEL SECURITY'),
    'Enables RLS on admin_audit_logs'
  );

  // ===========================================================================
  // SECTION 2: Zero Development Secret Fallback Audit
  // ===========================================================================
  console.log('\n--- SECTION 2: Codebase Audit for Insecure Secret Fallbacks ---');

  const appDir = path.join(process.cwd(), 'src');
  const findStringInDir = (dir: string, needle: string): string[] => {
    let matches: string[] = [];
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        matches = matches.concat(findStringInDir(full, needle));
      } else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js')) {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes(needle)) {
          matches.push(full);
        }
      }
    }
    return matches;
  };

  const devSecretMatches = findStringInDir(appDir, 'iw_admin_dev_secret');
  assert(
    devSecretMatches.length === 0,
    `Zero occurrences of 'iw_admin_dev_secret' in src/ (found: ${devSecretMatches.length})`
  );

  // ===========================================================================
  // SECTION 3: Centralized Server-Side Admin Authorization (requireAuthorizedAdmin)
  // ===========================================================================
  console.log('\n--- SECTION 3: Centralized Admin Authorization ---');

  // Test 3.1: Request with no credentials
  let unauthRejected = false;
  try {
    const req = new NextRequest('http://localhost:3000/api/admin/payouts');
    await requireAuthorizedAdmin(req);
  } catch (err: any) {
    unauthRejected = err.status === 403 || err.code === 'ADMIN_UNAUTHORIZED';
  }
  assert(unauthRejected, 'Request without credentials rejected with 403');

  // Test 3.2: Request with fake dev secret in x-admin-key
  let fakeDevRejected = false;
  try {
    const req = new NextRequest('http://localhost:3000/api/admin/payouts', {
      headers: { 'x-admin-key': 'iw_admin_dev_secret' },
    });
    await requireAuthorizedAdmin(req);
  } catch (err: any) {
    fakeDevRejected = err.status === 403 || err.code === 'ADMIN_UNAUTHORIZED';
  }
  assert(fakeDevRejected, "Request with 'iw_admin_dev_secret' strictly rejected with 403");

  // Test 3.3: Request with valid configured admin secret key
  const prevAdminSecret = process.env.ADMIN_SECRET_KEY;
  const testAdminKey = 'valid_test_admin_secret_key_999!';
  process.env.ADMIN_SECRET_KEY = testAdminKey;

  try {
    const validReq = new NextRequest('http://localhost:3000/api/admin/payouts', {
      headers: { 'x-admin-key': testAdminKey },
    });
    const session = await requireAuthorizedAdmin(validReq);
    assert(session.actorType === 'admin_api_key', 'Valid admin key authenticates as admin_api_key');
    assert(session.role === 'admin', 'Session role is admin');
  } finally {
    process.env.ADMIN_SECRET_KEY = prevAdminSecret;
  }

  // ===========================================================================
  // SECTION 4: Admin Audit Logging & Metadata Redaction
  // ===========================================================================
  console.log('\n--- SECTION 4: Admin Audit Logging & Secret Redaction ---');

  const auditRecord = await AdminAuditService.logAction({
    actorId: 'admin_test_001',
    actorType: 'admin_user',
    action: 'therapist_approved',
    entityType: 'therapist',
    entityId: 'th_test_123',
    metadata: {
      actionReason: 'Credentials verified',
      sensitiveKey: 'super_secret_password_123',
      api_key: 'sk_live_abc123',
      nested: {
        authToken: 'bearer_secret_xyz',
        normalInfo: 'visible data',
      },
    },
  });

  assert(auditRecord.actor_id === 'admin_test_001', 'Audit log records correct actor ID');
  assert(auditRecord.metadata.sensitiveKey === '[REDACTED]', 'Redacts sensitiveKey');
  assert(auditRecord.metadata.api_key === '[REDACTED]', 'Redacts api_key');
  assert(auditRecord.metadata.nested.authToken === '[REDACTED]', 'Redacts nested authToken');
  assert(auditRecord.metadata.nested.normalInfo === 'visible data', 'Preserves non-sensitive metadata');

  // ===========================================================================
  // SECTION 5: Refund Reliability & Idempotency
  // ===========================================================================
  console.log('\n--- SECTION 5: Refund Reliability & Idempotency ---');

  const testUserId = crypto.randomUUID();
  const testTherapistAuthId = crypto.randomUUID();
  const testTherapistId = crypto.randomUUID();
  const randSuffix = Math.floor(100000 + Math.random() * 900000);

  // Seed user
  const { error: userErr } = await supabase.from('users').insert({
    id: testUserId,
    phone_number: `+9198${randSuffix}`,
    name: 'Hardening Test Client',
  });
  if (userErr) console.warn('[Test] User insert note:', userErr.message);

  // Seed therapist
  const { error: thErr } = await supabase.from('therapist_accounts').insert({
    id: testTherapistId,
    auth_user_id: testTherapistAuthId,
    phone_number: `+9197${randSuffix}`,
    status: 'active',
  });
  if (thErr) console.warn('[Test] Therapist insert note:', thErr.message);

  const testApptId = crypto.randomUUID();

  // Seed test appointment
  const { error: apptErr } = await supabase.from('therapist_clinical_appointments').insert({
    id: testApptId,
    therapist_account_id: testTherapistId,
    user_id: testUserId,
    scheduled_start: new Date(Date.now() + 72 * 3600 * 1000).toISOString(), // 72h out
    scheduled_end: new Date(Date.now() + 73 * 3600 * 1000).toISOString(),
    status: 'scheduled',
    attendance_status: 'scheduled',
    refund_status: 'none',
    payment_id: 'pay_test_failed_mock',
  });
  if (apptErr) console.warn('[Test] Appointment insert note:', apptErr.message);

  // Seed therapist earning
  await TherapistPayoutService.recordEarningForAppointment({
    appointmentId: testApptId,
    therapistAccountId: testTherapistId,
    grossAmount: 1500,
  });

  // Test 5.1: Cancel when Razorpay refund fails
  // Simulate Razorpay failure by unconfiguring or letting mock fail
  const cancelResult = await SessionBookingService.cancelSession({
    appointmentId: testApptId,
    cancelledBy: 'client',
    reason: 'Schedule conflict',
  });

  assert(
    cancelResult.refundStatus === 'failed',
    'Preserves refundStatus as failed when payment provider fails or is unconfigured'
  );

  // Verify therapist earnings were NOT voided since money was not refunded
  const earningAfterFail = await TherapistPayoutService.getEarningByAppointmentId(testApptId);
  assert(
    earningAfterFail?.payment_status === 'collected',
    'Therapist earning remains collected/intact when refund fails (not falsely voided)'
  );

  // Test 5.2: Retry refund
  // Mock Razorpay client to return successful refund
  const originalGetClient = BillingService.getRazorpayClient;
  (BillingService as any).getRazorpayClient = () => ({
    payments: {
      refund: async () => ({ id: `rfnd_mock_success_${Date.now()}` }),
    },
  });

  try {
    const retryResult = await SessionBookingService.retryRefund(testApptId, 'admin_super_01');
    assert(retryResult.success === true, 'Admin refund retry succeeds');
    assert(retryResult.refundStatus === 'full', 'Refund transitions to full on provider confirmation');
    assert(!!retryResult.refundId, 'Refund ID returned by provider');

    // Verify therapist earning is now voided
    const earningAfterRetry = await TherapistPayoutService.getEarningByAppointmentId(testApptId);
    assert(
      earningAfterRetry?.payment_status === 'cancelled',
      'Therapist earning voided after confirmed refund'
    );

    // Test 5.3: Idempotency anchor - subsequent refund attempts do not re-refund
    const idempResult = await SessionBookingService.retryRefund(testApptId, 'admin_super_01');
    assert(idempResult.alreadyRefunded === true, 'Idempotency prevents duplicate refund execution');
  } finally {
    BillingService.getRazorpayClient = originalGetClient;
  }

  // ===========================================================================
  // SECTION 6: No-Show Semantics & Clinical Care Invariants
  // ===========================================================================
  console.log('\n--- SECTION 6: No-Show Semantics & Care Relationship Invariants ---');

  const testRelId = crypto.randomUUID();
  await supabase.from('therapy_care_relationships').insert({
    id: testRelId,
    user_id: testUserId,
    therapist_account_id: testTherapistId,
    status: 'active',
    first_session_completed: false,
  });

  // Test 6.1: Client No-Show
  const clientNoShowApptId = crypto.randomUUID();
  await supabase.from('therapist_clinical_appointments').insert({
    id: clientNoShowApptId,
    therapist_account_id: testTherapistId,
    user_id: testUserId,
    relationship_id: testRelId,
    scheduled_start: new Date(Date.now() - 3600 * 1000).toISOString(),
    scheduled_end: new Date().toISOString(),
    status: 'scheduled',
    attendance_status: 'scheduled',
    refund_status: 'none',
  });

  await TherapistPayoutService.recordEarningForAppointment({
    appointmentId: clientNoShowApptId,
    therapistAccountId: testTherapistId,
    grossAmount: 1500,
  });

  const updatedClientNoShow = await SessionBookingService.recordAttendanceStatus({
    appointmentId: clientNoShowApptId,
    therapistAccountId: testTherapistId,
    attendanceStatus: 'client_no_show',
    notes: 'Client did not attend after 15 min waiting.',
  });

  assert(
    updatedClientNoShow.attendance_status === 'client_no_show',
    'Attendance status recorded as client_no_show'
  );
  assert(
    updatedClientNoShow.refund_status === 'denied',
    'Client no-show is non-refundable (refund_status: denied)'
  );

  const clientNoShowEarning = await TherapistPayoutService.getEarningByAppointmentId(clientNoShowApptId);
  assert(
    clientNoShowEarning?.payment_status === 'collected',
    'Therapist remains paid for client no-show'
  );

  // Verify first_session_completed remains FALSE!
  const { data: relAfterClientNoShow } = await supabase
    .from('therapy_care_relationships')
    .select('first_session_completed')
    .eq('id', testRelId)
    .single();
  assert(
    relAfterClientNoShow?.first_session_completed === false,
    'CRITICAL: Client no-show must NEVER set first_session_completed = true'
  );

  // Test 6.2: Therapist No-Show
  const thNoShowApptId = crypto.randomUUID();
  await supabase.from('therapist_clinical_appointments').insert({
    id: thNoShowApptId,
    therapist_account_id: testTherapistId,
    user_id: testUserId,
    relationship_id: testRelId,
    scheduled_start: new Date(Date.now() - 3600 * 1000).toISOString(),
    scheduled_end: new Date().toISOString(),
    status: 'scheduled',
    attendance_status: 'scheduled',
    refund_status: 'none',
  });

  await TherapistPayoutService.recordEarningForAppointment({
    appointmentId: thNoShowApptId,
    therapistAccountId: testTherapistId,
    grossAmount: 1500,
  });

  const updatedThNoShow = await SessionBookingService.recordAttendanceStatus({
    appointmentId: thNoShowApptId,
    therapistAccountId: testTherapistId,
    attendanceStatus: 'therapist_no_show',
    notes: 'Therapist did not connect.',
  });

  assert(
    updatedThNoShow.attendance_status === 'therapist_no_show',
    'Attendance status recorded as therapist_no_show'
  );

  const thNoShowEarning = await TherapistPayoutService.getEarningByAppointmentId(thNoShowApptId);
  assert(
    thNoShowEarning?.payment_status === 'cancelled',
    'Therapist earning is strictly voided for therapist no-show'
  );

  const { data: relAfterThNoShow } = await supabase
    .from('therapy_care_relationships')
    .select('first_session_completed')
    .eq('id', testRelId)
    .single();
  assert(
    relAfterThNoShow?.first_session_completed === false,
    'CRITICAL: Therapist no-show must NEVER set first_session_completed = true'
  );

  // Test 6.3: Attended Session
  const attendedApptId = crypto.randomUUID();
  await supabase.from('therapist_clinical_appointments').insert({
    id: attendedApptId,
    therapist_account_id: testTherapistId,
    user_id: testUserId,
    relationship_id: testRelId,
    scheduled_start: new Date(Date.now() - 3600 * 1000).toISOString(),
    scheduled_end: new Date().toISOString(),
    status: 'scheduled',
    attendance_status: 'scheduled',
    refund_status: 'none',
  });

  const updatedAttended = await SessionBookingService.recordAttendanceStatus({
    appointmentId: attendedApptId,
    therapistAccountId: testTherapistId,
    attendanceStatus: 'attended',
    notes: 'Full 50 minute session conducted.',
  });

  assert(
    updatedAttended.attendance_status === 'attended',
    'Attendance status recorded as attended'
  );
  assert(
    updatedAttended.status === 'completed',
    'Attended session status transitions to completed'
  );

  const { data: relAfterAttended } = await supabase
    .from('therapy_care_relationships')
    .select('first_session_completed')
    .eq('id', testRelId)
    .single();
  assert(
    relAfterAttended?.first_session_completed === true,
    'Care relationship first_session_completed set to true ONLY after attended session'
  );

  // ===========================================================================
  // SECTION 7: SOAP Notes & Dashboard No-Show Exclusion
  // ===========================================================================
  console.log('\n--- SECTION 7: SOAP Notes & Dashboard No-Show Exclusion ---');

  // Test 7.1: notesDue on dashboard excludes no-shows
  const dashboard = await TherapistPlatformService.getTodayOverview(testTherapistId);
  const notesDueIds = (dashboard.notesDue || []).map((n: any) => n.appointmentId);

  assert(
    !notesDueIds.includes(clientNoShowApptId),
    'Client no-show appointment is excluded from notesDue'
  );
  assert(
    !notesDueIds.includes(thNoShowApptId),
    'Therapist no-show appointment is excluded from notesDue'
  );
  assert(
    notesDueIds.includes(attendedApptId),
    'Attended appointment appears in notesDue for clinical documentation'
  );

  // Test 7.2: Saving SOAP notes on no-show is rejected
  let soapOnNoShowRejected = false;
  try {
    await TherapistPlatformService.saveSoapNote(testTherapistId, clientNoShowApptId, {
      subjective: 'Attempting note on no-show',
      isDraft: true,
    });
  } catch (err: any) {
    soapOnNoShowRejected = err.code === 'SESSION_NO_SHOW' && err.status === 400;
  }
  assert(
    soapOnNoShowRejected,
    'Attempting to save SOAP note on a no-show session is rejected with 400 SESSION_NO_SHOW'
  );

  // Test 7.3: Saving SOAP notes on attended session succeeds
  const savedSoap = await TherapistPlatformService.saveSoapNote(testTherapistId, attendedApptId, {
    subjective: 'Client discussed anxiety symptoms.',
    objective: 'Appropriate affect, fully engaged.',
    assessment: 'Moderate anxiety, good coping potential.',
    plan: 'Practice box breathing 2x daily.',
    isDraft: true,
  });
  assert(savedSoap?.isDraft === true, 'SOAP note draft saved successfully for attended session');

  // ===========================================================================
  // SECTION 8: Concurrency Protection Under Race Conditions
  // ===========================================================================
  console.log('\n--- SECTION 8: Concurrency Lock Race Protection ---');

  const concurrentApptId = crypto.randomUUID();
  await supabase.from('therapist_clinical_appointments').insert({
    id: concurrentApptId,
    therapist_account_id: testTherapistId,
    user_id: testUserId,
    scheduled_start: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    scheduled_end: new Date(Date.now() + 73 * 3600 * 1000).toISOString(),
    status: 'scheduled',
    attendance_status: 'scheduled',
    refund_status: 'none',
  });

  // Manually hold cancellation lock to verify rejection
  (SessionBookingService as any).activeCancellationLocks.add(concurrentApptId);
  let cancelRaceBlocked = false;
  try {
    await SessionBookingService.cancelSession({
      appointmentId: concurrentApptId,
      cancelledBy: 'client',
    });
  } catch (err: any) {
    cancelRaceBlocked = err.code === 'CONCURRENT_OPERATION' && err.status === 409;
  } finally {
    (SessionBookingService as any).activeCancellationLocks.delete(concurrentApptId);
  }
  assert(cancelRaceBlocked, 'Concurrent cancellation attempt blocked with 409 CONCURRENT_OPERATION');

  // Manually hold no-show lock to verify rejection
  (SessionBookingService as any).activeNoShowLocks.add(concurrentApptId);
  let noShowRaceBlocked = false;
  try {
    await SessionBookingService.recordAttendanceStatus({
      appointmentId: concurrentApptId,
      therapistAccountId: testTherapistId,
      attendanceStatus: 'client_no_show',
    });
  } catch (err: any) {
    noShowRaceBlocked = err.code === 'CONCURRENT_OPERATION' && err.status === 409;
  } finally {
    (SessionBookingService as any).activeNoShowLocks.delete(concurrentApptId);
  }
  assert(noShowRaceBlocked, 'Concurrent attendance recording blocked with 409 CONCURRENT_OPERATION');

  console.log('\n================================================================');
  console.log(`  ALL TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log('================================================================\n');
}

runHardeningSuite().catch((err) => {
  console.error('\nHardening suite failed with unhandled error:', err);
  process.exit(1);
});
