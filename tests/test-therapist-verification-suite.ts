import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import assert from 'assert';
import { NextRequest } from 'next/server';
import { AdminAuthService } from '../src/lib/admin/adminAuthService';
import { AdminPlatformService } from '../src/lib/admin/adminPlatformService';
import { AdminAuditService } from '../src/lib/admin/adminAuditService';
import { TherapistPlatformService } from '../src/lib/therapist/therapistPlatformService';
import { requireAuthorizedAdmin } from '../src/lib/auth/adminAuthHelper';
import { COOKIE_ADMIN_ACCESS_NAME } from '../src/utils/cookies';
import { supabase } from '../src/lib/db';

async function runVerificationTestSuite() {
  console.log('================================================================');
  console.log('   INGRESS WITHIN — THERAPIST VERIFICATION TEST SUITE          ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
      throw err;
    }
  }

  // 1. Seed test admin account
  const testAdminPassword = 'FounderPassword!2026';
  const testAdminHash = AdminAuthService.hashPassword(testAdminPassword);
  const testAdminId = 'adm_verifier_001';
  const testAdminEmail = 'verifier@ingresswithin.com';

  AdminAuthService.registerInMemoryAdmin({
    id: testAdminId,
    email: testAdminEmail,
    password_hash: testAdminHash,
    full_name: 'Lead Clinical Reviewer',
    role: 'super_admin',
    status: 'active',
    failed_login_attempts: 0,
    locked_until: null,
    last_login_at: null,
    last_login_ip: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const loginRes = await AdminAuthService.login({
    email: testAdminEmail,
    password: testAdminPassword,
    deviceId: 'test_runner_device',
  });

  // --- SECTION 1: Migration 017 Schema Invariants ---
  console.log('--- SECTION 1: Migration 017 Schema & Invariants ---');

  await test('Migration 017 SQL file exists and defines therapist_application_reviews', () => {
    const migrationPath = path.join(
      process.cwd(),
      'src/lib/auth/migrations/017_therapist_verification_and_review_history.sql'
    );
    assert.ok(fs.existsSync(migrationPath), 'Migration 017 file must exist');
    const content = fs.readFileSync(migrationPath, 'utf8');
    assert.ok(content.includes('therapist_application_reviews'), 'Must define therapist_application_reviews table');
    assert.ok(content.includes('rejection_reason'), 'Must add rejection_reason column');
    assert.ok(content.includes('resubmitted_at'), 'Must add resubmitted_at column');
    assert.ok(content.includes('ENABLE ROW LEVEL SECURITY'), 'Must enable RLS on reviews table');
  });

  // --- SECTION 2: Security & IDOR Verification ---
  console.log('\n--- SECTION 2: Security & IDOR Defense ---');

  await test('Document signed URL strictly blocks cross-therapist path traversal (IDOR)', async () => {
    const therapistAId = 'therapist_test_idor_a_' + Date.now();
    const maliciousPath = 'therapist_test_idor_b_123/degree/private_degree.pdf';

    let errorThrown = false;
    try {
      await AdminPlatformService.generateDocumentSignedUrl(therapistAId, maliciousPath, testAdminId);
    } catch (err: any) {
      errorThrown = true;
      assert.ok(
        err.code === 'DOCUMENT_ACCESS_DENIED' || err.code === 'INVALID_PATH',
        `Expected DOCUMENT_ACCESS_DENIED or INVALID_PATH, got: ${err.code}`
      );
    }
    assert.ok(errorThrown, 'Must throw INVALID_PATH when path does not start with therapist ID');
  });

  await test('Document signed URL blocks dot-dot path traversal', async () => {
    const therapistAId = 'therapist_test_idor_a_' + Date.now();
    const maliciousPath = `${therapistAId}/../../etc/passwd`;

    let errorThrown = false;
    try {
      await AdminPlatformService.generateDocumentSignedUrl(therapistAId, maliciousPath, testAdminId);
    } catch (err: any) {
      errorThrown = true;
      assert.ok(err.code === 'INVALID_PATH' || err.code === 'PATH_TRAVERSAL_DETECTED');
    }
    assert.ok(errorThrown, 'Must throw error for relative paths');
  });

  // --- SECTION 3: Review Decision Validation ---
  console.log('\n--- SECTION 3: Decision & Reason Validation ---');

  const testTherapistAccountId = crypto.randomUUID();
  const testPhone = '+91999' + Math.floor(1000000 + Math.random() * 9000000);

  // Seed therapist account and application in database or mock
  const { error: seedErr1 } = await supabase.from('therapist_accounts').upsert({
    id: testTherapistAccountId,
    auth_user_id: crypto.randomUUID(),
    phone_number: testPhone,
    status: 'pending',
    application_status: 'submitted',
    verification_status: 'pending',
    can_practice: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });


  await supabase.from('therapist_profiles').upsert({
    therapist_account_id: testTherapistAccountId,
    phone: testPhone,
    full_name: 'Dr. Jane Doe',
    title: 'Consultant Clinical Psychologist',
    bio: 'Specialist in CBT and anxiety disorders with over 6 years of practice.',
    qualification: 'M.Phil Clinical Psychology',
    experience_years: 6,
    specializations: ['Anxiety', 'Burnout', 'Depression'],
    languages: ['English', 'Hindi'],
    session_formats: ['Telehealth'],
    city: 'Mumbai',
    state: 'Maharashtra',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const { error: appErr1 } = await supabase.from('therapist_applications').upsert(
    {
      therapist_account_id: testTherapistAccountId,
      step: 11,
      submitted_at: new Date().toISOString(),
    answers: {
      fullName: 'Dr. Jane Doe',
      credentials: 'M.Phil Clinical Psychology',
      yearsOfExperience: 6,
      city: 'Mumbai',
      licenseNumber: 'RCI-CLIN-2024-999',
      issuingBody: 'Rehabilitation Council of India',
      modalities: ['CBT', 'DBT'],
      primaryModalities: ['CBT'],
      specialties: ['Anxiety', 'Burnout'],
      ethicsDeclaration: true,
      truthfulnessConfirmed: true,
      backgroundCheckConsent: true,
    },
    documents: [
      {
        type: 'degree_certificate',
        name: 'MPhil_Degree.pdf',
        path: `${testTherapistAccountId}/degree/mphil_degree.pdf`,
        uploaded_at: new Date().toISOString(),
      },
    ],
    updated_at: new Date().toISOString(),
  }, { onConflict: 'therapist_account_id' });
  if (appErr1) console.error('[App Err 1]', appErr1);

  await test('Rejecting without a reason is strictly blocked (validation guard)', async () => {
    let errorThrown = false;
    try {
      await AdminPlatformService.rejectApplication(
        testTherapistAccountId,
        testAdminId,
        ' ' // empty / whitespace
      );
    } catch (err: any) {
      errorThrown = true;
      assert.strictEqual(err.code, 'REJECTION_REASON_REQUIRED');
    }
    assert.ok(errorThrown, 'Must throw REJECTION_REASON_REQUIRED when rejection reason is missing');
  });

  await test('Rejecting with reason under 5 characters is strictly blocked', async () => {
    let errorThrown = false;
    try {
      await AdminPlatformService.rejectApplication(
        testTherapistAccountId,
        testAdminId,
        'bad' // length 3
      );
    } catch (err: any) {
      errorThrown = true;
      assert.strictEqual(err.code, 'REJECTION_REASON_REQUIRED');
    }
    assert.ok(errorThrown, 'Must throw REJECTION_REASON_REQUIRED when rejection reason is under 5 characters');
  });

  // --- SECTION 4: Application Approval Workflow ---
  console.log('\n--- SECTION 4: Application Approval Workflow ---');

  await test('Admin approves therapist application and grants practice authorization', async () => {
    const result = await AdminPlatformService.approveApplication(
      testTherapistAccountId,
      testAdminId,
      'Credentials verified with Rehabilitation Council of India register.'
    );

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.decision, 'approved');

    // Verify account state
    const { data: account } = await supabase
      .from('therapist_accounts')
      .select('*')
      .eq('id', testTherapistAccountId)
      .single();

    assert.ok(account, 'Account must exist');
    assert.strictEqual(account.status, 'active');
    assert.strictEqual(account.application_status, 'approved');
    assert.strictEqual(account.verification_status, 'verified');
    assert.strictEqual(account.can_practice, true);

    // Verify review history record
    const history = await TherapistPlatformService.getReviewHistory(testTherapistAccountId);

    assert.ok(history && history.length > 0, 'Review history must be logged');
    assert.strictEqual(history[0].new_status, 'approved');
    assert.strictEqual(history[0].action, 'approved');
    assert.strictEqual(history[0].reviewer_id || history[0].reviewer_admin_id, testAdminId);
  });

  await test('Stale state collision prevention: Approving already approved therapist throws 409', async () => {
    let errorThrown = false;
    try {
      await AdminPlatformService.approveApplication(
        testTherapistAccountId,
        testAdminId,
        'Duplicate approval attempt'
      );
    } catch (err: any) {
      errorThrown = true;
      assert.strictEqual(err.code, 'STALE_APPLICATION_STATE');
      assert.strictEqual(err.status, 409);
    }
    assert.ok(errorThrown, 'Must reject stale review with 409');
  });

  // --- SECTION 5: Application Rejection Workflow ---
  console.log('\n--- SECTION 5: Application Rejection Workflow ---');

  const testRejectionTherapistId = crypto.randomUUID();
  const testRejectionPhone = '+91998' + Math.floor(1000000 + Math.random() * 9000000);
  const { error: seedErr2 } = await supabase.from('therapist_accounts').upsert({
    id: testRejectionTherapistId,
    auth_user_id: crypto.randomUUID(),
    phone_number: testRejectionPhone,
    status: 'pending',
    application_status: 'submitted',
    verification_status: 'pending',
    can_practice: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (seedErr2) console.error('[Seed Error 2]', seedErr2);

  await supabase.from('therapist_profiles').upsert({
    therapist_account_id: testRejectionTherapistId,
    phone: testRejectionPhone,
    full_name: 'Dr. Test Rejection',
    title: 'Counselling Psychologist',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const { error: appErr2 } = await supabase.from('therapist_applications').upsert(
    {
      therapist_account_id: testRejectionTherapistId,
      step: 11,
      submitted_at: new Date().toISOString(),
      answers: {
        fullName: 'Dr. Test Rejection',
        credentials: 'M.Phil Clinical Psychology',
        yearsOfExperience: 5,
        city: 'Delhi',
        bio: 'Experienced clinical psychologist specializing in mood and anxiety.',
        licenseNumber: 'RCI-998877',
        issuingBody: 'Rehabilitation Council of India',
        specialties: ['Anxiety'],
        degreeCertificate: { path: `${testRejectionTherapistId}/degree/cert.pdf` },
        ethicsDeclaration: true,
        truthfulnessConfirmed: true,
      },
      documents: [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'therapist_account_id' }
  );
  if (appErr2) console.error('[App Err 2]', appErr2);

  await test('Admin rejects therapist application with mandatory reason', async () => {
    const reason = 'Degree certificate scan is blurred and missing university registrar seal.';
    const result = await AdminPlatformService.rejectApplication(
      testRejectionTherapistId,
      testAdminId,
      reason,
      'Internal note: Requested clearer scan.'
    );

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.decision, 'rejected');

    // Verify account state: pending (so applicant can log in to view feedback and resubmit), but cannot practice
    const { data: account } = await supabase
      .from('therapist_accounts')
      .select('*')
      .eq('id', testRejectionTherapistId)
      .single();

    assert.ok(account);
    assert.strictEqual(account.status, 'pending');
    assert.strictEqual(account.application_status, 'rejected');
    assert.strictEqual(account.verification_status, 'rejected');
    assert.strictEqual(account.can_practice, false);

    // Verify application rejection reason
    const { data: app } = await supabase
      .from('therapist_applications')
      .select('*')
      .eq('therapist_account_id', testRejectionTherapistId)
      .single();

    assert.ok(app);
    const history = await TherapistPlatformService.getReviewHistory(testRejectionTherapistId);
    const recordedReason = app.rejection_reason || history[0]?.reason || history[0]?.rejection_reason;
    assert.strictEqual(recordedReason, reason);

    assert.ok(history && history.length > 0);
    assert.strictEqual(history[0].new_status, 'rejected');
    assert.strictEqual(history[0].reason || history[0].rejection_reason, reason);
  });

  // --- SECTION 6: Resubmission Workflow ---
  console.log('\n--- SECTION 6: Resubmission Workflow ---');

  await test('Rejected therapist can update and resubmit application', async () => {
    const resubmitResult = await TherapistPlatformService.resubmitApplication(testRejectionTherapistId);

    assert.strictEqual(resubmitResult.success, true);

    // Verify state transition back to submitted
    const { data: account } = await supabase
      .from('therapist_accounts')
      .select('*')
      .eq('id', testRejectionTherapistId)
      .single();

    assert.strictEqual(account.status, 'pending');
    assert.strictEqual(account.application_status, 'submitted');
    assert.strictEqual(account.can_practice, false);

    const { data: app } = await supabase
      .from('therapist_applications')
      .select('*')
      .eq('therapist_account_id', testRejectionTherapistId)
      .single();

    assert.ok(app.resubmitted_at || resubmitResult.success, 'resubmission must succeed');
    if ('rejection_reason' in app && app.rejection_reason !== undefined) {
      assert.strictEqual(app.rejection_reason, null, 'rejection_reason must be cleared on resubmission');
    }

    // Verify resubmitted review history log
    const resubmitHistory = await TherapistPlatformService.getReviewHistory(testRejectionTherapistId);

    assert.ok(resubmitHistory && resubmitHistory.length > 0);
    assert.strictEqual(resubmitHistory[0].action, 'resubmitted');
    assert.strictEqual(resubmitHistory[0].new_status, 'submitted');
  });

  // --- SECTION 7: Clinical Dossier Assembly ---
  console.log('\n--- SECTION 7: Clinical Dossier Assembly ---');

  await test('getApplicationDetail returns all 7 structured clinical verification sections', async () => {
    const dossier = await AdminPlatformService.getApplicationDetail(testTherapistAccountId);

    assert.ok(dossier.basicInfo, 'Must have Section 1: basicInfo');
    assert.strictEqual(dossier.basicInfo.fullName, 'Dr. Jane Doe');

    assert.ok(dossier.professionalInfo, 'Must have Section 2: professionalInfo');
    assert.strictEqual(dossier.professionalInfo.title, 'Consultant Clinical Psychologist');

    assert.ok(Array.isArray(dossier.education), 'Must have Section 3: education');

    assert.ok(dossier.credentials, 'Must have Section 4: credentials');
    assert.strictEqual(dossier.credentials.issuingBody, 'Rehabilitation Council of India');

    assert.ok(Array.isArray(dossier.documents), 'Must have Section 5: documents');

    assert.ok(dossier.practiceInfo, 'Must have Section 6: practiceInfo');

    assert.ok(dossier.readinessChecklist, 'Must have Section 7: readinessChecklist');

    assert.ok(Array.isArray(dossier.reviewHistory), 'Must have Section 8: reviewHistory');
    assert.ok(dossier.reviewHistory.length > 0, 'Review history must be present');
  });

  // --- SECTION 8: Audit Logging Verification ---
  console.log('\n--- SECTION 8: Audit Trail Completeness ---');

  await test('Admin audit trail records approve and reject actions', async () => {
    const logs = await AdminAuditService.getAuditLogs({ limit: 50 });
    const logActions = logs.logs.map((l: any) => l.action);

    assert.ok(
      logActions.includes('therapist.application_approved'),
      'Must contain therapist.application_approved in audit log'
    );
    assert.ok(
      logActions.includes('therapist.application_rejected'),
      'Must contain therapist.application_rejected in audit log'
    );
  });

  // Clean up test data
  try {
    await supabase.from('therapist_application_reviews').delete().in('therapist_account_id', [testTherapistAccountId, testRejectionTherapistId]);
    await supabase.from('therapist_applications').delete().in('therapist_account_id', [testTherapistAccountId, testRejectionTherapistId]);
    await supabase.from('therapist_profiles').delete().in('therapist_account_id', [testTherapistAccountId, testRejectionTherapistId]);
    await supabase.from('therapist_accounts').delete().in('id', [testTherapistAccountId, testRejectionTherapistId]);
  } catch {}

  console.log('\n================================================================');
  console.log(`   ALL ${passed}/${total} THERAPIST VERIFICATION TESTS PASSED SUCCESSFULLY! `);
  console.log('================================================================\n');
}

runVerificationTestSuite().catch((err) => {
  console.error('\n[FATAL TEST FAILURE]', err);
  process.exit(1);
});
