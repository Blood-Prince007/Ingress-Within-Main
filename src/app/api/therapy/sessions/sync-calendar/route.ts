import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';
import { getAuthenticatedTherapist } from '../../../../../lib/therapist/therapistAuthHelper';
import { SessionBookingService } from '../../../../../lib/therapy/sessionBookingService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { appointmentId } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: { code: 'INVALID_PARAMETERS', message: 'appointmentId is required.' } },
        { status: 400 }
      );
    }

    const therapistAuth = await getAuthenticatedTherapist(request);
    const userAuth = await getAuthenticatedUser(request);

    let caller: { accountType: 'user' | 'therapist'; accountId: string } | null = null;
    if (therapistAuth) {
      caller = { accountType: 'therapist', accountId: therapistAuth.therapistId };
    } else if (userAuth) {
      caller = { accountType: 'user', accountId: userAuth.userId };
    }

    if (!caller) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const result = await SessionBookingService.retryCalendarSync(appointmentId, caller);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'CALENDAR_SYNC_FAILED', message: err.message || 'Failed to retry calendar sync.' } },
      { status: err.status || 500 }
    );
  }
}
