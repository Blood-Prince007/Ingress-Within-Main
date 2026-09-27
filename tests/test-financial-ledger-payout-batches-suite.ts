import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { TherapistPayoutService } from '../src/lib/therapist/therapistPayoutService';
import { TherapistPlatformService } from '../src/lib/therapist/therapistPlatformService';
import { SessionBookingService } from '../src/lib/therapy/sessionBookingService';
import { BillingService } from '../src/lib/billing/billingService';
import { POST as adminCreatePayout, GET as adminListPayouts } from '../src/app/api/admin/payouts/route';
import { GET as adminGetPayout, PATCH as adminPatchPayout } from '../src/app/api/admin/payouts/[id]/route';

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

async function runFinancialSuite() {
  console.log('================================================================');
  console.log('  INGRESS WITHIN — FINANCIAL LEDGER & PAYOUT BATCHES SUITE      ');
  console.log('================================================================\n');

  // ===========================================================================
  // SECTION 1: Migration 010 Schema & Invariants Audit
  // ===========================================================================
  console.log('--- SECTION 1: Migration 010 Schema & Database Invariants ---');

  const migration010Path = path.join(
    process.cwd(),
    'src/lib/auth/migrations/010_financial_ledger_and_payout_batches.sql'
  );
  assert(fs.existsSync(migration010Path), 'Migration 010 file exists on disk');

  const migration010 = fs.readFileSync(migration010Path, 'utf8');
  assert(
    migration010.includes('CREATE UNIQUE INDEX IF NOT EXISTS idx_th_earnings_appointment_unique') ||
    migration010.includes('idx_th_earnings_appointment_unique'),
    'Defines unique index on therapist_earnings(appointment_id)'
  );
  assert(
    migration010.includes('chk_therapist_earnings_status') &&
    migration010.includes("'pending', 'collected', 'paid', 'cancelled', 'reversed'"),
    'Enforces strict check constraint on therapist_earnings payment_status'
  );
  assert(
    migration010.includes('CREATE TABLE IF NOT EXISTS public.therapist_payout_batches'),
    'Defines public.therapist_payout_batches table'
  );
  assert(
    migration010.includes('CREATE TABLE IF NOT EXISTS public.therapist_payout_batch_items'),
    'Defines public.therapist_payout_batch_items table'
  );
  assert(
    migration010.includes('uq_payout_batch_items_earning UNIQUE (earning_id)') ||
    migration010.includes('idx_th_payout_batch_items_earning_uq'),
    'Enforces earning_id UNIQUE on payout batch items'
  );
  assert(
    migration010.includes('ALTER TABLE public.therapist_payout_batches ENABLE ROW LEVEL SECURITY'),
    'Enables RLS on therapist_payout_batches'
  );
  assert(
    migration010.includes('ALTER TABLE public.therapist_payout_batch_items ENABLE ROW LEVEL SECURITY'),
    'Enables RLS on therapist_payout_batch_items'
  );

  // ===========================================================================
  // SECTION 2: Single Earning Per Appointment Invariant
  // ===========================================================================
  console.log('\n--- SECTION 2: Single Earning Per Appointment Invariant ---');

  const therapistAId = crypto.randomUUID();
  const appointment1Id = crypto.randomUUID();

  // First earning record
  const earning1 = await TherapistPayoutService.recordEarningForAppointment({
    therapistAccountId: therapistAId,
    appointmentId: appointment1Id,
    grossAmount: 2000,
    commissionRate: 15,
  });

  assert(earning1.appointment_id === appointment1Id, 'Earning is bound to appointment ID');
  assert(earning1.gross_amount === 2000, 'Gross amount is 2000');
  assert(earning1.platform_fee === 300, 'Platform fee calculated at 15% (300)');
  assert(earning1.net_earnings === 1700, 'Net earnings calculated at 1700');
  assert(earning1.payment_status === 'collected', 'Initial financial status is collected');

  // Attempt to create duplicate earning for same appointment
  const earningDuplicate = await TherapistPayoutService.recordEarningForAppointment({
    therapistAccountId: therapistAId,
    appointmentId: appointment1Id,
    grossAmount: 9999, // tampered amount
  });

  assert(earningDuplicate.id === earning1.id, 'Duplicate recording returns the existing earning ID');
  assert(earningDuplicate.net_earnings === 1700, 'Net earnings preserved from original authoritative record');

  // Distinct appointment creates distinct earning
  const appointment2Id = crypto.randomUUID();
  const earning2 = await TherapistPayoutService.recordEarningForAppointment({
    therapistAccountId: therapistAId,
    appointmentId: appointment2Id,
    grossAmount: 1500,
    commissionRate: 15,
  });
  assert(earning2.id !== earning1.id, 'Distinct appointment creates distinct earning record');
  assert(earning2.net_earnings === 1275, 'Earning 2 net is 1275');

  // ===========================================================================
  // SECTION 3: Financial State Machine Invariants
  // ===========================================================================
  console.log('\n--- SECTION 3: Financial State Machine Invariants ---');

  // Valid Transitions
  assert(
    TherapistPayoutService.validateFinancialTransition('pending', 'collected') === true,
    'Valid: pending -> collected'
  );
  assert(
    TherapistPayoutService.validateFinancialTransition('pending', 'cancelled') === true,
    'Valid: pending -> cancelled'
  );
  assert(
    TherapistPayoutService.validateFinancialTransition('collected', 'paid') === true,
    'Valid: collected -> paid'
  );
  assert(
    TherapistPayoutService.validateFinancialTransition('collected', 'cancelled') === true,
    'Valid: collected -> cancelled'
  );
  assert(
    TherapistPayoutService.validateFinancialTransition('paid', 'reversed') === true,
    'Valid: paid -> reversed'
  );
  assert(
    TherapistPayoutService.validateFinancialTransition('collected', 'collected') === true,
    'Idempotent: collected -> collected'
  );

  // Invalid Transitions
  try {
    TherapistPayoutService.validateFinancialTransition('paid', 'collected');
    assert(false, 'Should throw for paid -> collected');
  } catch (err: any) {
    assert(err.code === 'INVALID_FINANCIAL_TRANSITION', 'Strictly rejects paid -> collected');
  }

  try {
    TherapistPayoutService.validateFinancialTransition('cancelled', 'collected');
    assert(false, 'Should throw for cancelled -> collected');
  } catch (err: any) {
    assert(err.code === 'INVALID_FINANCIAL_TRANSITION', 'Strictly rejects cancelled -> collected');
  }

  try {
    TherapistPayoutService.validateFinancialTransition('reversed', 'collected');
    assert(false, 'Should throw for reversed -> collected');
  } catch (err: any) {
    assert(err.code === 'INVALID_FINANCIAL_TRANSITION', 'Strictly rejects reversed -> collected');
  }

  try {
    TherapistPayoutService.validateFinancialTransition('cancelled', 'paid');
    assert(false, 'Should throw for cancelled -> paid');
  } catch (err: any) {
    assert(err.code === 'INVALID_FINANCIAL_TRANSITION', 'Strictly rejects cancelled -> paid');
  }

  // ===========================================================================
  // SECTION 4: Razorpay Webhook Idempotency & Authoritative Amount
  // ===========================================================================
  console.log('\n--- SECTION 4: Razorpay Webhook Idempotency & Authoritative Pricing ---');

  // Verify SessionBookingService authoritative pricing
  const pricing = await SessionBookingService.getAuthoritativePricing(therapistAId);
  assert(pricing.currency === 'INR', 'Authoritative currency is INR');
  assert(pricing.totalPaise > 0, 'Total paise is positive');

  // Verify SessionBookingService confirmSessionPayment contains idempotency guard
  const bookingServiceSource = fs.readFileSync(
    path.join(process.cwd(), 'src/lib/therapy/sessionBookingService.ts'),
    'utf8'
  );
  assert(
    bookingServiceSource.includes('TherapistPayoutService.recordEarningForAppointment'),
    'SessionBookingService delegates earning creation to TherapistPayoutService'
  );
  assert(
    bookingServiceSource.includes('alreadyProcessed: true'),
    'SessionBookingService contains idempotency guard for repeated payment confirmations'
  );

  // Webhook route HMAC and idempotency verification
  const webhookSource = fs.readFileSync(
    path.join(process.cwd(), 'src/app/api/payments/razorpay/webhook/route.ts'),
    'utf8'
  );
  assert(webhookSource.includes('createHmac(\'sha256\', secret)'), 'Razorpay webhook verifies HMAC SHA256 signature');
  assert(webhookSource.includes('webhook_events'), 'Razorpay webhook logs event idempotency via webhook_events');

  // ===========================================================================
  // SECTION 5: Payout Batch Creation & Sum Invariant
  // ===========================================================================
  console.log('\n--- SECTION 5: Payout Batch Creation & Sum Invariant ---');

  const periodStart = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
  const periodEnd = new Date(Date.now() + 24 * 3600000).toISOString();

  // Create batch for Therapist A (has earning1: 1700, earning2: 1275 => total: 2975)
  const { batch: batch1, items: batch1Items } = await TherapistPayoutService.createPayoutBatch({
    therapistAccountId: therapistAId,
    periodStart,
    periodEnd,
  });

  assert(batch1.status === 'pending', 'New payout batch status is pending');
  assert(batch1.currency === 'INR', 'Payout batch currency is INR');
  assert(batch1.total_net === 2975, 'Batch total_net strictly matches sum (1700 + 1275 = 2975)');
  assert(batch1Items.length === 2, 'Batch contains 2 items');

  const sumItems = batch1Items.reduce((acc, curr) => acc + curr.net_amount, 0);
  assert(sumItems === batch1.total_net, 'Sum of item net amounts strictly equals batch total_net');

  // Check that earnings now have payout_batch_id set
  const reloadedEarning1 = await TherapistPayoutService.getEarningByAppointmentId(appointment1Id);
  assert(reloadedEarning1?.payout_batch_id === batch1.id, 'Earning 1 linked to batch1');

  // ===========================================================================
  // SECTION 6: Duplicate Payout Batch Attempt
  // ===========================================================================
  console.log('\n--- SECTION 6: Duplicate Payout Batch Prevention ---');

  try {
    // Attempting to batch again should fail because all collected earnings are already batched
    await TherapistPayoutService.createPayoutBatch({
      therapistAccountId: therapistAId,
      periodStart,
      periodEnd,
    });
    assert(false, 'Should throw NO_ELIGIBLE_EARNINGS');
  } catch (err: any) {
    assert(
      err.code === 'NO_ELIGIBLE_EARNINGS',
      'Excludes already-batched earnings and throws NO_ELIGIBLE_EARNINGS'
    );
  }

  // ===========================================================================
  // SECTION 7: Payout Batch State Transitions
  // ===========================================================================
  console.log('\n--- SECTION 7: Payout Batch State Transitions ---');

  // 1. Start Batch: pending -> processing
  const processingBatch = await TherapistPayoutService.startPayoutBatch(batch1.id);
  assert(processingBatch.status === 'processing', 'Payout batch transitioned to processing');

  // 2. Mark Paid: processing -> paid
  const paidBatch = await TherapistPayoutService.markPayoutPaid(batch1.id, {
    bankReference: 'HDFC_NEFT_987654321',
    paidAt: new Date().toISOString(),
  });

  assert(paidBatch.status === 'paid', 'Payout batch transitioned to paid');
  assert(paidBatch.bank_reference === 'HDFC_NEFT_987654321', 'Bank reference recorded');
  assert(paidBatch.paid_at !== null, 'Paid at timestamp recorded');

  // Verify earnings transitioned to paid
  const paidEarning1 = await TherapistPayoutService.getEarningByAppointmentId(appointment1Id);
  assert(paidEarning1?.payment_status === 'paid', 'Linked earning 1 transitioned to paid');
  assert(paidEarning1?.payout_date !== null, 'Earning 1 records payout_date');

  // Idempotent mark paid
  const paidBatchAgain = await TherapistPayoutService.markPayoutPaid(batch1.id);
  assert(paidBatchAgain.status === 'paid', 'markPayoutPaid is idempotent for already paid batches');

  // Test Failed Batch Transition & Release of Earnings
  const therapistBId = crypto.randomUUID();
  const apptBId = crypto.randomUUID();
  await TherapistPayoutService.recordEarningForAppointment({
    therapistAccountId: therapistBId,
    appointmentId: apptBId,
    grossAmount: 1500,
  });

  const { batch: batchFail } = await TherapistPayoutService.createPayoutBatch({
    therapistAccountId: therapistBId,
    periodStart,
    periodEnd,
  });

  await TherapistPayoutService.startPayoutBatch(batchFail.id);
  const failedBatch = await TherapistPayoutService.markPayoutFailed(batchFail.id, {
    reason: 'Invalid IFSC Code',
  });
  assert(failedBatch.status === 'failed', 'Payout batch transitioned to failed');
  assert(failedBatch.failure_reason === 'Invalid IFSC Code', 'Failure reason recorded');

  // Earning released back to unbatched
  const releasedEarning = await TherapistPayoutService.getEarningByAppointmentId(apptBId);
  assert(releasedEarning?.payout_batch_id === null, 'Earnings released back to unbatched (payout_batch_id: null)');
  assert(releasedEarning?.payment_status === 'collected', 'Earning preserves collected status for re-batching');

  // Test Reversal: paid -> reversed
  const reversedBatch = await TherapistPayoutService.reversePayout(batch1.id, {
    reason: 'Fraudulent bank transfer clawback',
  });
  assert(reversedBatch.status === 'reversed', 'Payout batch transitioned to reversed');
  assert(reversedBatch.reversal_reason === 'Fraudulent bank transfer clawback', 'Reversal reason recorded');

  const reversedEarning1 = await TherapistPayoutService.getEarningByAppointmentId(appointment1Id);
  assert(reversedEarning1?.payment_status === 'reversed', 'Linked earning transitioned to reversed');

  // ===========================================================================
  // SECTION 8: Refund Before Payout
  // ===========================================================================
  console.log('\n--- SECTION 8: Refund Before Payout ---');

  const apptRefundBeforeId = crypto.randomUUID();
  const earningBefore = await TherapistPayoutService.recordEarningForAppointment({
    therapistAccountId: therapistAId,
    appointmentId: apptRefundBeforeId,
    grossAmount: 2500,
    commissionRate: 15,
  });

  assert(earningBefore.payment_status === 'collected', 'Earning starts collected');

  const refundResult1 = await TherapistPayoutService.handleAppointmentRefund(apptRefundBeforeId);
  assert(refundResult1.earningStatus === 'cancelled', 'Unpaid earning transitions to cancelled upon refund');

  const cancelledEarning = await TherapistPayoutService.getEarningByAppointmentId(apptRefundBeforeId);
  assert(cancelledEarning?.payment_status === 'cancelled', 'Persisted earning is cancelled');

  // ===========================================================================
  // SECTION 9: Refund After Payout (Preserves Historical Payout Batch)
  // ===========================================================================
  console.log('\n--- SECTION 9: Refund After Payout (Audit History Preservation) ---');

  const therapistCId = crypto.randomUUID();
  const apptPaidRefundId = crypto.randomUUID();

  await TherapistPayoutService.recordEarningForAppointment({
    therapistAccountId: therapistCId,
    appointmentId: apptPaidRefundId,
    grossAmount: 3000,
    commissionRate: 15,
  });

  const { batch: batchC } = await TherapistPayoutService.createPayoutBatch({
    therapistAccountId: therapistCId,
    periodStart,
    periodEnd,
  });

  await TherapistPayoutService.startPayoutBatch(batchC.id);
  await TherapistPayoutService.markPayoutPaid(batchC.id, { bankReference: 'BANK_PAID_001' });

  const historicalNet = batchC.total_net;

  // Refund processed AFTER payout was paid
  const refundResult2 = await TherapistPayoutService.handleAppointmentRefund(apptPaidRefundId);
  assert(refundResult2.earningStatus === 'reversed', 'Paid earning transitions to reversed upon refund');

  // Historical batch total must NOT be mutated
  const reloadedBatchC = await TherapistPayoutService.getPayoutBatchById(batchC.id);
  assert(reloadedBatchC?.total_net === historicalNet, 'Historical payout batch total_net preserved intact');
  assert(reloadedBatchC?.status === 'paid', 'Historical payout batch status preserved as paid');

  // ===========================================================================
  // SECTION 10: No-Show Semantics (Client vs Therapist)
  // ===========================================================================
  console.log('\n--- SECTION 10: No-Show Semantics ---');

  // Client No-Show: therapist remains whole
  const apptClientNoShowId = crypto.randomUUID();
  await TherapistPayoutService.recordEarningForAppointment({
    therapistAccountId: therapistAId,
    appointmentId: apptClientNoShowId,
    grossAmount: 1800,
  });

  const clientNoShowRes = await TherapistPayoutService.handleAppointmentNoShow(
    apptClientNoShowId,
    'client'
  );
  assert(clientNoShowRes.attendanceStatus === 'client_no_show', 'Attendance marked client_no_show');
  assert(clientNoShowRes.financialStatus === 'collected', 'Financial status remains collected (no refund, therapist paid)');

  // Therapist No-Show: full refund, therapist earning voided
  const apptTherapistNoShowId = crypto.randomUUID();
  await TherapistPayoutService.recordEarningForAppointment({
    therapistAccountId: therapistAId,
    appointmentId: apptTherapistNoShowId,
    grossAmount: 1800,
  });

  const therapistNoShowRes = await TherapistPayoutService.handleAppointmentNoShow(
    apptTherapistNoShowId,
    'therapist'
  );
  assert(therapistNoShowRes.attendanceStatus === 'therapist_no_show', 'Attendance marked therapist_no_show');
  assert(therapistNoShowRes.financialStatus === 'cancelled', 'Therapist earning voided (cancelled)');

  // ===========================================================================
  // SECTION 11: Therapist Tenancy & Earnings Summary API
  // ===========================================================================
  console.log('\n--- SECTION 11: Therapist Tenancy & Earnings API ---');

  const summaryA = await TherapistPlatformService.getEarningsSummary(therapistAId);
  assert(summaryA.summary.currency === 'INR', 'Summary currency is INR');
  assert(typeof summaryA.summary.pendingPayout === 'number', 'Calculates pendingPayout');
  assert(typeof summaryA.summary.totalCollected === 'number', 'Calculates totalCollected');
  assert(Array.isArray(summaryA.transactions), 'Returns transactions array');
  assert(Array.isArray(summaryA.payouts), 'Returns payouts array');

  // Ensure Therapist A data does not leak into Therapist B summary
  const summaryB = await TherapistPlatformService.getEarningsSummary(therapistBId);
  const hasAData = summaryB.transactions.some((t: any) => t.appointmentId === appointment1Id);
  assert(!hasAData, 'Therapist B summary strictly isolated from Therapist A transactions');

  // ===========================================================================
  // SECTION 12: Admin Authorization Guards
  // ===========================================================================
  console.log('\n--- SECTION 12: Admin Authorization Guards ---');

  // Unauthorized request to admin payouts route -> 403
  const unauthReq = new NextRequest('http://localhost:3000/api/admin/payouts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      therapist_account_id: therapistAId,
      period_start: periodStart,
      period_end: periodEnd,
    }),
  });
  const unauthRes = await adminCreatePayout(unauthReq);
  assert(unauthRes.status === 403, 'Unauthorized call to POST /api/admin/payouts blocked with 403');

  // Authorized request with x-admin-key
  const adminSecret = process.env.ADMIN_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'iw_admin_dev_secret';
  const authReq = new NextRequest('http://localhost:3000/api/admin/payouts', {
    method: 'GET',
    headers: { 'x-admin-key': adminSecret },
  });
  const authRes = await adminListPayouts(authReq);
  assert(authRes.status === 200, 'Authorized admin request to GET /api/admin/payouts succeeds with 200');

  // ===========================================================================
  // SECTION 13: Concurrent Payout Creation Guard
  // ===========================================================================
  console.log('\n--- SECTION 13: Concurrent Payout Creation Guard ---');

  const therapistConcurrentId = crypto.randomUUID();
  const apptConcId = crypto.randomUUID();
  await TherapistPayoutService.recordEarningForAppointment({
    therapistAccountId: therapistConcurrentId,
    appointmentId: apptConcId,
    grossAmount: 2000,
  });

  // Simulate active lock
  (TherapistPayoutService as any).activeBatchLocks.add(therapistConcurrentId);
  try {
    await TherapistPayoutService.createPayoutBatch({
      therapistAccountId: therapistConcurrentId,
      periodStart,
      periodEnd,
    });
    assert(false, 'Should throw CONCURRENT_BATCH_CREATION');
  } catch (err: any) {
    assert(
      err.code === 'CONCURRENT_BATCH_CREATION',
      'Concurrent batch creation for same therapist safely blocked'
    );
  } finally {
    (TherapistPayoutService as any).activeBatchLocks.delete(therapistConcurrentId);
  }

  // ===========================================================================
  // SUMMARY
  // ===========================================================================
  console.log('\n================================================================');
  console.log(`  FINANCIAL LEDGER & PAYOUT BATCHES SUITE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');
}

runFinancialSuite().catch((err) => {
  console.error('\nSuite failed with unexpected error:', err);
  process.exit(1);
});
