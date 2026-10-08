import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { TherapistEarningsService } from '../src/lib/therapist/therapistEarningsService';
import { TherapistPayoutService } from '../src/lib/therapist/therapistPayoutService';
import { GET as getEarningsRoute } from '../src/app/api/therapist/earnings/route';
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

async function runTherapistEarningsSuite() {
  console.log('================================================================');
  console.log('  INGRESS WITHIN — THERAPIST EARNINGS & LEDGER TEST SUITE       ');
  console.log('================================================================\n');

  // ===========================================================================
  // SECTION 1: Database Schema & Migration Invariants
  // ===========================================================================
  console.log('--- SECTION 1: Database Schema & Migration Invariants ---');

  const migration010Path = path.join(
    process.cwd(),
    'src/lib/auth/migrations/010_financial_ledger_and_payout_batches.sql'
  );
  assert(fs.existsSync(migration010Path), 'Migration 010 exists on disk');

  const migration010 = fs.readFileSync(migration010Path, 'utf8');
  assert(
    migration010.includes('CREATE TABLE IF NOT EXISTS public.therapist_earnings'),
    'Defines public.therapist_earnings ledger table'
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
    migration010.includes('chk_therapist_earnings_status') &&
    migration010.includes("'pending', 'collected', 'paid', 'cancelled', 'reversed'"),
    'Enforces explicit financial status check constraint on earnings'
  );
  assert(
    migration010.includes('ALTER TABLE public.therapist_payout_batches ENABLE ROW LEVEL SECURITY'),
    'Enforces RLS on payout batches'
  );

  // ===========================================================================
  // SECTION 2: TherapistEarningsService Date Range Resolution & Validation
  // ===========================================================================
  console.log('\n--- SECTION 2: Date Range Resolution & Input Validation ---');

  // Today
  const todayRange = TherapistEarningsService.resolveDateRange({ range: 'today' });
  assert(todayRange.rangeKey === 'today', 'Resolves rangeKey "today"');
  assert(new Date(todayRange.fromIso).getTime() <= new Date(todayRange.toIso).getTime(), 'Today from <= to');

  // Week
  const weekRange = TherapistEarningsService.resolveDateRange({ range: 'week' });
  assert(weekRange.rangeKey === 'week', 'Resolves rangeKey "week"');
  assert(new Date(weekRange.fromIso).getTime() <= new Date(weekRange.toIso).getTime(), 'Week from <= to');

  // Month
  const monthRange = TherapistEarningsService.resolveDateRange({ range: 'month' });
  assert(monthRange.rangeKey === 'month', 'Resolves rangeKey "month"');
  assert(new Date(monthRange.fromIso).getTime() <= new Date(monthRange.toIso).getTime(), 'Month from <= to');

  // Last Month
  const lastMonthRange = TherapistEarningsService.resolveDateRange({ range: 'last_month' });
  assert(lastMonthRange.rangeKey === 'last_month', 'Resolves rangeKey "last_month"');
  assert(new Date(lastMonthRange.fromIso).getTime() < new Date(monthRange.fromIso).getTime(), 'Last month is prior to current month');

  // Custom valid range
  const customRange = TherapistEarningsService.resolveDateRange({
    range: 'custom',
    from: '2026-09-01',
    to: '2026-09-15',
  });
  assert(customRange.rangeKey === 'custom', 'Resolves custom date range');
  assert(customRange.fromIso.startsWith('2026-09-01'), 'Custom fromIso starts with 2026-09-01');
  assert(customRange.toIso.startsWith('2026-09-15'), 'Custom toIso starts with 2026-09-15');

  // Impossible custom range (from > to)
  let caughtImpossibleRange = false;
  try {
    TherapistEarningsService.resolveDateRange({
      range: 'custom',
      from: '2026-09-20',
      to: '2026-09-10',
    });
  } catch (err: any) {
    caughtImpossibleRange = err.code === 'INVALID_DATE_RANGE';
  }
  assert(caughtImpossibleRange, 'Rejects custom range where from > to with INVALID_DATE_RANGE');

  // Malformed custom date
  let caughtMalformedDate = false;
  try {
    TherapistEarningsService.resolveDateRange({
      range: 'custom',
      from: 'invalid-date',
      to: '2026-09-10',
    });
  } catch (err: any) {
    caughtMalformedDate = err.code === 'INVALID_DATE_FORMAT';
  }
  assert(caughtMalformedDate, 'Rejects malformed date string with INVALID_DATE_FORMAT');

  // Missing custom dates
  let caughtMissingCustomDates = false;
  try {
    TherapistEarningsService.resolveDateRange({
      range: 'custom',
    });
  } catch (err: any) {
    caughtMissingCustomDates = err.code === 'INVALID_DATE_RANGE';
  }
  assert(caughtMissingCustomDates, 'Rejects custom range when from/to are omitted');

  // Missing therapist account ID
  let caughtMissingTherapistId = false;
  try {
    await TherapistEarningsService.getEarningsReport('');
  } catch (err: any) {
    caughtMissingTherapistId = err.code === 'INVALID_INPUT';
  }
  assert(caughtMissingTherapistId, 'getEarningsReport rejects empty therapistAccountId with INVALID_INPUT');

  // ===========================================================================
  // SECTION 3: Authoritative Financial Calculations & Status Semantics
  // ===========================================================================
  console.log('\n--- SECTION 3: Authoritative Financial Semantics & Ledgers ---');

  // Mock ledger simulation to test all financial arithmetic and status invariants
  const mockTherapistId = 'th-acc-ledger-test';
  const nowTime = Date.now();

  // Record 3 sessions:
  // 1. Paid session: Gross 1500, Fee 225, Net 1275, Status 'collected'
  const earning1 = await TherapistPayoutService.recordEarningForAppointment({
    therapistAccountId: mockTherapistId,
    appointmentId: 'appt-fin-001',
    grossAmount: 1500,
    commissionRate: 15,
    initialStatus: 'collected',
  });
  assert(earning1.gross_amount === 1500, 'Earning 1 gross amount is 1500');
  assert(earning1.platform_fee === 225, 'Platform fee calculated as 15% (225)');
  assert(earning1.net_earnings === 1275, 'Net earnings calculated as 1275');

  // 2. Paid session: Gross 2000, Fee 300, Net 1700, Status 'collected'
  const earning2 = await TherapistPayoutService.recordEarningForAppointment({
    therapistAccountId: mockTherapistId,
    appointmentId: 'appt-fin-002',
    grossAmount: 2000,
    commissionRate: 15,
    initialStatus: 'collected',
  });
  assert(earning2.gross_amount === 2000, 'Earning 2 gross amount is 2000');
  assert(earning2.net_earnings === 1700, 'Earning 2 net earnings is 1700');

  // 3. Refunded/Cancelled session: Gross 1500, Fee 225, Net 1275, then refunded
  const earning3 = await TherapistPayoutService.recordEarningForAppointment({
    therapistAccountId: mockTherapistId,
    appointmentId: 'appt-fin-003',
    grossAmount: 1500,
    commissionRate: 15,
    initialStatus: 'collected',
  });
  await TherapistPayoutService.handleAppointmentRefund('appt-fin-003');
  assert(earning3.payment_status === 'cancelled', 'Refunded appointment earning transitions to "cancelled"');

  // 4. No-show semantics check:
  // Client No-Show: Therapist earns money (status stays 'collected')
  const earningClientNoShow = await TherapistPayoutService.recordEarningForAppointment({
    therapistAccountId: mockTherapistId,
    appointmentId: 'appt-client-noshow',
    grossAmount: 1500,
    commissionRate: 15,
    initialStatus: 'collected',
  });
  const clientNoShowRes = await TherapistPayoutService.handleAppointmentNoShow('appt-client-noshow', 'client');
  assert(clientNoShowRes.financialStatus === 'collected', 'Client no-show keeps therapist earning collected');

  // Therapist No-Show: Therapist earning is voided (transitions to 'cancelled')
  const earningTherapistNoShow = await TherapistPayoutService.recordEarningForAppointment({
    therapistAccountId: mockTherapistId,
    appointmentId: 'appt-therapist-noshow',
    grossAmount: 1500,
    commissionRate: 15,
    initialStatus: 'collected',
  });
  const therapistNoShowRes = await TherapistPayoutService.handleAppointmentNoShow('appt-therapist-noshow', 'therapist');
  assert(therapistNoShowRes.financialStatus === 'cancelled', 'Therapist no-show voids therapist earning to "cancelled"');

  // ===========================================================================
  // SECTION 4: Service Aggregations, Chart Consistency & Summary Match
  // ===========================================================================
  console.log('\n--- SECTION 4: Aggregations, Time-Series & Summary Consistency ---');

  const report = await TherapistEarningsService.getEarningsReport(mockTherapistId, {
    range: 'month',
  });

  assert(report.currency === 'INR', 'Currency is strictly INR');
  assert(typeof report.summary.totalEarnings === 'number', 'Summary totalEarnings is a valid number');
  assert(typeof report.summary.grossRevenue === 'number', 'Summary grossRevenue is a valid number');
  assert(typeof report.summary.platformFees === 'number', 'Summary platformFees is a valid number');
  assert(typeof report.summary.sessionCount === 'number', 'Summary sessionCount is a valid number');
  assert(Array.isArray(report.chart), 'Returns chart data points array');
  assert(Array.isArray(report.transactions), 'Returns itemized transactions array');
  assert(Array.isArray(report.payouts), 'Returns payout batches array');

  // Verify chart daily earnings sum up consistently with total earnings
  const chartEarningsSum = Math.round(report.chart.reduce((acc, curr) => acc + curr.earnings, 0) * 100) / 100;
  assert(
    chartEarningsSum === report.summary.totalEarnings,
    `Chart earnings sum (${chartEarningsSum}) strictly equals summary.totalEarnings (${report.summary.totalEarnings})`
  );

  // Verify chart session count sum equals summary session count
  const chartSessionsSum = report.chart.reduce((acc, curr) => acc + curr.sessions, 0);
  assert(
    chartSessionsSum === report.summary.sessionCount,
    `Chart sessions sum (${chartSessionsSum}) strictly equals summary.sessionCount (${report.summary.sessionCount})`
  );

  // Verify average per session math
  if (report.summary.sessionCount > 0) {
    const expectedAvg = Math.round((report.summary.totalEarnings / report.summary.sessionCount) * 100) / 100;
    assert(
      report.summary.averagePerSession === expectedAvg,
      `Average per session (${report.summary.averagePerSession}) matches expected (${expectedAvg})`
    );
  }

  // ===========================================================================
  // SECTION 5: Multi-Tenant Isolation & Privacy Safeguards
  // ===========================================================================
  console.log('\n--- SECTION 5: Multi-Tenant Isolation & Privacy Safeguards ---');

  // Verify Therapist B cannot see Therapist A earnings
  const mockTherapistBId = 'th-acc-isolated-tenant-b';
  const reportB = await TherapistEarningsService.getEarningsReport(mockTherapistBId, { range: 'month' });

  assert(reportB.summary.totalEarnings === 0, 'Tenant B has isolated zero earnings');
  assert(reportB.summary.sessionCount === 0, 'Tenant B has isolated zero session count');
  assert(reportB.transactions.length === 0, 'Tenant B sees 0 of Tenant A transactions');

  // Privacy: Transactions must never expose raw journal entries or patient clinical diagnosis
  const reportJSON = JSON.stringify(report);
  assert(!reportJSON.includes('raw_journal_entry'), 'Zero raw client journal data in earnings report');
  assert(!reportJSON.includes('clinical_diagnosis'), 'Zero clinical diagnosis in earnings report');
  assert(!reportJSON.includes('client_reflections'), 'Zero client reflections in earnings report');

  // Privacy: Zero Stripe or internal private key leakage
  assert(!reportJSON.includes('stripe_secret'), 'Zero payment provider secret leakage');
  assert(!reportJSON.includes('access_token'), 'Zero access token leakage');
  assert(!reportJSON.includes('refresh_token'), 'Zero refresh token leakage');

  // ===========================================================================
  // SECTION 6: API Route & Authentication Guards
  // ===========================================================================
  console.log('\n--- SECTION 6: API Route & Authorization Guards ---');

  // 1. Unauthenticated request to /api/therapist/earnings
  const unauthReq = new NextRequest('http://localhost:3000/api/therapist/earnings');
  const unauthRes = await getEarningsRoute(unauthReq);
  assert(unauthRes.status === 401 || unauthRes.status === 403, 'Unauthenticated request to /api/therapist/earnings is rejected');

  const unauthData = await unauthRes.json();
  assert(
    unauthData.error?.code === 'AUTH_REQUIRED' || unauthData.error?.code === 'THERAPIST_AUTH_REQUIRED' || unauthRes.status === 401,
    'Rejects with standard auth error'
  );

  // ===========================================================================
  // SECTION 7: Frontend Component & Navigation Integration
  // ===========================================================================
  console.log('\n--- SECTION 7: Frontend Component & Navigation Integration ---');

  const therapistEarningsViewPath = path.join(process.cwd(), 'src/views/therapist/TherapistEarningsView.jsx');
  assert(fs.existsSync(therapistEarningsViewPath), 'TherapistEarningsView.jsx exists on disk');

  const earningsViewCode = fs.readFileSync(therapistEarningsViewPath, 'utf8');
  assert(earningsViewCode.includes('selectedRange'), 'Earnings view implements range filtering');
  assert(earningsViewCode.includes('Earnings Trend'), 'Earnings view renders Earnings Trend chart');
  assert(earningsViewCode.includes('Session Transactions Ledger'), 'Earnings view renders itemized ledger');
  assert(earningsViewCode.includes('Bank Payout Batches'), 'Earnings view renders bank payout batches');

  const therapistShellPath = path.join(process.cwd(), 'src/views/therapist/TherapistDashboardShell.jsx');
  const therapistShellCode = fs.readFileSync(therapistShellPath, 'utf8');
  assert(
    therapistShellCode.includes("id: 'earnings'") && therapistShellCode.includes('TherapistEarningsView'),
    'TherapistDashboardShell registers earnings nav item and renders TherapistEarningsView'
  );

  const appPath = path.join(process.cwd(), 'src/App.jsx');
  const appCode = fs.readFileSync(appPath, 'utf8');
  assert(appCode.includes("case 'therapist/earnings':"), 'App.jsx routes therapist/earnings to TherapistPlatformView');

  // ===========================================================================
  // SUMMARY
  // ===========================================================================
  console.log('\n================================================================');
  console.log(`  THERAPIST EARNINGS SUITE RESULTS: ${passedTests}/${totalTests} PASSING`);
  console.log('================================================================\n');
}

runTherapistEarningsSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
