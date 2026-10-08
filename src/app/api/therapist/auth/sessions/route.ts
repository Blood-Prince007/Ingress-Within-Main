import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedTherapist } from '../../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../../lib/therapist/therapistPlatformService';

/**
 * Lists active sessions for the authenticated therapist.
 */
export async function GET(request: NextRequest) {
  try {
    const authTherapist = await requireAuthenticatedTherapist(request);
    const sessions = await TherapistPlatformService.getActiveSessions(
      authTherapist.therapistId,
      authTherapist.deviceId
    );

    return NextResponse.json({
      success: true,
      sessions,
      currentDeviceId: authTherapist.deviceId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'SESSIONS_FETCH_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}

/**
 * Revokes a session or all other sessions.
 */
export async function POST(request: NextRequest) {
  try {
    const authTherapist = await requireAuthenticatedTherapist(request);
    const body = await request.json().catch(() => ({}));
    const { deviceId, revokeAllOther } = body;

    if (revokeAllOther) {
      const result = await TherapistPlatformService.revokeOtherSessions(
        authTherapist.therapistId,
        authTherapist.deviceId
      );
      return NextResponse.json({
        message: 'All other sessions have been signed out.',
        ...result,
      });
    }

    if (!deviceId) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'deviceId is required to revoke a specific session.' } },
        { status: 400 }
      );
    }

    // Do not allow revoking current session via this route; use logout instead
    if (deviceId === authTherapist.deviceId) {
      return NextResponse.json(
        { error: { code: 'CANNOT_REVOKE_CURRENT', message: 'To sign out of your current session, please use Sign Out.' } },
        { status: 400 }
      );
    }

    const result = await TherapistPlatformService.revokeSession(
      authTherapist.therapistId,
      deviceId
    );

    return NextResponse.json({
      message: 'Session revoked successfully.',
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'SESSION_REVOKE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
