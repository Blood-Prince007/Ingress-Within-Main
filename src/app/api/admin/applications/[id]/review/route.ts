import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedAdmin } from '../../../../../../lib/auth/adminAuthHelper';
import { AdminPlatformService } from '../../../../../../lib/admin/adminPlatformService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuthorizedAdmin(request);
    const resolvedParams = await params;
    const applicationId = resolvedParams.id;

    const body = await request.json().catch(() => ({}));
    const { decision, notes } = body;

    if (!decision || (decision !== 'approved' && decision !== 'rejected')) {
      return NextResponse.json(
        { error: { code: 'INVALID_DECISION', message: "decision must be 'approved' or 'rejected'." } },
        { status: 400 }
      );
    }

    const result = await AdminPlatformService.reviewApplication({
      therapistAccountId: applicationId,
      decision,
      adminId: admin.adminId,
      reviewerNotes: notes,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'REVIEW_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
