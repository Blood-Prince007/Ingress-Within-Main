import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../../../../lib/auth/adminAuthHelper';
import { AdminPlatformService } from '../../../../../../lib/admin/adminPlatformService';
import { AdminStatus } from '../../../../../../lib/admin/adminAuthService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin(request);
    const resolvedParams = await params;
    const targetAdminId = resolvedParams.id;

    const body = await request.json().catch(() => ({}));
    const { status } = body;

    if (!status || (status !== 'active' && status !== 'suspended' && status !== 'deactivated')) {
      return NextResponse.json(
        { error: { code: 'INVALID_STATUS', message: "status must be 'active', 'suspended', or 'deactivated'." } },
        { status: 400 }
      );
    }

    const result = await AdminPlatformService.updateAdminStatus(
      targetAdminId,
      status as AdminStatus,
      admin.adminId
    );

    return NextResponse.json({
      message: `Admin account status updated to ${status}.`,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'ADMIN_UPDATE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
