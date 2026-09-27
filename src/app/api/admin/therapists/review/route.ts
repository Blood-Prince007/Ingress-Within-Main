import { NextRequest, NextResponse } from 'next/server';
import { TherapistPlatformService } from '../../../../../lib/therapist/therapistPlatformService';
import { requireAuthorizedAdmin } from '../../../../../lib/auth/adminAuthHelper';
import { AdminAuditService } from '../../../../../lib/admin/adminAuditService';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuthorizedAdmin(request);

    const body = await request.json().catch(() => ({}));
    const { therapist_account_id, decision, reviewer_notes } = body;

    if (!therapist_account_id) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'therapist_account_id is required.' } },
        { status: 400 }
      );
    }

    if (decision !== 'approved' && decision !== 'rejected') {
      return NextResponse.json(
        { error: { code: 'INVALID_DECISION', message: "decision must be 'approved' or 'rejected'." } },
        { status: 400 }
      );
    }

    const result = await TherapistPlatformService.adminReviewTherapist(
      therapist_account_id,
      decision,
      admin.adminId,
      reviewer_notes
    );

    // Record immutable admin audit log
    await AdminAuditService.logAction({
      actorId: admin.adminId,
      actorType: admin.actorType,
      action: decision === 'approved' ? 'therapist_approved' : 'therapist_rejected',
      entityType: 'therapist',
      entityId: therapist_account_id,
      metadata: {
        decision,
        reviewer_notes: reviewer_notes || null,
      },
    });

    return NextResponse.json({
      message: `Therapist application ${decision}.`,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'REVIEW_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
