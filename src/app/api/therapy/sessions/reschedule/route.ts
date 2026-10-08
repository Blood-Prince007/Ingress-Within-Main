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
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required to reschedule session.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { appointmentId, newStart, newEnd, reason } = body;

    if (!appointmentId || !newStart || !newEnd) {
      return NextResponse.json(
        { error: { code: 'INVALID_PARAMETERS', message: 'appointmentId, newStart, and newEnd are required.' } },
        { status: 400 }
      );
    }

    const requestedBy = therapistAuth ? 'therapist' : 'client';
    const userId = userAuth?.userId;
    const therapistAccountId = therapistAuth?.therapistId;

    const rescheduled = await SessionBookingService.rescheduleSession({
      appointmentId,
      newStart,
      newEnd,
      requestedBy,
      userId,
      therapistAccountId,
      reason,
    });

    return NextResponse.json({
      success: true,
      appointment: rescheduled,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      {
        error: {
          code: err.code || 'RESCHEDULE_FAILED',
          message: err.message || 'Failed to reschedule session.',
        },
      },
      { status }
    );
  }
}
