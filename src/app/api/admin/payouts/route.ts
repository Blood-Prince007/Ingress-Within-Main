import { NextRequest, NextResponse } from 'next/server';
import { TherapistPayoutService } from '../../../../lib/therapist/therapistPayoutService';
import { supabase } from '../../../../lib/db';

function verifyAdminAuthorization(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization') || '';
  const adminKey = request.headers.get('x-admin-key') || '';
  const expectedAdminKey =
    process.env.ADMIN_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'iw_admin_dev_secret';

  return (
    adminKey === expectedAdminKey ||
    authHeader === `Bearer ${expectedAdminKey}` ||
    authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
  );
}

export async function GET(request: NextRequest) {
  if (!verifyAdminAuthorization(request)) {
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
  if (!verifyAdminAuthorization(request)) {
    return NextResponse.json(
      { error: { code: 'ADMIN_UNAUTHORIZED', message: 'Admin authorization required.' } },
      { status: 403 }
    );
  }

  try {
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
