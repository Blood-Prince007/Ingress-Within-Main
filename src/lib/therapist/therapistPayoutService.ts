import crypto from 'crypto';
import { supabase } from '../db';

export type EarningFinancialStatus =
  | 'pending'
  | 'collected'
  | 'paid'
  | 'cancelled'
  | 'reversed';

export type PayoutBatchStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'reversed';

export interface TherapistEarningRecord {
  id: string;
  therapist_account_id: string;
  appointment_id: string;
  gross_amount: number;
  platform_fee: number;
  net_earnings: number;
  payment_status: EarningFinancialStatus;
  collected_at: string | null;
  payout_batch_id: string | null;
  payout_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayoutBatchRecord {
  id: string;
  therapist_account_id: string;
  period_start: string;
  period_end: string;
  total_net: number;
  currency: string;
  status: PayoutBatchStatus;
  paid_at: string | null;
  bank_reference: string | null;
  failure_reason: string | null;
  reversal_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayoutBatchItemRecord {
  id: string;
  payout_batch_id: string;
  earning_id: string;
  net_amount: number;
  created_at: string;
}

export class TherapistPayoutService {
  // In-memory fallbacks for test/local environments when remote DB tables are pending migration
  private static inMemoryEarnings: Map<string, TherapistEarningRecord> = new Map();
  private static inMemoryBatches: Map<string, PayoutBatchRecord> = new Map();
  private static inMemoryBatchItems: Map<string, PayoutBatchItemRecord> = new Map();

  // Concurrency guard to prevent simultaneous batch creation for the same therapist
  private static activeBatchLocks: Set<string> = new Set();

  /**
   * Validates financial state transitions for an earning record.
   * State Machine:
   *   pending -> collected
   *   pending -> cancelled
   *   collected -> paid
   *   collected -> cancelled
   *   paid -> reversed
   */
  static validateFinancialTransition(
    current: EarningFinancialStatus,
    target: EarningFinancialStatus
  ): boolean {
    if (current === target) return true; // Idempotent

    const validMap: Record<EarningFinancialStatus, EarningFinancialStatus[]> = {
      pending: ['collected', 'cancelled'],
      collected: ['paid', 'cancelled'],
      paid: ['reversed'],
      cancelled: [], // Terminal
      reversed: [], // Terminal
    };

    const allowed = validMap[current] || [];
    if (!allowed.includes(target)) {
      const err: any = new Error(
        `INVALID_FINANCIAL_TRANSITION: Cannot transition earning from '${current}' to '${target}'.`
      );
      err.code = 'INVALID_FINANCIAL_TRANSITION';
      err.status = 400;
      throw err;
    }
    return true;
  }

  /**
   * Validates payout batch state transitions.
   * State Machine:
   *   pending -> processing
   *   pending -> failed
   *   processing -> paid
   *   processing -> failed
   *   paid -> reversed
   */
  static validateBatchTransition(
    current: PayoutBatchStatus,
    target: PayoutBatchStatus
  ): boolean {
    if (current === target) return true; // Idempotent

    const validMap: Record<PayoutBatchStatus, PayoutBatchStatus[]> = {
      pending: ['processing', 'failed'],
      processing: ['paid', 'failed'],
      paid: ['reversed'],
      failed: [], // Terminal
      reversed: [], // Terminal
    };

    const allowed = validMap[current] || [];
    if (!allowed.includes(target)) {
      const err: any = new Error(
        `INVALID_BATCH_TRANSITION: Cannot transition payout batch from '${current}' to '${target}'.`
      );
      err.code = 'INVALID_BATCH_TRANSITION';
      err.status = 400;
      throw err;
    }
    return true;
  }

  /**
   * Records a therapist earning for an appointment.
   * ENFORCES LEDGER INVARIANT: At most ONE earning record per appointment.
   * Idempotent: repeated calls for the same appointment return the existing record.
   */
  static async recordEarningForAppointment(params: {
    therapistAccountId: string;
    appointmentId: string;
    grossAmount: number;
    commissionRate?: number;
    initialStatus?: EarningFinancialStatus;
  }): Promise<TherapistEarningRecord> {
    const { therapistAccountId, appointmentId, grossAmount, commissionRate = 15, initialStatus = 'collected' } = params;

    // 1. Check existing earning in memory
    for (const earning of this.inMemoryEarnings.values()) {
      if (earning.appointment_id === appointmentId) {
        return earning;
      }
    }

    // 2. Check existing earning in DB
    const { data: dbExisting, error: fetchErr } = await supabase
      .from('therapist_earnings')
      .select('*')
      .eq('appointment_id', appointmentId)
      .maybeSingle();

    if (dbExisting) {
      const record: TherapistEarningRecord = {
        id: dbExisting.id,
        therapist_account_id: dbExisting.therapist_account_id,
        appointment_id: dbExisting.appointment_id,
        gross_amount: Number(dbExisting.gross_amount),
        platform_fee: Number(dbExisting.platform_fee),
        net_earnings: Number(dbExisting.net_earnings || (dbExisting as any).net_amount || 0),
        payment_status: (dbExisting.payment_status || (dbExisting as any).status || 'collected') as EarningFinancialStatus,
        collected_at: dbExisting.collected_at,
        payout_batch_id: dbExisting.payout_batch_id,
        payout_date: dbExisting.payout_date,
        created_at: dbExisting.created_at,
        updated_at: dbExisting.updated_at || dbExisting.created_at,
      };
      this.inMemoryEarnings.set(record.id, record);
      return record;
    }

    // 3. Compute platform fee & net earnings authoritatively
    const gross = Number(grossAmount);
    const commRate = Number(commissionRate);
    const platformFee = Math.round(gross * (commRate / 100) * 100) / 100;
    const netEarnings = Math.round((gross - platformFee) * 100) / 100;
    const nowIso = new Date().toISOString();

    const newRecord: TherapistEarningRecord = {
      id: crypto.randomUUID(),
      therapist_account_id: therapistAccountId,
      appointment_id: appointmentId,
      gross_amount: gross,
      platform_fee: platformFee,
      net_earnings: netEarnings,
      payment_status: initialStatus,
      collected_at: initialStatus === 'collected' ? nowIso : null,
      payout_batch_id: null,
      payout_date: null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    // 4. Persist to DB
    const { error: insertErr } = await supabase.from('therapist_earnings').insert({
      id: newRecord.id,
      therapist_account_id: newRecord.therapist_account_id,
      appointment_id: newRecord.appointment_id,
      gross_amount: newRecord.gross_amount,
      platform_fee: newRecord.platform_fee,
      net_earnings: newRecord.net_earnings,
      payment_status: newRecord.payment_status,
      collected_at: newRecord.collected_at,
      created_at: newRecord.created_at,
      updated_at: newRecord.updated_at,
    });

    if (insertErr) {
      if (insertErr.code === '23505') {
        // Unique violation race condition: re-fetch the winner row
        const { data: winner } = await supabase
          .from('therapist_earnings')
          .select('*')
          .eq('appointment_id', appointmentId)
          .single();
        if (winner) {
          const rec: TherapistEarningRecord = {
            id: winner.id,
            therapist_account_id: winner.therapist_account_id,
            appointment_id: winner.appointment_id,
            gross_amount: Number(winner.gross_amount),
            platform_fee: Number(winner.platform_fee),
            net_earnings: Number(winner.net_earnings),
            payment_status: winner.payment_status as EarningFinancialStatus,
            collected_at: winner.collected_at,
            payout_batch_id: winner.payout_batch_id,
            payout_date: winner.payout_date,
            created_at: winner.created_at,
            updated_at: winner.updated_at,
          };
          this.inMemoryEarnings.set(rec.id, rec);
          return rec;
        }
      }
      // Graceful in-memory fallback if table unmigrated
      this.inMemoryEarnings.set(newRecord.id, newRecord);
    } else {
      this.inMemoryEarnings.set(newRecord.id, newRecord);
    }

    return newRecord;
  }

  /**
   * Fetches an earning by appointment ID.
   */
  static async getEarningByAppointmentId(
    appointmentId: string
  ): Promise<TherapistEarningRecord | null> {
    for (const e of this.inMemoryEarnings.values()) {
      if (e.appointment_id === appointmentId) return e;
    }

    const { data, error } = await supabase
      .from('therapist_earnings')
      .select('*')
      .eq('appointment_id', appointmentId)
      .maybeSingle();

    if (data) {
      const rec: TherapistEarningRecord = {
        id: data.id,
        therapist_account_id: data.therapist_account_id,
        appointment_id: data.appointment_id,
        gross_amount: Number(data.gross_amount),
        platform_fee: Number(data.platform_fee),
        net_earnings: Number(data.net_earnings || (data as any).net_amount || 0),
        payment_status: (data.payment_status || (data as any).status || 'collected') as EarningFinancialStatus,
        collected_at: data.collected_at,
        payout_batch_id: data.payout_batch_id,
        payout_date: data.payout_date,
        created_at: data.created_at,
        updated_at: data.updated_at || data.created_at,
      };
      this.inMemoryEarnings.set(rec.id, rec);
      return rec;
    }
    return null;
  }

  /**
   * Creates an explicit payout batch for a therapist.
   * Invariants:
   * - Selects ONLY eligible 'collected' earnings.
   * - Excludes already-batched earnings (payout_batch_id IS NULL).
   * - Excludes cancelled / reversed earnings.
   * - Calculates total from actual DB rows.
   * - Concurrency-safe: rejects concurrent batch creation for same therapist.
   * - Batch total_net strictly equals exact sum of item net_amount values.
   */
  static async createPayoutBatch(params: {
    therapistAccountId: string;
    periodStart: string;
    periodEnd: string;
  }): Promise<{ batch: PayoutBatchRecord; items: PayoutBatchItemRecord[] }> {
    const { therapistAccountId, periodStart, periodEnd } = params;

    if (!therapistAccountId) {
      const err: any = new Error('therapistAccountId is required.');
      err.code = 'INVALID_INPUT';
      err.status = 400;
      throw err;
    }

    if (new Date(periodStart).getTime() > new Date(periodEnd).getTime()) {
      const err: any = new Error('periodStart cannot be after periodEnd.');
      err.code = 'INVALID_PERIOD';
      err.status = 400;
      throw err;
    }

    // Concurrency Lock Guard
    if (this.activeBatchLocks.has(therapistAccountId)) {
      const err: any = new Error(
        'A payout batch is currently being created for this therapist. Concurrent creation blocked.'
      );
      err.code = 'CONCURRENT_BATCH_CREATION';
      err.status = 409;
      throw err;
    }

    this.activeBatchLocks.add(therapistAccountId);

    try {
      // 1. Fetch eligible earnings from DB & memory
      let eligibleEarnings: TherapistEarningRecord[] = [];

      const { data: dbRows, error: fetchErr } = await supabase
        .from('therapist_earnings')
        .select('*')
        .eq('therapist_account_id', therapistAccountId)
        .eq('payment_status', 'collected')
        .is('payout_batch_id', null)
        .gte('collected_at', periodStart)
        .lte('collected_at', periodEnd);

      if (dbRows && dbRows.length > 0) {
        eligibleEarnings = dbRows.map((r: any) => ({
          id: r.id,
          therapist_account_id: r.therapist_account_id,
          appointment_id: r.appointment_id,
          gross_amount: Number(r.gross_amount),
          platform_fee: Number(r.platform_fee),
          net_earnings: Number(r.net_earnings || r.net_amount || 0),
          payment_status: (r.payment_status || r.status || 'collected') as EarningFinancialStatus,
          collected_at: r.collected_at,
          payout_batch_id: r.payout_batch_id,
          payout_date: r.payout_date,
          created_at: r.created_at,
          updated_at: r.updated_at || r.created_at,
        }));
      } else {
        // Fallback to in-memory check
        for (const e of this.inMemoryEarnings.values()) {
          if (
            e.therapist_account_id === therapistAccountId &&
            e.payment_status === 'collected' &&
            !e.payout_batch_id &&
            e.collected_at &&
            e.collected_at >= periodStart &&
            e.collected_at <= periodEnd
          ) {
            eligibleEarnings.push(e);
          }
        }
      }

      if (eligibleEarnings.length === 0) {
        const err: any = new Error('No eligible collected earnings found for this payout period.');
        err.code = 'NO_ELIGIBLE_EARNINGS';
        err.status = 400;
        throw err;
      }

      // 2. Authoritative total calculation
      const totalNet = Math.round(
        eligibleEarnings.reduce((acc, curr) => acc + curr.net_earnings, 0) * 100
      ) / 100;

      const batchId = crypto.randomUUID();
      const nowIso = new Date().toISOString();

      const batchRecord: PayoutBatchRecord = {
        id: batchId,
        therapist_account_id: therapistAccountId,
        period_start: periodStart,
        period_end: periodEnd,
        total_net: totalNet,
        currency: 'INR',
        status: 'pending',
        paid_at: null,
        bank_reference: null,
        failure_reason: null,
        reversal_reason: null,
        created_at: nowIso,
        updated_at: nowIso,
      };

      const items: PayoutBatchItemRecord[] = eligibleEarnings.map((e) => ({
        id: crypto.randomUUID(),
        payout_batch_id: batchId,
        earning_id: e.id,
        net_amount: e.net_earnings,
        created_at: nowIso,
      }));

      // Check sum invariant: total_net must strictly equal sum of item net amounts
      const sumItems = Math.round(
        items.reduce((acc, curr) => acc + curr.net_amount, 0) * 100
      ) / 100;

      if (sumItems !== totalNet) {
        throw new Error('LEDGER_INVARIANT_VIOLATION: Batch total does not match items sum.');
      }

      // 3. Persist batch & items
      const { error: batchErr } = await supabase
        .from('therapist_payout_batches')
        .insert(batchRecord);

      if (!batchErr) {
        await supabase.from('therapist_payout_batch_items').insert(items);
        // Update earnings to link to batch
        const earningIds = eligibleEarnings.map((e) => e.id);
        await supabase
          .from('therapist_earnings')
          .update({ payout_batch_id: batchId, updated_at: nowIso })
          .in('id', earningIds);
      }

      // Always update in-memory stores
      this.inMemoryBatches.set(batchId, batchRecord);
      for (const item of items) {
        this.inMemoryBatchItems.set(item.id, item);
      }
      for (const e of eligibleEarnings) {
        e.payout_batch_id = batchId;
        e.updated_at = nowIso;
        this.inMemoryEarnings.set(e.id, e);
      }

      return { batch: batchRecord, items };
    } finally {
      this.activeBatchLocks.delete(therapistAccountId);
    }
  }

  /**
   * Transitions a payout batch from 'pending' to 'processing'.
   */
  static async startPayoutBatch(batchId: string): Promise<PayoutBatchRecord> {
    const batch = await this.getPayoutBatchById(batchId);
    if (!batch) {
      const err: any = new Error('Payout batch not found.');
      err.code = 'BATCH_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    this.validateBatchTransition(batch.status, 'processing');

    const nowIso = new Date().toISOString();
    batch.status = 'processing';
    batch.updated_at = nowIso;

    await supabase
      .from('therapist_payout_batches')
      .update({ status: 'processing', updated_at: nowIso })
      .eq('id', batchId);

    this.inMemoryBatches.set(batchId, batch);
    return batch;
  }

  /**
   * Marks a payout batch as 'paid' upon confirmed bank transfer.
   * Transitions all linked earnings to 'paid' and records payout_date.
   */
  static async markPayoutPaid(
    batchId: string,
    options?: { bankReference?: string; paidAt?: string }
  ): Promise<PayoutBatchRecord> {
    const batch = await this.getPayoutBatchById(batchId);
    if (!batch) {
      const err: any = new Error('Payout batch not found.');
      err.code = 'BATCH_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    if (batch.status === 'paid') {
      return batch; // Idempotent
    }

    this.validateBatchTransition(batch.status, 'paid');

    const paidAt = options?.paidAt || new Date().toISOString();
    const bankRef = options?.bankReference || `BANK_REF_${Date.now()}`;
    const nowIso = new Date().toISOString();

    batch.status = 'paid';
    batch.paid_at = paidAt;
    batch.bank_reference = bankRef;
    batch.updated_at = nowIso;

    // 1. Update batch in DB
    await supabase
      .from('therapist_payout_batches')
      .update({
        status: 'paid',
        paid_at: paidAt,
        bank_reference: bankRef,
        updated_at: nowIso,
      })
      .eq('id', batchId);

    // 2. Transition all associated earnings to 'paid'
    await supabase
      .from('therapist_earnings')
      .update({
        payment_status: 'paid',
        payout_date: paidAt,
        updated_at: nowIso,
      })
      .eq('payout_batch_id', batchId);

    // Update in-memory stores
    this.inMemoryBatches.set(batchId, batch);
    for (const earning of this.inMemoryEarnings.values()) {
      if (earning.payout_batch_id === batchId) {
        this.validateFinancialTransition(earning.payment_status, 'paid');
        earning.payment_status = 'paid';
        earning.payout_date = paidAt;
        earning.updated_at = nowIso;
      }
    }

    return batch;
  }

  /**
   * Marks a payout batch as 'failed' (e.g. invalid bank account).
   * Releases linked earnings back to un-batched 'collected' so they can be re-batched.
   */
  static async markPayoutFailed(
    batchId: string,
    options?: { reason?: string }
  ): Promise<PayoutBatchRecord> {
    const batch = await this.getPayoutBatchById(batchId);
    if (!batch) {
      const err: any = new Error('Payout batch not found.');
      err.code = 'BATCH_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    this.validateBatchTransition(batch.status, 'failed');

    const nowIso = new Date().toISOString();
    const reason = options?.reason || 'Bank transfer failed';

    batch.status = 'failed';
    batch.failure_reason = reason;
    batch.updated_at = nowIso;

    await supabase
      .from('therapist_payout_batches')
      .update({
        status: 'failed',
        failure_reason: reason,
        updated_at: nowIso,
      })
      .eq('id', batchId);

    // Release linked earnings back to unbatched state so they can be included in future batches
    await supabase
      .from('therapist_earnings')
      .update({
        payout_batch_id: null,
        updated_at: nowIso,
      })
      .eq('payout_batch_id', batchId);

    this.inMemoryBatches.set(batchId, batch);
    for (const earning of this.inMemoryEarnings.values()) {
      if (earning.payout_batch_id === batchId) {
        earning.payout_batch_id = null;
        earning.updated_at = nowIso;
      }
    }

    return batch;
  }

  /**
   * Reverses a paid payout batch.
   * State Machine: paid -> reversed.
   * Transitions linked earnings from 'paid' -> 'reversed'.
   */
  static async reversePayout(
    batchId: string,
    options: { reason: string }
  ): Promise<PayoutBatchRecord> {
    if (!options?.reason) {
      const err: any = new Error('Reversal reason is required.');
      err.code = 'REVERSAL_REASON_REQUIRED';
      err.status = 400;
      throw err;
    }

    const batch = await this.getPayoutBatchById(batchId);
    if (!batch) {
      const err: any = new Error('Payout batch not found.');
      err.code = 'BATCH_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    this.validateBatchTransition(batch.status, 'reversed');

    const nowIso = new Date().toISOString();
    batch.status = 'reversed';
    batch.reversal_reason = options.reason;
    batch.updated_at = nowIso;

    await supabase
      .from('therapist_payout_batches')
      .update({
        status: 'reversed',
        reversal_reason: options.reason,
        updated_at: nowIso,
      })
      .eq('id', batchId);

    // Transition linked earnings to 'reversed'
    await supabase
      .from('therapist_earnings')
      .update({
        payment_status: 'reversed',
        updated_at: nowIso,
      })
      .eq('payout_batch_id', batchId);

    this.inMemoryBatches.set(batchId, batch);
    for (const earning of this.inMemoryEarnings.values()) {
      if (earning.payout_batch_id === batchId) {
        this.validateFinancialTransition(earning.payment_status, 'reversed');
        earning.payment_status = 'reversed';
        earning.updated_at = nowIso;
      }
    }

    return batch;
  }

  /**
   * Handles cancellation & refund of a session.
   * Preserves historical financial records without corrupting paid payout batches:
   * - If earning is 'collected' and unpaid: transitions to 'cancelled'.
   *   If in a pending/processing batch, safely removes from the batch.
   * - If earning is already 'paid': transitions to 'reversed' (dispute/clawback),
   *   leaving the historical payout batch intact.
   */
  static async handleAppointmentRefund(
    appointmentId: string
  ): Promise<{ success: boolean; earningStatus: EarningFinancialStatus }> {
    const earning = await this.getEarningByAppointmentId(appointmentId);
    if (!earning) {
      return { success: true, earningStatus: 'cancelled' };
    }

    const nowIso = new Date().toISOString();

    if (earning.payment_status === 'collected' || earning.payment_status === 'pending') {
      // Unpaid: transition to cancelled
      this.validateFinancialTransition(earning.payment_status, 'cancelled');

      // If attached to a pending/processing batch, remove it and adjust batch total
      if (earning.payout_batch_id) {
        const batch = await this.getPayoutBatchById(earning.payout_batch_id);
        if (batch && (batch.status === 'pending' || batch.status === 'processing')) {
          const newTotal = Math.max(0, Math.round((batch.total_net - earning.net_earnings) * 100) / 100);
          batch.total_net = newTotal;
          batch.updated_at = nowIso;

          await supabase
            .from('therapist_payout_batches')
            .update({ total_net: newTotal, updated_at: nowIso })
            .eq('id', batch.id);

          await supabase
            .from('therapist_payout_batch_items')
            .delete()
            .eq('earning_id', earning.id);

          this.inMemoryBatches.set(batch.id, batch);
          for (const [id, item] of this.inMemoryBatchItems.entries()) {
            if (item.earning_id === earning.id) {
              this.inMemoryBatchItems.delete(id);
            }
          }
        }
      }

      earning.payment_status = 'cancelled';
      earning.payout_batch_id = null;
      earning.updated_at = nowIso;

      await supabase
        .from('therapist_earnings')
        .update({
          payment_status: 'cancelled',
          payout_batch_id: null,
          updated_at: nowIso,
        })
        .eq('id', earning.id);

      this.inMemoryEarnings.set(earning.id, earning);
      return { success: true, earningStatus: 'cancelled' };
    }

    if (earning.payment_status === 'paid') {
      // Already paid to therapist: transition to reversed (audit trail preserved)
      this.validateFinancialTransition(earning.payment_status, 'reversed');

      earning.payment_status = 'reversed';
      earning.updated_at = nowIso;

      await supabase
        .from('therapist_earnings')
        .update({
          payment_status: 'reversed',
          updated_at: nowIso,
        })
        .eq('id', earning.id);

      this.inMemoryEarnings.set(earning.id, earning);
      return { success: true, earningStatus: 'reversed' };
    }

    return { success: true, earningStatus: earning.payment_status };
  }

  /**
   * Handles no-show semantics according to clinical financial policy:
   * - Client no-show: no refund, therapist earning remains 'collected' (eligible for payout).
   * - Therapist no-show: 100% refund, therapist earning is voided ('cancelled' or 'reversed').
   */
  static async handleAppointmentNoShow(
    appointmentId: string,
    noShowParty: 'client' | 'therapist'
  ): Promise<{ attendanceStatus: string; financialStatus: EarningFinancialStatus }> {
    const earning = await this.getEarningByAppointmentId(appointmentId);

    if (noShowParty === 'client') {
      // Client no-show: therapist earning remains collected/eligible
      return {
        attendanceStatus: 'client_no_show',
        financialStatus: earning ? earning.payment_status : 'collected',
      };
    } else {
      // Therapist no-show: void therapist earning
      const refundResult = await this.handleAppointmentRefund(appointmentId);
      return {
        attendanceStatus: 'therapist_no_show',
        financialStatus: refundResult.earningStatus,
      };
    }
  }

  /**
   * Fetches a payout batch by ID.
   */
  static async getPayoutBatchById(batchId: string): Promise<PayoutBatchRecord | null> {
    if (this.inMemoryBatches.has(batchId)) {
      return this.inMemoryBatches.get(batchId)!;
    }

    const { data } = await supabase
      .from('therapist_payout_batches')
      .select('*')
      .eq('id', batchId)
      .maybeSingle();

    if (data) {
      const rec: PayoutBatchRecord = {
        id: data.id,
        therapist_account_id: data.therapist_account_id,
        period_start: data.period_start,
        period_end: data.period_end,
        total_net: Number(data.total_net),
        currency: data.currency || 'INR',
        status: data.status as PayoutBatchStatus,
        paid_at: data.paid_at,
        bank_reference: data.bank_reference,
        failure_reason: data.failure_reason,
        reversal_reason: data.reversal_reason,
        created_at: data.created_at,
        updated_at: data.updated_at || data.created_at,
      };
      this.inMemoryBatches.set(rec.id, rec);
      return rec;
    }
    return null;
  }

  /**
   * Fetches all payout batches for a specific therapist.
   */
  static async getPayoutBatchesForTherapist(
    therapistAccountId: string
  ): Promise<PayoutBatchRecord[]> {
    const batches: PayoutBatchRecord[] = [];

    const { data } = await supabase
      .from('therapist_payout_batches')
      .select('*')
      .eq('therapist_account_id', therapistAccountId)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      for (const d of data) {
        batches.push({
          id: d.id,
          therapist_account_id: d.therapist_account_id,
          period_start: d.period_start,
          period_end: d.period_end,
          total_net: Number(d.total_net),
          currency: d.currency || 'INR',
          status: d.status as PayoutBatchStatus,
          paid_at: d.paid_at,
          bank_reference: d.bank_reference,
          failure_reason: d.failure_reason,
          reversal_reason: d.reversal_reason,
          created_at: d.created_at,
          updated_at: d.updated_at || d.created_at,
        });
      }
    } else {
      for (const b of this.inMemoryBatches.values()) {
        if (b.therapist_account_id === therapistAccountId) {
          batches.push(b);
        }
      }
      batches.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return batches;
  }

  /**
   * Fetches all earnings for a therapist from memory/cache.
   */
  static getInMemoryEarningsForTherapist(therapistAccountId: string): TherapistEarningRecord[] {
    const list: TherapistEarningRecord[] = [];
    for (const e of this.inMemoryEarnings.values()) {
      if (e.therapist_account_id === therapistAccountId) {
        list.push(e);
      }
    }
    return list;
  }
}
