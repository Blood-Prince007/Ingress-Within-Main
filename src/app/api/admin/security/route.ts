import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedAdmin } from '../../../../lib/auth/adminAuthHelper';
import { AdminPlatformService } from '../../../../lib/admin/adminPlatformService';
import { AdminAuthService } from '../../../../lib/admin/adminAuthService';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAuthorizedAdmin(request);

    const admins = await AdminPlatformService.getAdminAccounts();
    const sessions = await AdminAuthService.getActiveSessions(admin.adminId);

    return NextResponse.json({
      success: true,
      provisioningNotice: 'Administrators are provisioned through secure backend database operations.',
      admins,
      currentSessions: sessions,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'SECURITY_QUERY_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
