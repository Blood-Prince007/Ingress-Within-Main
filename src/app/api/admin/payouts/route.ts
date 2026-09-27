import { NextRequest, NextResponse } from 'next/server';
import { TherapistPayoutService } from '../../../../lib/therapist/therapistPayoutService';
import { requireAuthorizedAdmin } from '../../../../lib/auth/adminAuthHelper';
import { AdminAuditService } from '../../../../lib/admin/adminAuditService';
import { supabase } from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    await requireAuthorizedAdmin(request);
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'ADMIN_UNAUTHORIZED', message: 'Admin authorization required.' } },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const therapistId = searchParams.get('therapist_account_id');

  try {
    let query = supabase
      .from('therapist_payout_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (therapistId) {
      query = query.eq('therapist_account_id', therapistId);
    }

    const { data, error } = await query;
    if (error && error.code !== 'PGRST205' && error.code !== '42P01') {
      throw error;
    }

    return NextResponse.json({ success: true, batches: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'PAYOUT_QUERY_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuthorizedAdmin(request);

    const body = await request.json();
    const { therapist_account_id, period_start, period_end } = body;

    if (!therapist_account_id || !period_start || !period_end) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'therapist_account_id, period_start, and period_end are required.',
          },
        },
        { status: 400 }
      );
    }

    const result = await TherapistPayoutService.createPayoutBatch({
      therapistAccountId: therapist_account_id,
      periodStart: period_start,
      periodEnd: period_end,
    });

    await AdminAuditService.logAction({
      actorId: admin.adminId,
      actorType: admin.actorType,
      action: 'payout_batch_created',
      entityType: 'payout_batch',
      entityId: result.batch.id,
      metadata: {
        therapist_account_id,
        period_start,
        period_end,
        total_net: result.batch.total_net,
        item_count: result.items.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payout batch created successfully.',
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'PAYOUT_CREATE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
