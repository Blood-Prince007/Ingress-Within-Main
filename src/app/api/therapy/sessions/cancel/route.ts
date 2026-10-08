import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';
import { getAuthenticatedTherapist } from '../../../../../lib/therapist/therapistAuthHelper';
import { SessionBookingService } from '../../../../../lib/therapy/sessionBookingService';

export async function POST(request: NextRequest) {
  try {
    const userAuth = await getAuthenticatedUser(request);
    const therapistAuth = await getAuthenticatedTherapist(request);

    if (!userAuth && !therapistAuth) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required to cancel session.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { appointmentId, reason } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: { code: 'INVALID_PARAMETERS', message: 'appointmentId is required.' } },
        { status: 400 }
      );
    }

    const cancelledBy = therapistAuth ? 'therapist' : 'client';
    const userId = userAuth?.userId;
    const therapistAccountId = therapistAuth?.therapistId;

    const result = await SessionBookingService.cancelSession({
      appointmentId,
      cancelledBy,
      userId,
      therapistAccountId,
      reason,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      {
        error: {
          code: err.code || 'CANCEL_FAILED',
          message: err.message || 'Failed to cancel session.',
        },
      },
      { status }
    );
  }
}
