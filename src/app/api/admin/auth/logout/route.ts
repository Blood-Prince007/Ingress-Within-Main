import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedAdmin } from '../../../../../lib/auth/adminAuthHelper';
import { AdminAuthService } from '../../../../../lib/admin/adminAuthService';
import { COOKIE_ADMIN_ACCESS_NAME, COOKIE_ADMIN_REFRESH_NAME } from '../../../../../utils/cookies';

export async function POST(request: NextRequest) {
  try {
    try {
      const admin = await requireAuthorizedAdmin(request);
      await AdminAuthService.logout(admin.adminId);
    } catch {
      // Clear cookie even if session already expired
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully.',
    });

    response.cookies.delete(COOKIE_ADMIN_ACCESS_NAME);
    response.cookies.delete(COOKIE_ADMIN_REFRESH_NAME);

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'LOGOUT_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
