import { NextRequest, NextResponse } from 'next/server';
import { TherapistPayoutService } from '../../../../lib/therapist/therapistPayoutService';
import { requireAuthorizedAdmin } from '../../../../lib/auth/adminAuthHelper';
import { AdminAuditService } from '../../../../lib/admin/adminAuditService';
import { AdminPlatformService } from '../../../../lib/admin/adminPlatformService';
import { supabase } from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    await requireAuthorizedAdmin(request);

    const { searchParams } = new URL(request.url);
    const therapistId = searchParams.get('therapist_account_id');
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // 1. Fetch batches
    let query = supabase
      .from('therapist_payout_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (therapistId) {
      query = query.eq('therapist_account_id', therapistId);
    }

    const { data: batches } = await query;

    // 2. Fetch withdrawal requests via AdminPlatformService
    const withdrawalsResult = await AdminPlatformService.getPayouts({
      page,
      limit,
      status,
    });

    return NextResponse.json({
      success: true,
      batches: batches || [],
      ...withdrawalsResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'PAYOUT_QUERY_ERROR', message: err.message } },
      { status: err.status || 500 }
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
