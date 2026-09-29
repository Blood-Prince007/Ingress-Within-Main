import { supabase } from '../db';
import { TherapistPayoutService, TherapistEarningRecord, PayoutBatchRecord } from './therapistPayoutService';

export type EarningsDateRange = 'today' | 'week' | 'month' | 'last_month' | 'custom';

export interface EarningsFilterOptions {
  range?: EarningsDateRange;
  from?: string; // YYYY-MM-DD or ISO
  to?: string;   // YYYY-MM-DD or ISO
  page?: number;
  limit?: number;
}

export interface EarningsSummaryMetrics {
  totalEarnings: number;     // Net collected + paid within period
  grossRevenue: number;      // Total gross within period
  platformFees: number;      // Total platform fees within period
  refunds: number;           // Cancelled / reversed amount within period
  pendingPayout: number;     // Currently collected and awaiting disbursement
  paidOut: number;           // Disbursed to bank
  sessionCount: number;      // Count of billable/active sessions
  averagePerSession: number; // totalEarnings / sessionCount
  currency: string;
}

export interface EarningsChartPoint {
  date: string;              // YYYY-MM-DD
  label: string;             // Short formatted date e.g. "Sep 29"
  earnings: number;          // Net earnings on this date
  gross: number;             // Gross on this date
  sessions: number;          // Sessions count on this date
}

export interface EarningsTransactionItem {
  id: string;
  appointmentId: string | null;
  date: string;
  sessionDate: string | null;
  clientLabel: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  status: 'collected' | 'paid' | 'cancelled' | 'reversed' | 'pending';
  payoutBatchId: string | null;
  payoutDate: string | null;
}

export interface EarningsReportResponse {
  currency: string;
  range: EarningsDateRange;
  period: {
    from: string;
    to: string;
  };
  summary: EarningsSummaryMetrics;
  chart: EarningsChartPoint[];
  transactions: EarningsTransactionItem[];
  payouts: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class TherapistEarningsService {
  /**
   * Resolves date bounds for the requested range in IST / local timezone.
   */
  static resolveDateRange(options: EarningsFilterOptions): { fromIso: string; toIso: string; rangeKey: EarningsDateRange } {
    const now = new Date();
    const range = options.range || 'month';

    if (range === 'custom') {
      if (!options.from || !options.to) {
        const err: any = new Error('Both "from" and "to" dates are required for custom range.');
        err.code = 'INVALID_DATE_RANGE';
        err.status = 400;
        throw err;
      }

      let fromDate: Date;
      let toDate: Date;

      if (/^\d{4}-\d{2}-\d{2}$/.test(options.from)) {
        const [y, m, d] = options.from.split('-').map(Number);
        fromDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
      } else {
        fromDate = new Date(options.from);
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(options.to)) {
        const [y, m, d] = options.to.split('-').map(Number);
        toDate = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
      } else {
        toDate = new Date(options.to);
      }

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        const err: any = new Error('Malformed date provided. Expected YYYY-MM-DD or ISO-8601.');
        err.code = 'INVALID_DATE_FORMAT';
        err.status = 400;
        throw err;
      }

      if (fromDate.getTime() > toDate.getTime()) {
        const err: any = new Error('"from" date cannot be after "to" date.');
        err.code = 'INVALID_DATE_RANGE';
        err.status = 400;
        throw err;
      }

      return {
        fromIso: fromDate.toISOString(),
        toIso: toDate.toISOString(),
        rangeKey: 'custom',
      };
    }

    if (range === 'today') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);

