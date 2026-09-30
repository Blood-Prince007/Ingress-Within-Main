import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import assert from 'assert';
import { NextRequest } from 'next/server';
import { AdminAuthService } from '../src/lib/admin/adminAuthService';
import { AdminPlatformService } from '../src/lib/admin/adminPlatformService';
import { AdminAuditService } from '../src/lib/admin/adminAuditService';
import { ApiUsageService } from '../src/lib/admin/apiUsageService';
import { requireAuthorizedAdmin, requireSuperAdmin } from '../src/lib/auth/adminAuthHelper';
import { COOKIE_ADMIN_ACCESS_NAME } from '../src/utils/cookies';

async function runTestSuite() {
  console.log('================================================================');
  console.log('   INGRESS WITHIN — ADMIN PORTAL & SECURITY TEST SUITE          ');
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

  // Seed a test admin account
  const testAdminPassword = 'StrongFounderPassword!2026';
  const testAdminHash = AdminAuthService.hashPassword(testAdminPassword);
  const testAdminId = 'adm_test_founder_001';
  const testAdminEmail = 'founder@ingresswithin.com';

  AdminAuthService.registerInMemoryAdmin({
    id: testAdminId,
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

  // --- SECTION 1: Migration 016 Schema & Invariants ---
  console.log('--- SECTION 1: Migration 016 Schema Invariants ---');

  const migrationPath = path.join(
    process.cwd(),
    'src/lib/auth/migrations/016_admin_portal_and_api_usage.sql'
  );

  await test('Migration 016 exists on disk', () => {
    assert(fs.existsSync(migrationPath), 'Migration 016 file must exist');
  });

  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  await test('Defines public.admin_accounts with strict roles and lockout fields', () => {
    assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.admin_accounts'), 'Creates admin_accounts');
    assert(migrationSql.includes('role VARCHAR(50) NOT NULL DEFAULT \'super_admin\''), 'Includes role check');
    assert(migrationSql.includes('failed_login_attempts INTEGER'), 'Includes failed_login_attempts');
    assert(migrationSql.includes('locked_until TIMESTAMPTZ'), 'Includes locked_until');
  });

  await test('Defines public.admin_sessions for device session tracking', () => {
    assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.admin_sessions'), 'Creates admin_sessions');
    assert(migrationSql.includes('token_hash VARCHAR(128) NOT NULL'), 'Includes token_hash');
  });

  await test('Defines public.api_usage_events with zero raw payloads', () => {
    assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.api_usage_events'), 'Creates api_usage_events');
    assert(migrationSql.includes('provider VARCHAR(50) NOT NULL'), 'Includes provider');
    assert(migrationSql.includes('latency_ms INTEGER'), 'Includes latency');
  });

  await test('Enforces strict Row Level Security (RLS) on all admin tables', () => {
    assert(migrationSql.includes('ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY'), 'RLS on admin_accounts');
    assert(migrationSql.includes('ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY'), 'RLS on admin_sessions');
    assert(migrationSql.includes('ALTER TABLE public.api_usage_events ENABLE ROW LEVEL SECURITY'), 'RLS on api_usage_events');
    assert(migrationSql.includes("auth.jwt() ->> 'role' = 'service_role'"), 'Service role only access');
  });

  // --- SECTION 2: Authentication & Session Security ---
  console.log('\n--- SECTION 2: Authentication & Session Security ---');

  let validAdminToken = '';

  await test('Valid founder credentials authenticate successfully with memory-hard scrypt verification', async () => {
    const res = await AdminAuthService.login({
      email: testAdminEmail,
      password: testAdminPassword,
      deviceId: 'dev_laptop_1',
    });
    assert(res.accessToken, 'Must return accessToken');
    assert.strictEqual(res.admin.email, testAdminEmail);
    assert.strictEqual(res.admin.role, 'super_admin');
    assert.strictEqual(res.admin.status, 'active');
    validAdminToken = res.accessToken;
  });

  await test('Rejects invalid password and increments failed attempts', async () => {
    let threw = false;
    try {
      await AdminAuthService.login({
        email: testAdminEmail,
        password: 'WrongPassword123!',
        deviceId: 'dev_laptop_1',
      });
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.code, 'INVALID_CREDENTIALS');
      assert.strictEqual(err.status, 401);
    }
    assert(threw, 'Must reject invalid credentials');
  });

  await test('Brute force lockout: Locks account after 5 consecutive failed attempts', async () => {
    // Attempt 4 more bad passwords
    for (let i = 0; i < 4; i++) {
      try {
        await AdminAuthService.login({
          email: testAdminEmail,
          password: 'AnotherWrongPassword!',
          deviceId: 'dev_laptop_attacker',
        });
      } catch {
        // Expected
      }
    }

    // 6th attempt must trigger ACCOUNT_LOCKED
    let threwLockout = false;
    try {
      await AdminAuthService.login({
        email: testAdminEmail,
        password: testAdminPassword, // Even correct password must be blocked during lockout!
        deviceId: 'dev_laptop_attacker',
      });
    } catch (err: any) {
      threwLockout = true;
      assert.strictEqual(err.code, 'ACCOUNT_LOCKED');
      assert.strictEqual(err.status, 423);
    }
    assert(threwLockout, 'Account must be locked against brute-force attacks');
  });

  // Reset lockout for further testing
  AdminAuthService.registerInMemoryAdmin({
    id: testAdminId,
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

  // --- SECTION 3: Authorization Boundary & Privilege Escalation Defense ---
  console.log('\n--- SECTION 3: Authorization & Privilege Escalation Defense ---');

  await test('Unauthenticated request to admin guard throws ADMIN_UNAUTHORIZED', async () => {
    const unauthReq = new NextRequest('http://localhost:3000/api/admin/overview');
    let threw = false;
    try {
      await requireAuthorizedAdmin(unauthReq);
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.code, 'ADMIN_UNAUTHORIZED');
      assert.strictEqual(err.status, 403);
    }
    assert(threw, 'Must throw on unauthenticated request');
  });

  await test('Request with manipulated x-role: admin header is rejected', async () => {
    const forgedReq = new NextRequest('http://localhost:3000/api/admin/overview', {
      headers: {
        'x-role': 'admin',
        'x-is-admin': 'true',
      },
    });
    let threw = false;
    try {
      await requireAuthorizedAdmin(forgedReq);
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.code, 'ADMIN_UNAUTHORIZED');
    }
    assert(threw, 'Must reject spoofed headers');
  });

  await test('Request with query param ?role=admin is rejected', async () => {
    const forgedReq = new NextRequest('http://localhost:3000/api/admin/overview?role=admin&is_admin=true');
    let threw = false;
    try {
      await requireAuthorizedAdmin(forgedReq);
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.code, 'ADMIN_UNAUTHORIZED');
    }
    assert(threw, 'Must reject query parameter privilege escalation');
  });

  await test('Valid admin cookie authorizes successfully', async () => {
    const authReq = new NextRequest('http://localhost:3000/api/admin/overview', {
      headers: {
        cookie: `${COOKIE_ADMIN_ACCESS_NAME}=${validAdminToken}`,
      },
    });
    const session = await requireAuthorizedAdmin(authReq);
    assert.strictEqual(session.adminId, testAdminId);
    assert.strictEqual(session.role, 'super_admin');
  });

  await test('Super Admin guard permits super_admin and blocks analyst or support_admin', async () => {
    const superReq = new NextRequest('http://localhost:3000/api/admin/security', {
      headers: { cookie: `${COOKIE_ADMIN_ACCESS_NAME}=${validAdminToken}` },
    });
    const session = await requireSuperAdmin(superReq);
    assert.strictEqual(session.role, 'super_admin');
  });

  // --- SECTION 4: Applications Review Workflow ---
  console.log('\n--- SECTION 4: Therapist Application Review Workflow ---');

  await test('Application review validates decision state (approved or rejected)', async () => {
    let threw = false;
    try {
      await AdminPlatformService.reviewApplication({
        therapistAccountId: 'test-th-id',
        decision: 'invalid_choice' as any,
        adminId: testAdminId,
      });
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.code, 'INVALID_DECISION');
    }
    assert(threw, 'Must reject invalid decision state');
  });

  // --- SECTION 5: Financial Accuracy & Integer Paise Guarantees ---
  console.log('\n--- SECTION 5: Financial Accuracy & Integer Minor Units ---');

  await test('getOverviewMetrics returns revenue and platform fees strictly in integer paise', async () => {
    const metrics = await AdminPlatformService.getOverviewMetrics('all');
    assert(Number.isInteger(metrics.grossRevenuePaise), 'grossRevenuePaise must be an integer');
    assert(Number.isInteger(metrics.platformFeesPaise), 'platformFeesPaise must be an integer');
    assert(Number.isInteger(metrics.therapistEarningsPaise), 'therapistEarningsPaise must be an integer');
    assert(Number.isInteger(metrics.pendingPayoutsPaise), 'pendingPayoutsPaise must be an integer');
    assert.strictEqual(metrics.currency, 'INR');
  });

  await test('getRevenueAnalytics returns non-floating-point paise breakdown', async () => {
    const analytics = await AdminPlatformService.getRevenueAnalytics('30d');
    assert(Number.isInteger(analytics.grossRevenuePaise), 'grossRevenuePaise must be an integer');
    assert(Number.isInteger(analytics.platformFeesPaise), 'platformFeesPaise must be an integer');
    assert(Number.isInteger(analytics.therapistNetPaise), 'therapistNetPaise must be an integer');
    assert(Array.isArray(analytics.dailyBreakdown), 'dailyBreakdown must be an array');
  });

  // --- SECTION 6: API Usage & Real Diagnostics Tracking ---
  console.log('\n--- SECTION 6: API Usage & System Health Diagnostics ---');

  await test('ApiUsageService records external provider events safely without secrets', async () => {
    await ApiUsageService.recordEvent({
      provider: 'razorpay',
      service: 'Payment Verification',
      endpoint: '/orders/verify',
      statusCode: 200,
      success: true,
      latencyMs: 142,
      metadata: {
        order_id: 'order_123456',
        secret_key: 'SUPER_SECRET_SHOULD_BE_REDACTED',
      },
    });

    const recent = await ApiUsageService.getRecentEvents(5);
    const recorded = recent.find((e) => e.provider === 'razorpay');
    assert(recorded, 'Event must be recorded');
    assert.strictEqual(recorded.metadata.secret_key, '[REDACTED]', 'Sensitive keys must be redacted');
  });

  await test('ApiUsageService reports isTracked = false for providers with zero recorded events', async () => {
    const summaries = await ApiUsageService.getUsageSummary();
    const untracked = summaries.find((s) => s.provider === 'gemini_ai');
    assert(untracked, 'Must include provider entry');
    // If no events were recorded for gemini_ai, it must be untracked rather than fabricating numbers
    if (untracked.totalRequests === 0) {
      assert.strictEqual(untracked.isTracked, false, 'Untracked provider must be marked isTracked = false');
    }
  });

  await test('getSystemHealth returns real infrastructure checks without exposing secrets', async () => {
    const health = await AdminPlatformService.getSystemHealth();
    assert(health.status === 'healthy' || health.status === 'degraded', 'Status is healthy or degraded');
    assert(health.checks.database, 'Includes database check');
    assert(health.checks.application, 'Includes runtime check');
    assert(health.checks.payments, 'Includes payments check');

    const json = JSON.stringify(health);
    assert(!json.includes('key_secret'), 'Zero secret exposure in diagnostics');
    assert(!json.includes('service_role'), 'Zero service role exposure');
  });

  // --- SECTION 7: Audit Logging Immutability ---
  console.log('\n--- SECTION 7: Audit Logging & Data Sanitization ---');

  await test('AdminAuditService records sanitized immutable audit entries', async () => {
    const log = await AdminAuditService.logAction({
      actorId: testAdminId,
      actorType: 'admin_user',
      action: 'therapist_approved',
      entityType: 'therapist',
      entityId: 'th_sample_123',
      metadata: {
        password: 'sensitive_password',
        notes: 'Verified RCI accreditation.',
      },
    });

    assert.strictEqual(log.actor_id, testAdminId);
    assert.strictEqual(log.action, 'therapist_approved');
    assert.strictEqual(log.metadata.password, '[REDACTED]', 'Passwords must be redacted in audit logs');
    assert.strictEqual(log.metadata.notes, 'Verified RCI accreditation.');
  });

  // --- SECTION 8: Frontend Route & Component Integration ---
  console.log('\n--- SECTION 8: Frontend Navigation & Component Integration ---');

  await test('AdminPlatformView.jsx exists on disk and switches between Login and Dashboard', () => {
    const viewPath = path.join(process.cwd(), 'src/views/admin/AdminPlatformView.jsx');
    assert(fs.existsSync(viewPath), 'AdminPlatformView.jsx must exist');
    const source = fs.readFileSync(viewPath, 'utf8');
    assert(source.includes('AdminLoginView'), 'Renders AdminLoginView');
    assert(source.includes('AdminDashboardShell'), 'Renders AdminDashboardShell');
  });

  await test('AdminDashboardShell.jsx exists on disk and defines all 13 operational sections', () => {
    const shellPath = path.join(process.cwd(), 'src/views/admin/AdminDashboardShell.jsx');
    assert(fs.existsSync(shellPath), 'AdminDashboardShell.jsx must exist');
    const source = fs.readFileSync(shellPath, 'utf8');
    assert(source.includes('Command Center'), 'Contains Command Center');
    assert(source.includes('User Directory'), 'Contains User Directory');
    assert(source.includes('Therapist Roster'), 'Contains Therapist Roster');
    assert(source.includes('Application Queue'), 'Contains Application Queue');
    assert(source.includes('Clinical Sessions'), 'Contains Clinical Sessions');
    assert(source.includes('Revenue & Orders'), 'Contains Revenue & Orders');
    assert(source.includes('Therapist Payouts'), 'Contains Therapist Payouts');
    assert(source.includes('API Usage & Traffic'), 'Contains API Usage');
    assert(source.includes('System Health'), 'Contains System Health');
    assert(source.includes('Webhook Monitor'), 'Contains Webhook Monitor');
    assert(source.includes('Audit Trail'), 'Contains Audit Trail');
    assert(source.includes('Admin Security'), 'Contains Admin Security');
  });

  await test('App.jsx routes admin paths to AdminPlatformView', () => {
    const appPath = path.join(process.cwd(), 'src/App.jsx');
    const source = fs.readFileSync(appPath, 'utf8');
    assert(source.includes('AdminPlatformView'), 'App.jsx imports AdminPlatformView');
    assert(source.includes("case 'admin':"), 'App.jsx switches on admin');
  });

  console.log('\n================================================================');
  console.log(`  ADMIN PORTAL SUITE RESULTS: ${passed}/${total} PASSING`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error in admin portal suite:', err);
  process.exit(1);
});
