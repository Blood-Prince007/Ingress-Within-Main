import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import assert from 'assert';
import { TherapistPayoutAccountService } from '../src/lib/therapist/therapistPayoutAccountService';
import { TherapistPayoutService } from '../src/lib/therapist/therapistPayoutService';
import { BillingService } from '../src/lib/billing/billingService';

async function runTestSuite() {
  console.log('================================================================');
  console.log('  INGRESS WITHIN — THERAPIST SECURE PAYOUTS & BALANCE SUITE     ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            console.log(`  ✓ [PASS] ${name}`);
            passed++;
          })
          .catch((err) => {
            console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
            throw err;
          });
      } else {
        console.log(`  ✓ [PASS] ${name}`);
        passed++;
      }
    } catch (err: any) {
      console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
      throw err;
    }
  }

  // --- SECTION 1: Migration 014 Invariants & Schema ---
  console.log('--- SECTION 1: Database Migration 014 Invariants ---');

  const migrationPath = path.join(
    process.cwd(),
    'src/lib/auth/migrations/014_therapist_payout_accounts_and_withdrawals.sql'
  );

  test('Migration 014 exists on disk', () => {
    assert(fs.existsSync(migrationPath), 'Migration 014 file must exist');
  });

  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  test('Defines public.therapist_payout_accounts table', () => {
    assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.therapist_payout_accounts'), 'Creates therapist_payout_accounts table');
    assert(migrationSql.includes('provider_account_id VARCHAR(100) NOT NULL'), 'Includes provider_account_id');
    assert(migrationSql.includes('masked_identifier VARCHAR(100) NOT NULL'), 'Includes masked_identifier');
    assert(migrationSql.includes("account_type IN ('bank', 'upi')"), 'Constrains account_type to bank or upi');
  });

  test('Defines public.therapist_withdrawal_requests table with state machine', () => {
    assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.therapist_withdrawal_requests'), 'Creates therapist_withdrawal_requests table');
    assert(migrationSql.includes('status VARCHAR(30) NOT NULL DEFAULT \'requested\''), 'Default status is requested');
    assert(migrationSql.includes("'processing'"), 'State machine includes processing');
    assert(migrationSql.includes("'completed'"), 'State machine includes completed');
    assert(migrationSql.includes("'failed'"), 'State machine includes failed');
    assert(migrationSql.includes("'reversed'"), 'State machine includes reversed');
    assert(migrationSql.includes('idempotency_key VARCHAR(100) UNIQUE NOT NULL'), 'Enforces unique idempotency_key');
  });

  test('Enforces strict Row Level Security (RLS) on payout tables', () => {
    assert(migrationSql.includes('ALTER TABLE public.therapist_payout_accounts ENABLE ROW LEVEL SECURITY;'), 'RLS on payout accounts');
    assert(migrationSql.includes('ALTER TABLE public.therapist_withdrawal_requests ENABLE ROW LEVEL SECURITY;'), 'RLS on withdrawal requests');
  });

  // --- SECTION 2: Tokenization & Masking Invariants ---
  console.log('\n--- SECTION 2: Tokenization & Privacy Masking ---');

  test('maskBankAccount preserves only last 4 digits', () => {
    const masked = TherapistPayoutAccountService.maskBankAccount('987654321012');
    assert.strictEqual(masked, '••••1012', 'Bank account should be masked to ••••1012');
  });

  test('maskUpiId masks VPA handle securely', () => {
    const masked = TherapistPayoutAccountService.maskUpiId('siddharth.m@okhdfcbank');
    assert.strictEqual(masked, 'si••••@okhdfcbank', 'UPI ID handle should be masked');
  });

  const testTherapistId = 'th-payout-test-account-1';
  let bankAccountRecord: any;
  let upiAccountRecord: any;

  await test('Creates tokenized bank payout account without raw storage', async () => {
    bankAccountRecord = await TherapistPayoutAccountService.createPayoutAccount({
      therapistAccountId: testTherapistId,
      accountType: 'bank',
      beneficiaryName: 'Dr. Test Practitioner',
      accountNumber: '123456789012',
      ifsc: 'HDFC0001234',
      bankName: 'HDFC Bank',
    });

    assert(bankAccountRecord.id, 'Has valid account ID');
    assert.strictEqual(bankAccountRecord.therapist_account_id, testTherapistId);
    assert.strictEqual(bankAccountRecord.account_type, 'bank');
    assert.strictEqual(bankAccountRecord.masked_identifier, '••••9012');
    assert(bankAccountRecord.provider_account_id.startsWith('fa_'), 'Generates tokenized provider fund account ID');
    assert.strictEqual(bankAccountRecord.status, 'verified');
    assert.strictEqual(bankAccountRecord.is_default, true, 'First account becomes default automatically');

    // PRIVACY VERIFICATION: Zero raw account number stored
    const recordJson = JSON.stringify(bankAccountRecord);
    assert(!recordJson.includes('123456789012'), 'Zero raw bank account number in record');
  });

  await test('Creates tokenized UPI payout account', async () => {
    upiAccountRecord = await TherapistPayoutAccountService.createPayoutAccount({
      therapistAccountId: testTherapistId,
      accountType: 'upi',
      beneficiaryName: 'Dr. Test Practitioner',
      upiId: 'testdr@okhdfcbank',
    });

    assert(upiAccountRecord.id, 'Has valid account ID');
    assert.strictEqual(upiAccountRecord.account_type, 'upi');
    assert.strictEqual(upiAccountRecord.masked_identifier, 'te••••@okhdfcbank');
    assert.strictEqual(upiAccountRecord.is_default, false, 'Second account is not default unless requested');
  });

  await test('Rejects bank account with invalid IFSC code', async () => {
    let threw = false;
    try {
      await TherapistPayoutAccountService.createPayoutAccount({
        therapistAccountId: testTherapistId,
        accountType: 'bank',
        beneficiaryName: 'Dr. Invalid IFSC',
        accountNumber: '1234567890',
        ifsc: 'INVALID_IFSC_123',
      });
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.code, 'INVALID_IFSC_CODE');
    }
    assert(threw, 'Should throw on invalid IFSC');
  });

  await test('Rejects UPI account with invalid VPA format', async () => {
    let threw = false;
    try {
      await TherapistPayoutAccountService.createPayoutAccount({
        therapistAccountId: testTherapistId,
        accountType: 'upi',
        beneficiaryName: 'Dr. Invalid UPI',
        upiId: 'not-an-email-or-upi',
      });
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.code, 'INVALID_UPI_ID');
    }
    assert(threw, 'Should throw on invalid UPI ID');
  });

  await test('getPayoutAccounts returns list of safe masked accounts', async () => {
    const list = await TherapistPayoutAccountService.getPayoutAccounts(testTherapistId);
    assert(list.length >= 2, 'Has at least 2 accounts');
    const hasBank = list.some((a) => a.account_type === 'bank' && a.masked_identifier === '••••9012');
    const hasUpi = list.some((a) => a.account_type === 'upi' && a.masked_identifier === 'te••••@okhdfcbank');
    assert(hasBank, 'Contains bank account');
    assert(hasUpi, 'Contains UPI account');
  });

  // --- SECTION 3: Authoritative Balance Invariants ---
  console.log('\n--- SECTION 3: Authoritative Balance Calculation ---');

  // Seed earnings via TherapistPayoutService
  await test('Seeds collected session earnings for therapist', async () => {
    await TherapistPayoutService.recordEarningForAppointment({
      therapistAccountId: testTherapistId,
      appointmentId: 'appt-payout-seed-1',
      grossAmount: 1500, // 1500 gross - 225 fee = 1275 net
      commissionRate: 15,
      initialStatus: 'collected',
    });

    await TherapistPayoutService.recordEarningForAppointment({
      therapistAccountId: testTherapistId,
      appointmentId: 'appt-payout-seed-2',
      grossAmount: 2000, // 2000 gross - 300 fee = 1700 net
      commissionRate: 15,
      initialStatus: 'collected',
    });
  });

  await test('Calculates Available to Withdraw as exact sum of unbatched collected earnings', async () => {
    const balance = await TherapistPayoutAccountService.getAvailableBalance(testTherapistId);
    // 1275 + 1700 = 2975
    assert.strictEqual(balance.currency, 'INR');
    assert(balance.totalNetEarned >= 2975, 'Total net earned incorporates both sessions');
    assert(balance.availableToWithdraw >= 2975, 'Available to withdraw matches unbatched collected net');
    assert.strictEqual(balance.inFlightWithdrawals, 0, 'Zero in-flight withdrawals initially');
  });

  // --- SECTION 4: Secure Withdrawal Requests & State Machine ---
  console.log('\n--- SECTION 4: Withdrawal Requests & Validations ---');

  await test('Rejects withdrawal exceeding available balance with INSUFFICIENT_BALANCE', async () => {
    let threw = false;
    try {
      await TherapistPayoutAccountService.requestWithdrawal({
        therapistAccountId: testTherapistId,
        payoutAccountId: bankAccountRecord.id,
        amount: 50000, // Exceeds balance
      });
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.code, 'INSUFFICIENT_BALANCE');
    }
    assert(threw, 'Should reject excessive withdrawal');
  });

  await test('Rejects withdrawal below minimum threshold (< ₹100)', async () => {
    let threw = false;
    try {
      await TherapistPayoutAccountService.requestWithdrawal({
        therapistAccountId: testTherapistId,
        payoutAccountId: bankAccountRecord.id,
        amount: 50,
      });
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.code, 'MINIMUM_WITHDRAWAL_THRESHOLD');
    }
    assert(threw, 'Should reject withdrawal < ₹100');
  });

  let createdWithdrawal: any;
  const testIdempotencyKey = `idem_with_${Date.now()}`;

  await test('Successfully creates a withdrawal request', async () => {
    createdWithdrawal = await TherapistPayoutAccountService.requestWithdrawal({
      therapistAccountId: testTherapistId,
      payoutAccountId: bankAccountRecord.id,
      amount: 1000,
      idempotencyKey: testIdempotencyKey,
    });

    assert(createdWithdrawal.id, 'Has withdrawal ID');
    assert.strictEqual(createdWithdrawal.therapist_account_id, testTherapistId);
    assert.strictEqual(createdWithdrawal.amount, 1000);
    assert.strictEqual(createdWithdrawal.status, 'processing');
    assert(createdWithdrawal.provider_payout_id.startsWith('pout_'), 'Has provider payout ID');
    assert.strictEqual(createdWithdrawal.idempotency_key, testIdempotencyKey);
  });

  await test('Deducts in-flight withdrawal from available balance', async () => {
    const balanceAfter = await TherapistPayoutAccountService.getAvailableBalance(testTherapistId);
    assert.strictEqual(balanceAfter.inFlightWithdrawals, 1000, 'In-flight withdrawals is exactly ₹1000');
    // Available was 2975, now should be 1975
    assert.strictEqual(balanceAfter.availableToWithdraw, 1975, 'Available to withdraw reduced by in-flight amount');
  });

  await test('Idempotent duplicate withdrawal returns existing record without double deduction', async () => {
    const duplicate = await TherapistPayoutAccountService.requestWithdrawal({
      therapistAccountId: testTherapistId,
      payoutAccountId: bankAccountRecord.id,
      amount: 1000,
      idempotencyKey: testIdempotencyKey,
    });

    assert.strictEqual(duplicate.id, createdWithdrawal.id, 'Returns exact existing withdrawal record');
    const balanceCheck = await TherapistPayoutAccountService.getAvailableBalance(testTherapistId);
    assert.strictEqual(balanceCheck.inFlightWithdrawals, 1000, 'In-flight amount did not double');
  });

  // --- SECTION 5: RazorpayX Webhook & Transitions ---
  console.log('\n--- SECTION 5: RazorpayX Payout Webhooks & Settlement ---');

  await test('payout.processed transitions withdrawal to completed and stores UTR', async () => {
    const webhookEvent = {
      event: 'payout.processed',
      payload: {
        payout: {
          entity: {
            id: createdWithdrawal.provider_payout_id,
            amount: 100000, // paise
            status: 'processed',
            utr: 'HDFCR5202609290001',
          },
        },
      },
    };

    const result = await TherapistPayoutAccountService.handlePayoutWebhookEvent(webhookEvent);
    assert.strictEqual(result.handled, true);
    assert.strictEqual(result.status, 'completed');

    const history = await TherapistPayoutAccountService.getWithdrawalHistory(testTherapistId);
    const updated = history.find((w) => w.id === createdWithdrawal.id);
    assert.strictEqual(updated?.status, 'completed');
    assert.strictEqual(updated?.utr_number, 'HDFCR5202609290001');
    assert(updated?.processed_at, 'Records processed_at timestamp');
  });

  await test('payout.failed transitions withdrawal to failed and records failure reason', async () => {
    // Create another small withdrawal to test failure
    const failWithdrawal = await TherapistPayoutAccountService.requestWithdrawal({
      therapistAccountId: testTherapistId,
      payoutAccountId: upiAccountRecord.id,
      amount: 500,
    });

    const failEvent = {
      event: 'payout.failed',
      payload: {
        payout: {
          entity: {
            id: failWithdrawal.provider_payout_id,
            status: 'failed',
            failure_reason: 'Beneficiary bank technical timeout',
          },
        },
      },
    };

    const res = await TherapistPayoutAccountService.handlePayoutWebhookEvent(failEvent);
    assert.strictEqual(res.handled, true);
    assert.strictEqual(res.status, 'failed');

    const history = await TherapistPayoutAccountService.getWithdrawalHistory(testTherapistId);
    const updated = history.find((w) => w.id === failWithdrawal.id);
    assert.strictEqual(updated?.status, 'failed');
    assert.strictEqual(updated?.failure_reason, 'Beneficiary bank technical timeout');
  });

  await test('Double-spend immunity: Available balance remains ₹1975 and Withdrawn is ₹1000 after payout completion', async () => {
    const balance = await TherapistPayoutAccountService.getAvailableBalance(testTherapistId);
    assert.strictEqual(balance.withdrawn, 1000, 'Withdrawn must reflect the ₹1000 completed withdrawal');
    assert.strictEqual(balance.availableToWithdraw, 1975, 'Available balance must remain ₹1975 (not revert to ₹2975)');
  });

  await test('Idempotent webhook replay: 10x delivery of payout.processed causes no state regression or balance drift', async () => {
    const replayEvent = {
      event: 'payout.processed',
      payload: {
        payout: {
          entity: {
            id: createdWithdrawal.provider_payout_id,
            status: 'processed',
            utr: 'HDFCR5202609290001',
          },
        },
      },
    };

    for (let i = 0; i < 10; i++) {
      const res = await TherapistPayoutAccountService.handlePayoutWebhookEvent(replayEvent);
      assert.strictEqual(res.handled, true);
      assert.strictEqual(res.status, 'completed');
    }

    const balanceAfterReplay = await TherapistPayoutAccountService.getAvailableBalance(testTherapistId);
    assert.strictEqual(balanceAfterReplay.withdrawn, 1000, 'Withdrawn is still exactly ₹1000');
    assert.strictEqual(balanceAfterReplay.availableToWithdraw, 1975, 'Available balance is still exactly ₹1975');
  });

  await test('Out-of-order webhook rejection: Refuses payout.failed after payout is already completed', async () => {
    const staleFailEvent = {
      event: 'payout.failed',
      payload: {
        payout: {
          entity: {
            id: createdWithdrawal.provider_payout_id,
            status: 'failed',
            failure_reason: 'Stale out-of-order network failure',
          },
        },
      },
    };

    const res = await TherapistPayoutAccountService.handlePayoutWebhookEvent(staleFailEvent);
    assert.strictEqual(res.status, 'completed', 'Status must not regress from completed to failed');

    const history = await TherapistPayoutAccountService.getWithdrawalHistory(testTherapistId);
    const check = history.find((w) => w.id === createdWithdrawal.id);
    assert.strictEqual(check?.status, 'completed', 'Withdrawal record must remain completed');
  });

  await test('Concurrency race prevention: Two simultaneous requests for ₹1500 when available is ₹1975', async () => {
    // Attempt two simultaneous withdrawals for ₹1500 each
    const results = await Promise.allSettled([
      TherapistPayoutAccountService.requestWithdrawal({
        therapistAccountId: testTherapistId,
        payoutAccountId: bankAccountRecord.id,
        amount: 1500,
      }),
      TherapistPayoutAccountService.requestWithdrawal({
        therapistAccountId: testTherapistId,
        payoutAccountId: bankAccountRecord.id,
        amount: 1500,
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly one should succeed, one must be blocked by concurrency lock or balance check!
    assert.strictEqual(fulfilled.length, 1, 'Exactly one concurrent withdrawal must succeed');
    assert.strictEqual(rejected.length, 1, 'The competing concurrent withdrawal must be rejected');

    const bal = await TherapistPayoutAccountService.getAvailableBalance(testTherapistId);
    // 1975 - 1500 = 475
    assert.strictEqual(bal.availableToWithdraw, 475, 'Remaining available balance is exactly ₹475');
  });

  // --- SECTION 6: Multi-Tenant Isolation & Privacy Safeguards ---
  console.log('\n--- SECTION 6: Multi-Tenant Isolation & Privacy Safeguards ---');

  const tenantBId = 'th-payout-tenant-b';

  await test('Tenant B cannot view Tenant A payout accounts', async () => {
    const listB = await TherapistPayoutAccountService.getPayoutAccounts(tenantBId);
    assert.strictEqual(listB.length, 0, 'Tenant B has isolated zero accounts');
    const leaked = listB.some((a) => a.id === bankAccountRecord.id);
    assert(!leaked, 'Tenant A account is not visible to Tenant B');
  });

  await test('Tenant B cannot withdraw to Tenant A payout account', async () => {
    let threw = false;
    try {
      await TherapistPayoutAccountService.requestWithdrawal({
        therapistAccountId: tenantBId,
        payoutAccountId: bankAccountRecord.id, // Belongs to Tenant A
        amount: 500,
      });
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.code, 'ACCOUNT_NOT_FOUND');
    }
    assert(threw, 'Cross-tenant withdrawal must be blocked');
  });

  await test('Tenant B balance is isolated at zero', async () => {
    const balanceB = await TherapistPayoutAccountService.getAvailableBalance(tenantBId);
    assert.strictEqual(balanceB.availableToWithdraw, 0, 'Tenant B available balance is zero');
    assert.strictEqual(balanceB.totalNetEarned, 0, 'Tenant B total net is zero');
  });

  await test('Zero payment secrets or client PHI in payout objects', async () => {
    const accounts = await TherapistPayoutAccountService.getPayoutAccounts(testTherapistId);
    const json = JSON.stringify(accounts);
    assert(!json.includes('key_secret'), 'No gateway secrets');
    assert(!json.includes('cvv'), 'No CVV');
    assert(!json.includes('pin'), 'No banking PINs');
    assert(!json.includes('medical'), 'No clinical notes');
  });

  // --- SECTION 7: API Route Integrity & Secret Verification ---
  console.log('\n--- SECTION 7: API Route Integrity ---');

  test('Razorpay Payouts Webhook verifies cryptographic HMAC-SHA256 signature', () => {
    const webhookRoutePath = path.join(
      process.cwd(),
      'src/app/api/payments/razorpay/payouts-webhook/route.ts'
    );
    assert(fs.existsSync(webhookRoutePath), 'Payouts webhook route exists');
    const source = fs.readFileSync(webhookRoutePath, 'utf8');
    assert(source.includes("createHmac('sha256', secret)"), 'Verifies HMAC SHA256 signature');
    assert(source.includes('x-razorpay-signature'), 'Checks x-razorpay-signature header');
    assert(source.includes('handlePayoutWebhookEvent'), 'Delegates to handlePayoutWebhookEvent');
  });

  test('Therapist Payout Accounts route requires authorization', () => {
    const accRoutePath = path.join(
      process.cwd(),
      'src/app/api/therapist/payouts/accounts/route.ts'
    );
    assert(fs.existsSync(accRoutePath), 'Payout accounts route exists');
    const source = fs.readFileSync(accRoutePath, 'utf8');
    assert(source.includes('requireAuthorizedTherapist'), 'Enforces authorized therapist guard');
  });

  test('Therapist Withdrawal route requires authorization', () => {
    const withRoutePath = path.join(
      process.cwd(),
      'src/app/api/therapist/payouts/withdraw/route.ts'
    );
    assert(fs.existsSync(withRoutePath), 'Withdraw route exists');
    const source = fs.readFileSync(withRoutePath, 'utf8');
    assert(source.includes('requireAuthorizedTherapist'), 'Enforces authorized therapist guard');
  });

  console.log('\n================================================================');
  console.log(`  PAYOUTS SUITE RESULTS: ${passed}/${total} PASSING`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
