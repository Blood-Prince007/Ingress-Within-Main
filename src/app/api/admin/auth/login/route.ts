import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '../../../../../lib/admin/adminAuthService';
import { COOKIE_ADMIN_ACCESS_NAME, COOKIE_ADMIN_REFRESH_NAME, getCookieOptions } from '../../../../../utils/cookies';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, deviceId } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Email and password are required.' } },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;
    const effectiveDeviceId = deviceId || `adm_dev_${Date.now()}`;

    const result = await AdminAuthService.login({
      email,
      password,
      deviceId: effectiveDeviceId,
      ipAddress,
      userAgent,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Admin authentication successful.',
      admin: result.admin,
      expiresIn: result.expiresIn,
    });

    // Set secure HttpOnly cookies
    response.cookies.set(COOKIE_ADMIN_ACCESS_NAME, result.accessToken, getCookieOptions(result.expiresIn));
    response.cookies.set(COOKIE_ADMIN_REFRESH_NAME, result.refreshToken, getCookieOptions(7 * 24 * 60 * 60));

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'LOGIN_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
