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
    const { reason, notes } = body;

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'A specific operational rejection reason (minimum 5 characters) is required.',
          },
        },
        { status: 400 }
      );
    }

    const result = await AdminPlatformService.rejectApplication(
      applicationId,
      admin.adminId,
      reason.trim(),
      notes
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'REJECT_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
