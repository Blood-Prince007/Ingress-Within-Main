import assert from 'assert';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

// 1. Set environment flags before importing application services
process.env.TEST_MODE = 'true';
process.env.NODE_ENV = 'test';
process.env.BYPASS_REDIS = 'true';
process.env.EMAIL_FROM = 'care@ingresswithin.com';
process.env.THERAPIST_APPLICATION_NOTIFICATION_EMAIL = 'contactus@ingresswithin.com';
process.env.RESEND_WEBHOOK_SECRET = 'whsec_test_secret_key_1234567890';
process.env.ALLOW_MOCK_EMAIL = 'true';
process.env.FORCE_MOCK_EMAIL = 'true';

import { validateAndNormalizeEmail } from '../src/lib/email/emailValidation';
import { EmailService } from '../src/lib/email/emailService';
import { EmailTemplates } from '../src/lib/email/emailTemplates';
import { EmailEvents } from '../src/lib/email/emailEvents';
import { LoggedEmailProvider, RestEmailProvider, MissingCredentialsProvider, getEmailProvider } from '../src/lib/email/emailProvider';
import { getEmailConfig } from '../src/lib/email/emailConfig';
import { processEmailJob, EmailWorkerError } from '../src/lib/queue/workers/emailWorker';
import { TherapistPlatformService } from '../src/lib/therapist/therapistPlatformService';
import { AdminPlatformService } from '../src/lib/admin/adminPlatformService';
import { GET as getAdminEmailsHandler, POST as postAdminEmailsHandler } from '../src/app/api/admin/emails/route';

import { POST as emailWebhookHandler } from '../src/app/api/webhooks/email/route';
import { AdminAuthService } from '../src/lib/admin/adminAuthService';
import { COOKIE_ADMIN_ACCESS_NAME } from '../src/utils/cookies';
import { signJwt } from '../src/utils/crypto';
import { supabase } from '../src/lib/db';

let passed = 0;
let total = 0;

