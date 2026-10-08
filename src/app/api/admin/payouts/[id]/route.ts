import { NextRequest, NextResponse } from 'next/server';
import { TherapistPayoutService } from '../../../../../lib/therapist/therapistPayoutService';
import { requireAuthorizedAdmin } from '../../../../../lib/auth/adminAuthHelper';
import { AdminAuditService } from '../../../../../lib/admin/adminAuditService';
import { supabase } from '../../../../../lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthorizedAdmin(request);
  } catch (err: any) {
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
  let admin;
  try {
    admin = await requireAuthorizedAdmin(request);
  } catch (err: any) {
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
    let auditAction = '';
    switch (action) {
      case 'start':
        result = await TherapistPayoutService.startPayoutBatch(batchId);
        auditAction = 'payout_started';
        break;
      case 'mark_paid':
        result = await TherapistPayoutService.markPayoutPaid(batchId, {
          bankReference: bank_reference,
          paidAt: paid_at,
        });
        auditAction = 'payout_paid';
        break;
      case 'mark_failed':
        result = await TherapistPayoutService.markPayoutFailed(batchId, {
          reason,
        });
        auditAction = 'payout_failed';
        break;
      case 'reverse':
        result = await TherapistPayoutService.reversePayout(batchId, {
          reason: reason || 'Administrative reversal',
        });
        auditAction = 'payout_reversed';
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

    await AdminAuditService.logAction({
      actorId: admin.adminId,
      actorType: admin.actorType,
      action: auditAction,
      entityType: 'payout_batch',
      entityId: batchId,
      metadata: {
        action,
        status: result.status,
        bank_reference: bank_reference || null,
        reason: reason || null,
      },
    });

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
