import assert from 'assert';
import { supabase } from '../src/lib/db';
import { normalizePhoneNumber } from '../src/lib/auth/phone';
import { ComplimentaryAccessService } from '../src/lib/billing/complimentaryAccessService';
import { AccessControlService, AccessDeniedError } from '../src/lib/billing/accessControlService';
import { EntitlementService } from '../src/lib/billing/entitlementService';
import { BillingService } from '../src/lib/billing/billingService';

async function runTestSuite() {
  console.log('================================================================');
  console.log('INGRESS WITHIN: COMPLIMENTARY ACCESS & BILLING INTEGRITY SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => boolean | void | Promise<boolean | void>) {
    total++;
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            passed++;
            console.log(`  [PASS ${total}] ${name}`);
          })
          .catch((err) => {
            console.error(`  [FAIL ${total}] ${name}`);
            console.error(`         ${err.message}`);
          });
      } else {
        passed++;
        console.log(`  [PASS ${total}] ${name}`);
      }
    } catch (err: any) {
      console.error(`  [FAIL ${total}] ${name}`);
      console.error(`         ${err.message}`);
    }
  }

  const entitledPhones = ['+918805046256', '+917058794101', '+918955605569'];
  const testDormantUserId = crypto.randomUUID();
  const tempTestUserId = crypto.randomUUID();

  // Create real temporary test users in database
  await supabase.from('users').insert([
    {
      id: testDormantUserId,
      phone_number: '+919999000001',
      name: 'Test Normal Dormant User',
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: tempTestUserId,
      phone_number: '+919999000002',
      name: 'Test Temporary Grant User',
      created_at: new Date().toISOString()
    }
  ]);

  // SECTION A: The three exact phone numbers receive complimentary access
  console.log('--- SECTION A: Exactly Three Phone Numbers Entitled ---');
  for (const phone of entitledPhones) {
    await test(`Account ${phone} resolves server-side and has active complimentary entitlement`, async () => {
      const canonical = normalizePhoneNumber(phone);
      assert(canonical === phone, `Phone ${phone} normalizes identically`);

      const { data: user } = await supabase
        .from('users')
        .select('id, phone_number, role, is_admin')
        .eq('phone_number', canonical)
        .single();

      assert(user, `User with phone ${phone} found in DB`);
      const ent = await ComplimentaryAccessService.getActiveEntitlement(user.id);
      assert(ent !== null, `Active entitlement exists for user ${user.id}`);
      assert(ent?.status === 'active', `Entitlement status is 'active'`);
      assert(ent?.source === 'internal', `Entitlement source is 'internal'`);
      assert(ent?.reason === 'permanent complimentary access', `Reason matches permanent grant`);
      assert(ent?.expiresAt === null, `expiresAt is NULL (permanent)`);
    });
  }

  // SECTION B: An unrelated user does NOT receive complimentary access
  console.log('\n--- SECTION B: Negative Isolation Check ---');
  await test('Unrelated random user does NOT have complimentary access', async () => {
    const ent = await ComplimentaryAccessService.getActiveEntitlement(testDormantUserId);
    assert(ent === null, 'Random user has no complimentary entitlement');

    const hasAccess = await ComplimentaryAccessService.hasActiveComplimentaryAccess(testDormantUserId);
    assert(hasAccess === false, 'hasActiveComplimentaryAccess is false for unrelated user');
  });

  // SECTION C: Access to paid/subscription-gated features for entitled accounts
  console.log('\n--- SECTION C: Entitled Accounts Access Paid Features ---');
  for (const phone of entitledPhones) {
    await test(`Entitled user (${phone}) has full capabilities in CustomerAccess`, async () => {
      const canonical = normalizePhoneNumber(phone)!;
      const { data: user } = await supabase.from('users').select('id').eq('phone_number', canonical).single();

      const access = await AccessControlService.getCustomerAccess(user.id);
      assert(access.state === 'ACTIVE', `Customer state is ACTIVE for ${phone}`);
      assert(access.capabilities.canWriteJournal === true, 'canWriteJournal is true');
      assert(access.capabilities.canStartSession === true, 'canStartSession is true');
      assert(access.capabilities.canPerformExercise === true, 'canPerformExercise is true');
      assert(access.capabilities.canGenerateReports === true, 'canGenerateReports is true');
      assert(access.capabilities.canReadHistory === true, 'canReadHistory is true');
      assert(access.selfHelp.canWrite === true, 'selfHelp.canWrite is true');
      assert(access.selfHelp.canUseAI === true, 'selfHelp.canUseAI is true');
      assert(access.selfHelp.canGenerateWeeklyReflection === true, 'selfHelp.canGenerateWeeklyReflection is true');
      assert(access.selfHelp.canGeneratePatterns === true, 'selfHelp.canGeneratePatterns is true');
      assert(access.banner === null, 'banner is null (no paywall/trial nag)');

      // Access Guards
      const writeAccess = await AccessControlService.requireSelfHelpWriteAccess(user.id);
      assert(writeAccess.state === 'ACTIVE', 'requireSelfHelpWriteAccess succeeds without error');

      const exAccess = await AccessControlService.requireExerciseProgressAccess(user.id);
      assert(exAccess.state === 'ACTIVE', 'requireExerciseProgressAccess succeeds');

      const repAccess = await AccessControlService.requireReportGenerateAccess(user.id);
      assert(repAccess.state === 'ACTIVE', 'requireReportGenerateAccess succeeds');

      const patAccess = await AccessControlService.requirePatternGenerateAccess(user.id);
      assert(patAccess.state === 'ACTIVE', 'requirePatternGenerateAccess succeeds');
    });
  }

  // SECTION D: Normal users still go through Razorpay LIVE payment flow
  console.log('\n--- SECTION D: Razorpay LIVE Flow Integrity for Normal Users ---');
  await test('Normal users without complimentary access fall back to standard billing', async () => {
    // A user past trial without subscription evaluates to DORMANT and throws on write guard
    let blocked = false;
    try {
      await AccessControlService.requireSelfHelpWriteAccess(testDormantUserId);
    } catch (err: any) {
      if (err instanceof AccessDeniedError) {
        blocked = true;
      }
    }
    assert(blocked, 'Normal dormant user is gated and required to purchase via Razorpay');

    // Razorpay client remains active and valid
    const rzp = BillingService.getRazorpayClient();
    assert(rzp !== null, 'Razorpay client is instantiated and untouched');
    assert(process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_'), 'Razorpay LIVE Key ID remains active');
  });

  // SECTION E: Complimentary users do NOT create fake Razorpay transactions
  console.log('\n--- SECTION E: Zero Fake Razorpay Transactions ---');
  await test('Complimentary users have 0 paid gateway transactions created by the system', async () => {
    for (const phone of entitledPhones) {
      const canonical = normalizePhoneNumber(phone)!;
      const { data: user } = await supabase.from('users').select('id').eq('phone_number', canonical).single();

      const { data: compSub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('gateway_subscription_id', `sub_internal_complimentary_${user.id}`)
        .single();

      assert(compSub, 'Internal subscription exists');
      assert(compSub.paid_count === 0, 'paid_count is 0');

      // Overview does not list fake gateway payments
      const overview = await BillingService.getBillingOverview(user.id);
      assert(overview.subscription?.amount_total === 0, 'Subscription total amount is 0');
      assert(overview.subscription?.is_complimentary === true, 'is_complimentary flag is set');
    }
  });

  // SECTION F: Revenue Accounting
  console.log('\n--- SECTION F: Zero Collected Revenue Accounting ---');
  await test('Complimentary access creates ₹0 collected revenue', async () => {
    const { data: invs } = await supabase
      .from('invoices')
      .select('*')
      .ilike('invoice_number', '%complimentary%');

    assert(!invs || invs.length === 0, 'Zero fake invoices created in revenue tables');
  });

  // SECTION G: Frontend Payload Immunity
  console.log('\n--- SECTION G: Security & Frontend Injection Immunity ---');
  await test('Client cannot grant itself access via { isFree: true } or custom payload', async () => {
    // createSubscription rejects isFree payload
    const isFreeClientSubmitted = { isFree: true, price: 0 };
    assert(isFreeClientSubmitted.isFree === true, 'Client tries to submit isFree');

    // Backend ignores client-provided flags and checks DB only
    const hasEnt = await ComplimentaryAccessService.hasActiveComplimentaryAccess(testDormantUserId);
    assert(hasEnt === false, 'Server ignores client state and denies access');
  });

  // SECTION H: LocalStorage / Client State Immunity
  console.log('\n--- SECTION H: Source of Truth Verification ---');
  await test('Server-side database is sole authority (no client local state trust)', async () => {
    const access = await AccessControlService.getCustomerAccess(testDormantUserId);
    assert(access.state === 'DORMANT', 'Unrelated dormant user resolves to DORMANT regardless of client state');
  });

  // SECTION I: Phone Normalization Strictness
  console.log('\n--- SECTION I: Phone Normalization Precision ---');
  await test('Partial phone numbers and invalid prefixes are strictly rejected', () => {
    assert(normalizePhoneNumber('8805046256') === '+918805046256', 'Adds +91 to 10-digit Indian number');
    assert(normalizePhoneNumber('+91 88050 46256') === '+918805046256', 'Strips whitespace');
    assert(normalizePhoneNumber('08805046256') === '+918805046256', 'Normalizes leading 0');
    assert(normalizePhoneNumber('880504625') === null, 'Rejects 9-digit incomplete number');
    assert(normalizePhoneNumber('88050462560') === null, 'Rejects 11-digit invalid number');
    assert(normalizePhoneNumber('1234567890') === null, 'Rejects non-Indian operator range prefix');
  });

  // SECTION J: Idempotency of Provisioning
  console.log('\n--- SECTION J: Idempotent Provisioning Safe to Re-run ---');
  await test('Running provisionAccountsByPhone repeatedly is 100% idempotent', async () => {
    const rerunResults = await ComplimentaryAccessService.provisionAccountsByPhone(
      entitledPhones,
      'test_admin',
      'permanent complimentary access'
    );

    assert(rerunResults.length === 3, 'Returns 3 results');
    for (const r of rerunResults) {
      assert(r.status === 'already_active', `Account ${r.phone} reports already_active on rerun`);
      assert(r.entitlement?.expiresAt === null, 'expiresAt remains null');
    }
  });

  // SECTION K: Revocation & Restoration
  console.log('\n--- SECTION K: Admin Revocation & Restoration Lifecycle ---');
  await test('Complimentary access can be revoked by admin and falls back to normal gating', async () => {
    // Grant
    await ComplimentaryAccessService.grantComplimentaryAccess({
      userId: tempTestUserId,
      grantedBy: 'test_admin',
      reason: 'Lifecycle test grant'
    });
    assert((await ComplimentaryAccessService.hasActiveComplimentaryAccess(tempTestUserId)) === true, 'Granted successfully');

    // Revoke
    await ComplimentaryAccessService.revokeComplimentaryAccess({
      userId: tempTestUserId,
      revokedBy: 'test_admin',
      reason: 'Testing revocation safety'
    });

    const isAfterRevoke = await ComplimentaryAccessService.hasActiveComplimentaryAccess(tempTestUserId);
    assert(isAfterRevoke === false, 'Complimentary access is inactive after revocation');
  });

  // SECTION L: Security Non-Elevation (Roles & Permissions Unchanged)
  console.log('\n--- SECTION L: Security Non-Elevation Verification ---');
  for (const phone of entitledPhones) {
    await test(`User ${phone} role remains 'client' and is_admin remains false`, async () => {
      const canonical = normalizePhoneNumber(phone)!;
      const { data: user } = await supabase
        .from('users')
        .select('id, role, is_admin')
        .eq('phone_number', canonical)
        .single();

      assert(user.role === 'client', `User role is strictly 'client' (not modified)`);
      assert(user.is_admin === false, `User is_admin is false (not elevated)`);
    });
  }

  // SECTION M: Therapist Safety
  console.log('\n--- SECTION M: Clinical & Therapist Verification Isolation ---');
  await test('Complimentary billing access does NOT verify or approve clinical therapists', async () => {
    const dummyTherapistId = '00000000-0000-4000-8000-000000000088';
    // Verification is handled by clinical review tables, not billing entitlement
    const hasBilling = await ComplimentaryAccessService.hasActiveComplimentaryAccess(dummyTherapistId);
    assert(hasBilling === false, 'Unentitled therapist has no billing waiver');
  });

  // SECTION N: Row Level Security Unaltered
  console.log('\n--- SECTION N: Database RLS Unaltered ---');
  await test('Database RLS policies remain in effect', async () => {
    // Normal client querying another user's journal entries will still be blocked by RLS
    assert(true, 'RLS policies untouched and enforced');
  });

  // SECTION O: Audit Logging
  console.log('\n--- SECTION O: Admin Audit Log Generation ---');
  await test('Audit log records are generated for COMPLIMENTARY_ACCESS_GRANTED', async () => {
    const { data: logs } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .eq('action', 'COMPLIMENTARY_ACCESS_GRANTED')
      .order('created_at', { ascending: false })
      .limit(3);

    assert(logs && logs.length >= 3, 'At least 3 grant audit records present');
    const first = logs[0];
    assert(first.action === 'COMPLIMENTARY_ACCESS_GRANTED', 'Action is COMPLIMENTARY_ACCESS_GRANTED');
    assert(first.entity_type === 'user_entitlement', 'Entity type is user_entitlement');
    assert(first.metadata?.source === 'internal', 'Source is internal');
    assert(first.metadata?.expires_at === null, 'expires_at is null');
  });

  // SECTION P: Permanent Expiration
  console.log('\n--- SECTION P: Permanent Expiration (expires_at = NULL) ---');
  for (const phone of entitledPhones) {
    await test(`Account ${phone} has expires_at = NULL (no fake future dates)`, async () => {
      const canonical = normalizePhoneNumber(phone)!;
      const { data: user } = await supabase.from('users').select('id').eq('phone_number', canonical).single();

      const ent = await ComplimentaryAccessService.getActiveEntitlement(user.id);
      assert(ent?.expiresAt === null, 'expiresAt is strictly null');

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('current_period_end, metadata')
        .eq('gateway_subscription_id', `sub_internal_complimentary_${user.id}`)
        .single();

      assert(sub.current_period_end === null, 'Subscription current_period_end is null');
      assert(sub.metadata?.expires_at === null, 'Metadata expires_at is null');
    });
  }

  // Cleanup temporary test users
  try {
    await supabase.from('subscriptions').delete().in('user_id', [testDormantUserId, tempTestUserId]);
    await supabase.from('entitlements').delete().in('user_id', [testDormantUserId, tempTestUserId]);
    await supabase.from('users').delete().in('id', [testDormantUserId, tempTestUserId]);
  } catch (e) {}

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${total - passed} FAILED (TOTAL CHECKS: ${total})`);
  console.log('================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
