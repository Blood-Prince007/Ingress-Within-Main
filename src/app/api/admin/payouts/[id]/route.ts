import { NextRequest, NextResponse } from 'next/server';
import { TherapistPayoutService } from '../../../../../lib/therapist/therapistPayoutService';
import { supabase } from '../../../../../lib/db';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminAuthorization(request)) {
    return NextResponse.json(
      { error: { code: 'ADMIN_UNAUTHORIZED', message: 'Admin authorization required.' } },
      { status: 403 }
    );
  }

  const { id: batchId } = await params;

  try {
    const batch = await TherapistPayoutService.getPayoutBatchById(batchId);
    if (!batch) {
      return NextResponse.json(
        { error: { code: 'BATCH_NOT_FOUND', message: 'Payout batch not found.' } },
        { status: 404 }
      );
    }

    const { data: items } = await supabase
      .from('therapist_payout_batch_items')
      .select('*')
      .eq('payout_batch_id', batchId);

    return NextResponse.json({ success: true, batch, items: items || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'BATCH_QUERY_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminAuthorization(request)) {
    return NextResponse.json(
      { error: { code: 'ADMIN_UNAUTHORIZED', message: 'Admin authorization required.' } },
      { status: 403 }
    );
  }

  const { id: batchId } = await params;

  try {
    const body = await request.json();
    const { action, bank_reference, paid_at, reason } = body;

    let result;
    switch (action) {
      case 'start':
        result = await TherapistPayoutService.startPayoutBatch(batchId);
        break;
      case 'mark_paid':
        result = await TherapistPayoutService.markPayoutPaid(batchId, {
          bankReference: bank_reference,
          paidAt: paid_at,
        });
        break;
      case 'mark_failed':
        result = await TherapistPayoutService.markPayoutFailed(batchId, {
          reason,
        });
        break;
      case 'reverse':
        result = await TherapistPayoutService.reversePayout(batchId, {
          reason: reason || 'Administrative reversal',
        });
        break;
      default:
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_ACTION',
              message:
                "Invalid action. Expected 'start', 'mark_paid', 'mark_failed', or 'reverse'.",
            },
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Payout batch transitioned to ${result.status}.`,
      batch: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'TRANSITION_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