      return {
        fromIso: start.toISOString(),
        toIso: end.toISOString(),
        rangeKey: 'today',
      };
    }

    if (range === 'week') {
      const start = new Date(now);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);

      const end = new Date(now);
      end.setHours(23, 59, 59, 999);

      return {
        fromIso: start.toISOString(),
        toIso: end.toISOString(),
        rangeKey: 'week',
      };
    }

    if (range === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      return {
        fromIso: start.toISOString(),
        toIso: end.toISOString(),
        rangeKey: 'last_month',
      };
    }

    // Default: 'month' (Current month)
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return {
      fromIso: start.toISOString(),
      toIso: end.toISOString(),
      rangeKey: 'month',
    };
  }

  /**
   * Retrieves authoritative financial report for a therapist with metrics, charts, and transaction rows.
   */
  static async getEarningsReport(
    therapistAccountId: string,
    options: EarningsFilterOptions = {}
  ): Promise<EarningsReportResponse> {
    if (!therapistAccountId) {
      const err: any = new Error('therapistAccountId is required.');
      err.code = 'INVALID_INPUT';
      err.status = 400;
      throw err;
    }

    const { fromIso, toIso, rangeKey } = this.resolveDateRange(options);
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 50));

    // 1. Fetch all earnings for this therapist
    const { data: dbEarnings, error } = await supabase
      .from('therapist_earnings')
      .select(`
        id,
        appointment_id,
        gross_amount,
        platform_fee,
        net_earnings,
        payment_status,
        collected_at,
        payout_batch_id,
        payout_date,
        created_at,
        therapist_clinical_appointments (
          id,
          scheduled_start,
          user_id,
          attendance_status,
          refund_status,
          users (
            id,
            name
          )
        )
      `)
      .eq('therapist_account_id', therapistAccountId)
      .order('collected_at', { ascending: false });

    if (error && error.code !== 'PGRST205' && error.code !== '42P01') {
      console.warn('[TherapistEarningsService] Remote query note:', error);
    }

    // 2. Fetch payout batches for the therapist
    const batches = await TherapistPayoutService.getPayoutBatchesForTherapist(therapistAccountId);
    const batchMap = new Map(batches.map((b) => [b.id, b]));

    // Combine DB records and in-memory records (deduplicated by id)
    const earningsMap = new Map<string, any>();
    if (dbEarnings && dbEarnings.length > 0) {
      for (const e of dbEarnings) {
        earningsMap.set(e.id, e);
      }
    }

    const memoryEarnings = TherapistPayoutService.getInMemoryEarningsForTherapist(therapistAccountId);
    for (const me of memoryEarnings) {
      if (!earningsMap.has(me.id)) {
        earningsMap.set(me.id, {
          id: me.id,
          appointment_id: me.appointment_id,
          gross_amount: me.gross_amount,
          platform_fee: me.platform_fee,
          net_earnings: me.net_earnings,
          payment_status: me.payment_status,
          collected_at: me.collected_at,
          payout_batch_id: me.payout_batch_id,
          payout_date: me.payout_date,
          created_at: me.created_at,
          therapist_clinical_appointments: null,
        });
      }
    }

    const allEarnings = Array.from(earningsMap.values());

    // Financial accumulator variables across the selected date range
    let totalGrossInRange = 0;
    let totalPlatformFeesInRange = 0;
    let totalNetEarningsInRange = 0;
    let totalRefundsInRange = 0;
    let sessionCountInRange = 0;

    // Global payout state accumulators
    let totalPendingPayout = 0;
    let totalPaidOut = 0;

    // Filtered transaction list for table & charts
    const inRangeTransactions: EarningsTransactionItem[] = [];

    // Map for aggregating daily chart points
    const dailyMap: Map<string, { earnings: number; gross: number; sessions: number }> = new Map();

    for (const e of allEarnings) {
      const gross = Number(e.gross_amount) || 0;
      const fee = Number(e.platform_fee) || 0;
      const net = Number(e.net_earnings) || (gross - fee);
      const status = (e.payment_status || 'collected') as 'collected' | 'paid' | 'cancelled' | 'reversed' | 'pending';
      const eventDate = e.collected_at || e.created_at;

      const appt = Array.isArray(e.therapist_clinical_appointments)
        ? e.therapist_clinical_appointments[0]
        : e.therapist_clinical_appointments;

      // Privacy-safe client label
      const rawName = appt?.users?.full_name || appt?.users?.name;
      const clientLabel = rawName ? rawName : (appt?.user_id ? `Client #${appt.user_id.substring(0, 6)}` : 'Client Session');

      // Global pending / paid out metrics
      if (status === 'collected') {
        const batch = e.payout_batch_id ? batchMap.get(e.payout_batch_id) : null;
        if (!batch || batch.status === 'pending' || batch.status === 'processing') {
          totalPendingPayout += net;
        }
      } else if (status === 'paid') {
        totalPaidOut += net;
      }

      // Check if this earning falls within the queried date range
      const inRange = eventDate >= fromIso && eventDate <= toIso;

      if (inRange) {
        if (status === 'collected' || status === 'paid') {
          totalGrossInRange += gross;
          totalPlatformFeesInRange += fee;
          totalNetEarningsInRange += net;
          sessionCountInRange += 1;

          // Chart point grouping by Date (YYYY-MM-DD)
          const dayKey = eventDate.substring(0, 10);
          const currentPoint = dailyMap.get(dayKey) || { earnings: 0, gross: 0, sessions: 0 };
          currentPoint.earnings += net;
          currentPoint.gross += gross;
          currentPoint.sessions += 1;
          dailyMap.set(dayKey, currentPoint);
        } else if (status === 'cancelled' || status === 'reversed') {
          totalRefundsInRange += gross;
        }

        inRangeTransactions.push({
          id: e.id,
          appointmentId: e.appointment_id,
          date: eventDate,
          sessionDate: appt?.scheduled_start || null,
          clientLabel,
          grossAmount: gross,
          platformFee: fee,
          netAmount: (status === 'cancelled' || status === 'reversed') ? 0 : net,
          status,
          payoutBatchId: e.payout_batch_id || null,
          payoutDate: e.payout_date || null,
        });
      }
    }

    // Generate chart data array
    const chartPoints: EarningsChartPoint[] = [];

    // Construct contiguous day points if range is <= 35 days
    const fromCursor = new Date(fromIso);
    const toCursor = new Date(toIso);
    const startUtc = Date.UTC(fromCursor.getUTCFullYear(), fromCursor.getUTCMonth(), fromCursor.getUTCDate());
    const endUtc = Date.UTC(toCursor.getUTCFullYear(), toCursor.getUTCMonth(), toCursor.getUTCDate());
    const daySpan = Math.round((endUtc - startUtc) / 86400000);

    if (daySpan <= 35 && daySpan >= 0) {
      let curUtc = startUtc;
      while (curUtc <= endUtc) {
        const curDate = new Date(curUtc);
        const dayKey = curDate.toISOString().substring(0, 10);
        const data = dailyMap.get(dayKey) || { earnings: 0, gross: 0, sessions: 0 };
        const label = curDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

        chartPoints.push({
          date: dayKey,
          label,
          earnings: Math.round(data.earnings * 100) / 100,
          gross: Math.round(data.gross * 100) / 100,
          sessions: data.sessions,
        });

        curUtc += 86400000;
      }
    } else {
      // Sort existing entries
      const sortedKeys = Array.from(dailyMap.keys()).sort();
      for (const k of sortedKeys) {
        const d = dailyMap.get(k)!;
        const dt = new Date(k + 'T00:00:00.000Z');
        chartPoints.push({
          date: k,
          label: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
          earnings: Math.round(d.earnings * 100) / 100,
          gross: Math.round(d.gross * 100) / 100,
          sessions: d.sessions,
        });
      }
    }

    // Pagination of transaction rows
    const totalTransactions = inRangeTransactions.length;
    const totalPages = Math.ceil(totalTransactions / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedTransactions = inRangeTransactions.slice(startIndex, startIndex + limit);

    const averagePerSession = sessionCountInRange > 0
      ? Math.round((totalNetEarningsInRange / sessionCountInRange) * 100) / 100
      : 0;

    const formattedPayouts = batches.map((b) => ({
      id: b.id,
      batchId: b.id,
      period: `${new Date(b.period_start).toLocaleDateString('en-IN')} - ${new Date(b.period_end).toLocaleDateString('en-IN')}`,
      periodStart: b.period_start,
      periodEnd: b.period_end,
      amount: b.total_net,
      status: b.status,
      paidDate: b.paid_at,
      bankReference: b.bank_reference,
      failureReason: b.failure_reason,
      reversalReason: b.reversal_reason,
      createdAt: b.created_at,
    }));

    return {
      currency: 'INR',
      range: rangeKey,
      period: {
        from: fromIso,
        to: toIso,
      },
      summary: {
        totalEarnings: Math.round(totalNetEarningsInRange * 100) / 100,
        grossRevenue: Math.round(totalGrossInRange * 100) / 100,
        platformFees: Math.round(totalPlatformFeesInRange * 100) / 100,
        refunds: Math.round(totalRefundsInRange * 100) / 100,
        pendingPayout: Math.round(totalPendingPayout * 100) / 100,
        paidOut: Math.round(totalPaidOut * 100) / 100,
        sessionCount: sessionCountInRange,
        averagePerSession,
        currency: 'INR',
      },
      chart: chartPoints,
      transactions: paginatedTransactions,
      payouts: formattedPayouts,
      pagination: {
        page,
        limit,
        total: totalTransactions,
        totalPages,
      },
    };
  }
}