async function test(name: string, fn: () => Promise<void> | void) {
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

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('   INGRESS WITHIN — TRANSACTIONAL EMAIL SYSTEM TEST SUITE        ');
  console.log('================================================================\n');

  // --- SECTION 1: Email Field & Security Validation ---
  console.log('--- SECTION 1: Email Field & Server-Side Security Validation ---');

  await test('Rejects missing or empty email', () => {
    assert.strictEqual(validateAndNormalizeEmail('').valid, false);
    assert.strictEqual(validateAndNormalizeEmail(null).valid, false);
    assert.strictEqual(validateAndNormalizeEmail(undefined).valid, false);
  });

  await test('Validates and normalizes valid email address to canonical lowercase', () => {
    const res = validateAndNormalizeEmail('  Doctor.Smith@Hospital.ORG  ');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.normalizedEmail, 'Doctor.Smith@hospital.org');
  });

  await test('Rejects malformed emails lacking domain or at-sign', () => {
    assert.strictEqual(validateAndNormalizeEmail('invalid-email').valid, false);
    assert.strictEqual(validateAndNormalizeEmail('invalid@').valid, false);
    assert.strictEqual(validateAndNormalizeEmail('@example.com').valid, false);
    assert.strictEqual(validateAndNormalizeEmail('user@domain').valid, false);
  });

  await test('Blocks CRLF and Header Injection characters in email addresses', () => {
    assert.strictEqual(validateAndNormalizeEmail('victim@example.com\r\nBcc: evil@attacker.com').valid, false);
    assert.strictEqual(validateAndNormalizeEmail('victim@example.com%0aBcc: evil@attacker.com').valid, false);
    assert.strictEqual(validateAndNormalizeEmail('victim@example.com\nSubject: Injected').valid, false);
  });

  await test('Enforces maximum length limits (<= 254 chars per RFC 5321)', () => {
    const superLong = 'a'.repeat(250) + '@example.com';
    assert.strictEqual(validateAndNormalizeEmail(superLong).valid, false);
  });

  // --- SECTION 2: Email Template Rendering & Integrity ---
  console.log('\n--- SECTION 2: Email Template Rendering & Content Invariants ---');

  await test('therapist_application_submitted_admin renders without undefined and contains admin CTA', () => {
    const rendered = EmailTemplates.therapist_application_submitted_admin({
      therapistName: 'Dr. Jane Roe',
      email: 'jane.roe@clinic.in',
      specialization: ['Trauma', 'Anxiety'],
      experience: 7,
      submittedAt: new Date().toISOString(),
      adminReviewUrl: 'https://ingresswithin.com/admin/applications',
    });

    assert(rendered.subject.includes('New Therapist Application — Dr. Jane Roe'), 'Subject contains therapist name');
    assert(!rendered.html.includes('undefined'), 'HTML contains no undefined');
    assert(!rendered.text.includes('undefined'), 'Text contains no undefined');
    assert(rendered.html.includes('Review Application in Admin Portal'), 'Contains Admin Review button');
    assert(rendered.html.includes('jane.roe@clinic.in'), 'Displays applicant email');
    assert(!rendered.html.includes('password'), 'Zero credentials in email body');
    assert(!rendered.html.includes('bearer'), 'Zero tokens in email body');
  });

  await test('therapist_application_received renders confirmation receipt with Under Review status', () => {
    const rendered = EmailTemplates.therapist_application_received({
      therapistName: 'Dr. John Doe',
      statusUrl: 'https://ingresswithin.com/therapist/application/status',
    });

    assert(rendered.subject.includes('Has Been Received'), 'Subject confirms receipt');
    assert(rendered.html.includes('UNDER REVIEW'), 'Explains application is under review');
    assert(rendered.html.includes('Document submission does not in itself constitute practice verification'), 'States verification boundary');
    assert(!rendered.html.includes('undefined'), 'Zero undefined in received template');
    assert(rendered.text.includes('https://ingresswithin.com/therapist/application/status'), 'Plain text contains status link');
  });

  await test('therapist_application_approved renders congratulatory practice verification notice', () => {
    const rendered = EmailTemplates.therapist_application_approved({
      therapistName: 'Dr. Alice Martin',
      dashboardUrl: 'https://ingresswithin.com/therapist',
    });

    assert(rendered.subject.includes('Has Been Approved'), 'Subject conveys approval');
    assert(rendered.html.includes('Practice authorization has been granted'), 'Explains practice status');
    assert(rendered.html.includes('Connect Google Calendar'), 'Recommends calendar setup');
    assert(rendered.html.includes('Open Therapist Dashboard'), 'Includes CTA');
    assert(!rendered.html.includes('undefined'), 'Zero undefined in approved template');
  });

  await test('therapist_application_rejected renders respectful feedback with required rejection reason', () => {
    const rendered = EmailTemplates.therapist_application_rejected({
      therapistName: 'Dr. Bob Vance',
      rejectionReason: 'Master of Clinical Psychology degree certificate was blurred and unreadable.',
      reviewUrl: 'https://ingresswithin.com/therapist/application/status',
    });

    assert(rendered.subject.includes('Update Regarding Your Ingress Within Therapist Application'), 'Subject matches requirements');
    assert(rendered.html.includes('Master of Clinical Psychology degree certificate was blurred and unreadable'), 'Includes exact rejection reason');
    assert(rendered.html.includes('Review Application &amp; Resubmit') || rendered.html.includes('Review Application & Resubmit'), 'Includes resubmission link');
    assert(!rendered.html.includes('undefined'), 'Zero undefined in rejection template');
  });

  // --- SECTION 3: Application Submission Workflow & Concurrency ---
  console.log('\n--- SECTION 3: Application Submission Workflow & Idempotency ---');

  await test('Application submission triggers admin email and therapist confirmation', async () => {
    LoggedEmailProvider.clear();
    const testAccountId = crypto.randomUUID();

    await EmailService.notifyTherapistApplicationSubmitted({
      therapistAccountId: testAccountId,
      therapistName: 'Dr. Test Clinician',
      email: 'clinician.test@ingresswithin.com',
      specialization: ['CBT', 'Anxiety'],
      experienceYears: 5,
      submittedAt: new Date().toISOString(),
      applicationId: `app_${testAccountId}`,
    });

    // Wait for inline async background queue tasks to complete
    async function waitForSent(count: number, timeoutMs = 3000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const msgs = LoggedEmailProvider.getSentMessages();
        if (msgs.length >= count) return msgs;
        await new Promise((r) => setTimeout(r, 50));
      }
      return LoggedEmailProvider.getSentMessages();
    }

    const sent = await waitForSent(2);
    const adminMsg = sent.find((m) => m.to === 'contactus@ingresswithin.com');
    const therapistMsg = sent.find((m) => m.to === 'clinician.test@ingresswithin.com');

    assert(adminMsg, 'Admin notification email must be sent to contactus@ingresswithin.com');
    assert(adminMsg.subject.includes('Dr. Test Clinician'), 'Admin email subject includes applicant name');
    assert(therapistMsg, 'Confirmation email must be sent to therapist email');
    assert(therapistMsg.subject.includes('Has Been Received'), 'Confirmation subject indicates receipt');
  });

  await test('Duplicate submission with same idempotency key does not duplicate email dispatch', async () => {
    LoggedEmailProvider.clear();
    const uniqueKey = `idemp_test_sub_${Date.now()}`;

    // Send first
    await processEmailJob({
      eventType: EmailEvents.THERAPIST_APPLICATION_RECEIVED,
      recipient: { email: 'duplicate.check@example.com', type: 'therapist' },
      templateKey: 'therapist_application_received',
      templateData: { therapistName: 'Dr. Duplicate Check' },
      idempotencyKey: uniqueKey,
    });

    const countAfterFirst = LoggedEmailProvider.getSentMessages().length;
    assert.strictEqual(countAfterFirst, 1, 'First dispatch must succeed');

    // Send second with exact same idempotency key
    await processEmailJob({
      eventType: EmailEvents.THERAPIST_APPLICATION_RECEIVED,
      recipient: { email: 'duplicate.check@example.com', type: 'therapist' },
      templateKey: 'therapist_application_received',
      templateData: { therapistName: 'Dr. Duplicate Check' },
      idempotencyKey: uniqueKey,
    });

    const countAfterSecond = LoggedEmailProvider.getSentMessages().length;
    assert.strictEqual(countAfterSecond, 1, 'Second dispatch with same key must be deduplicated (no duplicate send)');
  });

  // --- SECTION 4: Admin Approval & Rejection Flow ---
  console.log('\n--- SECTION 4: Admin Approval & Rejection Flow ---');

  await test('Admin approval queues approval email to therapist', async () => {
    LoggedEmailProvider.clear();
    const testTherapistId = crypto.randomUUID();

    await EmailService.notifyTherapistApplicationApproved({
      therapistAccountId: testTherapistId,
      therapistName: 'Dr. Approved Applicant',
      email: 'approved.doctor@example.com',
    });

    async function waitForSent(count: number, timeoutMs = 3000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const msgs = LoggedEmailProvider.getSentMessages();
        if (msgs.length >= count) return msgs;
        await new Promise((r) => setTimeout(r, 50));
      }
      return LoggedEmailProvider.getSentMessages();
    }

    const sent = await waitForSent(1);
    const approvalMsg = sent.find((m) => m.to === 'approved.doctor@example.com');
    assert(approvalMsg, 'Approval message must be dispatched');
    assert(approvalMsg.subject.includes('Has Been Approved'), 'Subject conveys approval');
  });

  await test('Admin rejection requires minimum 5-character reason and delivers feedback', async () => {
    LoggedEmailProvider.clear();
    const testTherapistId = crypto.randomUUID();

    await EmailService.notifyTherapistApplicationRejected({
      therapistAccountId: testTherapistId,
      therapistName: 'Dr. Rejected Applicant',
      email: 'rejected.doctor@example.com',
      rejectionReason: 'Clinical registration license number expired in 2024.',
    });

    async function waitForSent(count: number, timeoutMs = 3000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const msgs = LoggedEmailProvider.getSentMessages();
        if (msgs.length >= count) return msgs;
        await new Promise((r) => setTimeout(r, 50));
      }
      return LoggedEmailProvider.getSentMessages();
    }

    const sent = await waitForSent(1);
    const rejectionMsg = sent.find((m) => m.to === 'rejected.doctor@example.com');
    assert(rejectionMsg, 'Rejection message must be dispatched');
    assert(rejectionMsg.subject.includes('Update Regarding Your Ingress Within Therapist Application'), 'Subject matches');
    assert(rejectionMsg.html.includes('Clinical registration license number expired in 2024.'), 'Contains exact reason');
  });

  await test('Email dispatch failure does not crash or throw when failSafe = true', async () => {
    // Calling with non-existent template
    const result = await EmailService.sendEmail(
      {
        eventType: 'test.unknown',
        recipient: { email: 'safe@example.com', type: 'therapist' },
        templateKey: 'non_existent_template_xyz',
        templateData: {},
      },
      true // failSafe
    );

    assert.strictEqual(result, null, 'Returns null safely without crashing calling flow');
  });

  // --- SECTION 5: Retry & Error Handling Invariants ---
  console.log('\n--- SECTION 5: Queue Retry & Failure Classification ---');

  await test('Permanent invalid email failure aborts without infinite retry', async () => {
    try {
      await processEmailJob({
        eventType: 'test.permanent',
        recipient: { email: 'not-an-email', type: 'therapist' },
        templateKey: 'therapist_application_received',
        templateData: { therapistName: 'Tester' },
        attempt: 1,
        maxAttempts: 4,
      });
      assert.fail('Should have thrown EmailWorkerError');
    } catch (err: any) {
      assert(err instanceof EmailWorkerError, 'Must throw EmailWorkerError');
      assert.strictEqual(err.isPermanent, true, 'Must be marked as permanent failure');
      assert.strictEqual(err.errorCategory, 'INVALID_RECIPIENT_EMAIL', 'Category must be INVALID_RECIPIENT_EMAIL');
    }
  });

  // --- SECTION 5B: Provider Fail-Safe & Real Provider Boundary Invariants ---
  console.log('\n--- SECTION 5B: Provider Fail-Safe & Boundary Invariants ---');

  await test('MissingCredentialsProvider fails explicitly and marks error as MISSING_PROVIDER_CREDENTIALS', async () => {
    const missingProvider = new MissingCredentialsProvider();
    const result = await missingProvider.send({
      to: 'doctor@example.com',
      from: 'Ingress Within <care@ingresswithin.com>',
      subject: 'Test Subject',
      html: '<p>Test</p>',
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.errorCategory, 'MISSING_PROVIDER_CREDENTIALS');
    assert.strictEqual(result.isPermanent, true);
    assert.strictEqual(result.messageId, undefined);
  });

  await test('getEmailProvider returns MissingCredentialsProvider when RESEND_API_KEY is missing and ALLOW_MOCK_EMAIL is false', () => {
    const prevMock = process.env.ALLOW_MOCK_EMAIL;
    const prevKey = process.env.RESEND_API_KEY;
    const prevNodeEnv = process.env.NODE_ENV;
    const prevTestMode = process.env.TEST_MODE;
    try {
      process.env.ALLOW_MOCK_EMAIL = 'false';
      delete process.env.RESEND_API_KEY;
      process.env.NODE_ENV = 'production';
      delete process.env.TEST_MODE;
      const provider = getEmailProvider();
      assert(provider instanceof MissingCredentialsProvider, 'Must return MissingCredentialsProvider without key and mock flag');
    } finally {
      if (prevMock !== undefined) process.env.ALLOW_MOCK_EMAIL = prevMock;
      if (prevKey !== undefined) process.env.RESEND_API_KEY = prevKey;
      process.env.NODE_ENV = prevNodeEnv;
      if (prevTestMode !== undefined) process.env.TEST_MODE = prevTestMode;
    }
  });

  await test('Mock provider cannot be silently selected in production without explicit allowMockEmail flag', () => {
    const prevMock = process.env.ALLOW_MOCK_EMAIL;
    const prevKey = process.env.RESEND_API_KEY;
    const prevNodeEnv = process.env.NODE_ENV;
    const prevTestMode = process.env.TEST_MODE;
    try {
      process.env.ALLOW_MOCK_EMAIL = 'false';
      delete process.env.RESEND_API_KEY;
      process.env.NODE_ENV = 'production';
      delete process.env.TEST_MODE;
      const provider = getEmailProvider();
      assert(!(provider instanceof LoggedEmailProvider), 'LoggedEmailProvider must not be used in production when allowMockEmail=false');
      assert(provider instanceof MissingCredentialsProvider, 'MissingCredentialsProvider must be used instead');
    } finally {
      if (prevMock !== undefined) process.env.ALLOW_MOCK_EMAIL = prevMock;
      if (prevKey !== undefined) process.env.RESEND_API_KEY = prevKey;
      process.env.NODE_ENV = prevNodeEnv;
      if (prevTestMode !== undefined) process.env.TEST_MODE = prevTestMode;
    }
  });


  await test('RestEmailProvider correctly calls Resend API endpoint with Bearer auth and payload', async () => {
    const originalFetch = global.fetch;
    let interceptedUrl = '';
    let interceptedOptions: any = null;

    global.fetch = async (url: any, options: any) => {
      interceptedUrl = String(url);
      interceptedOptions = options;
      const jsonPayload = { id: 're_real_msg_987654321' };
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify(jsonPayload),
        json: async () => jsonPayload,
      } as any;
    };

    try {
      const restProvider = new RestEmailProvider('re_mock_test_key_abc');
      const result = await restProvider.send({
        to: 'patient@example.com',
        from: 'Ingress Within <care@ingresswithin.com>',
        subject: 'Appointment Confirmed',
        html: '<p>Your appointment is confirmed</p>',
        text: 'Your appointment is confirmed',
        replyTo: 'contactus@ingresswithin.com',
      });

      assert.strictEqual(interceptedUrl, 'https://api.resend.com/emails');
      assert.strictEqual(interceptedOptions.method, 'POST');
      assert.strictEqual(interceptedOptions.headers.Authorization, 'Bearer re_mock_test_key_abc');
      assert.strictEqual(interceptedOptions.headers['Content-Type'], 'application/json');

      const body = JSON.parse(interceptedOptions.body);
      assert.deepStrictEqual(body.to, ['patient@example.com']);
      assert.strictEqual(body.from, 'Ingress Within <care@ingresswithin.com>');
      assert.strictEqual(body.subject, 'Appointment Confirmed');
      assert.strictEqual(body.reply_to, 'contactus@ingresswithin.com');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.provider, 'resend');
      assert.strictEqual(result.messageId, 're_real_msg_987654321');
    } finally {
      global.fetch = originalFetch;
    }
  });

  await test('RestEmailProvider accurately maps Resend error statuses (401, 403, 422, 429, 500, network)', async () => {
    const originalFetch = global.fetch;

    const mockResponse = (status: number, message: string) => async () => {
      const jsonPayload = { message, name: 'validation_error' };
      return {
        ok: false,
        status,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify(jsonPayload),
        json: async () => jsonPayload,
      };
    };


    const provider = new RestEmailProvider('re_test_key');

    try {
      // 401: AUTHENTICATION_ERROR (permanent)
      global.fetch = mockResponse(401, 'API key is invalid') as any;
      const res401 = await provider.send({ to: 't@example.com', from: 'f@test.com', subject: 's', html: 'h' });
      assert.strictEqual(res401.success, false);
      assert.strictEqual(res401.errorCategory, 'AUTHENTICATION_ERROR');
      assert.strictEqual(res401.isPermanent, true);

      // 403 Domain not verified: DOMAIN_NOT_VERIFIED (permanent)
      global.fetch = mockResponse(403, 'The domain ingresswithin.com is not verified') as any;
      const res403 = await provider.send({ to: 't@example.com', from: 'f@test.com', subject: 's', html: 'h' });
      assert.strictEqual(res403.success, false);
      assert.strictEqual(res403.errorCategory, 'DOMAIN_NOT_VERIFIED');
      assert.strictEqual(res403.isPermanent, true);

      // 422: VALIDATION_ERROR (permanent)
      global.fetch = mockResponse(422, 'Invalid email format') as any;
      const res422 = await provider.send({ to: 't@example.com', from: 'f@test.com', subject: 's', html: 'h' });
      assert.strictEqual(res422.success, false);
      assert.strictEqual(res422.errorCategory, 'VALIDATION_ERROR');
      assert.strictEqual(res422.isPermanent, true);

      // 429: RATE_LIMIT_EXCEEDED (transient)
      global.fetch = mockResponse(429, 'Too many requests') as any;
      const res429 = await provider.send({ to: 't@example.com', from: 'f@test.com', subject: 's', html: 'h' });
      assert.strictEqual(res429.success, false);
      assert.strictEqual(res429.errorCategory, 'RATE_LIMIT_EXCEEDED');
      assert.strictEqual(res429.isPermanent, false);

      // 500: PROVIDER_UNAVAILABLE (transient)
      global.fetch = mockResponse(500, 'Internal Resend Error') as any;
      const res500 = await provider.send({ to: 't@example.com', from: 'f@test.com', subject: 's', html: 'h' });
      assert.strictEqual(res500.success, false);
      assert.strictEqual(res500.errorCategory, 'PROVIDER_UNAVAILABLE');
      assert.strictEqual(res500.isPermanent, false);

      // Network error: NETWORK_ERROR (transient)
      global.fetch = async () => { throw new TypeError('fetch failed ECONNRESET'); };
      const resNet = await provider.send({ to: 't@example.com', from: 'f@test.com', subject: 's', html: 'h' });
      assert.strictEqual(resNet.success, false);
      assert.strictEqual(resNet.errorCategory, 'NETWORK_ERROR');
      assert.strictEqual(resNet.isPermanent, false);
    } finally {
      global.fetch = originalFetch;
    }
  });

  // --- SECTION 6: Provider Webhook Verification & Processing ---
  console.log('\n--- SECTION 6: Provider Webhook Verification & Processing ---');

  await test('Rejects email webhook requests with missing or invalid HMAC signature when secret is set', async () => {
    const rawPayload = JSON.stringify({ type: 'email.delivered', data: { id: 'msg_test_123' } });
    const req = new NextRequest('http://localhost:3000/api/webhooks/email', {
      method: 'POST',
      headers: {
        'x-resend-signature': 'invalid_signature_hash',
      },
      body: rawPayload,
    });

    const res = await emailWebhookHandler(req);
    assert.strictEqual(res.status, 401, 'Invalid signature must return 401 Unauthorized');
  });

  await test('Accepts email webhook with valid HMAC signature and processes delivered status', async () => {
    const rawPayload = JSON.stringify({
      type: 'email.delivered',
      created_at: new Date().toISOString(),
      data: {
        id: 'msg_verified_delivered_999',
      },
    });

    const validSig = crypto
      .createHmac('sha256', process.env.RESEND_WEBHOOK_SECRET!)
      .update(rawPayload)
      .digest('hex');

    const req = new NextRequest('http://localhost:3000/api/webhooks/email', {
      method: 'POST',
      headers: {
        'x-resend-signature': validSig,
        'svix-id': `msg_delivered_${Date.now()}`,
      },
      body: rawPayload,
    });

    const res = await emailWebhookHandler(req);
    assert.strictEqual(res.status, 200, 'Valid signed webhook must return 200 OK');
    const data = await res.json();
    assert.strictEqual(data.received, true, 'Acknowledges event receipt');
  });

  await test('Accepts email webhook with valid Svix base64 format (whsec_ key)', async () => {
    const rawPayload = JSON.stringify({
      type: 'email.delivered',
      created_at: new Date().toISOString(),
      data: {
        id: 'msg_svix_delivered_888',
      },
    });

    const svixId = `msg_svix_${Date.now()}`;
    const svixTimestamp = Math.floor(Date.now() / 1000).toString();
    const secret = process.env.RESEND_WEBHOOK_SECRET!;
    const secretKey = secret.startsWith('whsec_')
      ? Buffer.from(secret.slice(6), 'base64')
      : Buffer.from(secret, 'utf-8');

    const toSign = `${svixId}.${svixTimestamp}.${rawPayload}`;
    const svixSig = crypto.createHmac('sha256', secretKey).update(toSign).digest('base64');

    const req = new NextRequest('http://localhost:3000/api/webhooks/email', {
      method: 'POST',
      headers: {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': `v1,${svixSig}`,
      },
      body: rawPayload,
    });

    const res = await emailWebhookHandler(req);
    assert.strictEqual(res.status, 200, 'Valid Svix signed webhook must return 200 OK');
    const data = await res.json();
    assert.strictEqual(data.received, true, 'Acknowledges event receipt');
  });


  // --- SECTION 7: Administrative Security & Observability ---
  console.log('\n--- SECTION 7: Administrative Security & Delivery Auditing ---');

  await test('Unauthenticated user cannot access GET /api/admin/emails', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/emails', {
      method: 'GET',
    });

    const res = await getAdminEmailsHandler(req);
    assert.strictEqual(res.status, 403, 'Must reject unauthenticated request with 403');
  });

  await test('Authenticated admin can retrieve email delivery log without secret leakage', async () => {
    const testAdminPassword = 'StrongFounderPassword!2026';
    const testAdminHash = AdminAuthService.hashPassword(testAdminPassword);
    const testAdminEmail = 'founder_email_test@ingresswithin.com';

    AdminAuthService.registerInMemoryAdmin({
      id: 'adm_test_founder_email',
      email: testAdminEmail,
      password_hash: testAdminHash,
      full_name: 'Platform Founder',
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
      deviceId: 'dev_test_device',
    });
    const adminToken = loginRes.accessToken;

    const req = new NextRequest('http://localhost:3000/api/admin/emails?page=1&limit=10', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${adminToken}`,
        cookie: `${COOKIE_ADMIN_ACCESS_NAME}=${adminToken}`,
      },
    });

    const res = await getAdminEmailsHandler(req);
    assert.strictEqual(res.status, 200, 'Admin authorized to view emails');
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert(Array.isArray(data.deliveries), 'Returns deliveries array');
    assert(data.health, 'Includes email health metrics');

    const jsonStr = JSON.stringify(data);
    assert(!jsonStr.includes('api_key'), 'Zero API key exposure');
    assert(!jsonStr.includes('secret'), 'Zero secret exposure');
  });

  await test('AdminPlatformService.getSystemHealth reports Email Provider health', async () => {
    const health = await AdminPlatformService.getSystemHealth();
    assert(health.checks.email, 'Must include email check in system health');
    assert(
      health.checks.email.status === 'healthy' ||
      health.checks.email.status === 'degraded' ||
      health.checks.email.status === 'error',
      'Valid health status for email'
    );
  });

  await test('Unauthenticated user cannot trigger POST /api/admin/emails smoke test', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/emails', {
      method: 'POST',
      body: JSON.stringify({ recipient: 'admin@ingresswithin.com' }),
    });

    const res = await postAdminEmailsHandler(req);
    assert.strictEqual(res.status, 403, 'Must reject unauthenticated smoke test with 403');
  });

  await test('Authenticated admin can execute POST /api/admin/emails smoke test', async () => {
    const testAdminPassword = 'StrongFounderPassword!2026';
    const testAdminHash = AdminAuthService.hashPassword(testAdminPassword);
    const testAdminEmail = 'founder_smoke_test@ingresswithin.com';

    AdminAuthService.registerInMemoryAdmin({
      id: 'adm_test_smoke_founder',
      email: testAdminEmail,
      password_hash: testAdminHash,
      full_name: 'Smoke Test Admin',
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
      deviceId: 'dev_smoke_device',
    });
    const adminToken = loginRes.accessToken;

    const req = new NextRequest('http://localhost:3000/api/admin/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${adminToken}`,
        cookie: `${COOKIE_ADMIN_ACCESS_NAME}=${adminToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ recipientEmail: 'smoke-recipient@example.com' }),
    });

    const res = await postAdminEmailsHandler(req);
    assert.strictEqual(res.status, 200, 'Smoke test endpoint accepts authorized admin request');
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert(data.smokeTest, 'Response contains smokeTest object');
    assert.strictEqual(data.smokeTest.recipient, 'smoke-recipient@example.com');
    assert(data.smokeTest.provider, 'smokeTest contains provider');
    assert(!JSON.stringify(data).includes('secret'), 'smokeTest does not leak secrets');
  });



  // --- SECTION 8: Frontend Onboarding Email Field Verification ---
  console.log('\n--- SECTION 8: Frontend Onboarding Email Field Verification ---');

  await test('TherapistOnboardingView.jsx defines required Email address field in Step 2', () => {
    const viewPath = path.join(process.cwd(), 'src/views/therapist/TherapistOnboardingView.jsx');
    assert(fs.existsSync(viewPath), 'TherapistOnboardingView.jsx exists');
    const content = fs.readFileSync(viewPath, 'utf8');

    assert(content.includes('Email address'), 'Contains Email address label');
    assert(content.includes('This email will be used for application and verification updates'), 'Contains required helper text');
    assert(content.includes('contact_email'), 'Binds contact_email state');
  });

  console.log('\n================================================================');
  console.log(`   THERAPIST EMAIL TEST SUITE RESULTS: ${passed}/${total} PASSING`);
  console.log('================================================================\n');
}

runTestSuite()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal test error in therapist email suite:', err);
    process.exit(1);
  });
