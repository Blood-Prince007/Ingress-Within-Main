import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedTherapist } from '../../../../../../lib/therapist/therapistAuthHelper';
import { SessionBookingService } from '../../../../../../lib/therapy/sessionBookingService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const therapistAuth = await getAuthenticatedTherapist(request);
    if (!therapistAuth) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Therapist authentication required.' } },
        { status: 401 }
      );
    }

    const { id: appointmentId } = await params;
    const body = await request.json();
    const { attendanceStatus, notes } = body;

    if (!attendanceStatus || !['client_no_show', 'therapist_no_show', 'attended'].includes(attendanceStatus)) {
      return NextResponse.json(
        { error: { code: 'INVALID_PARAMETERS', message: 'Valid attendanceStatus (client_no_show, therapist_no_show, attended) is required.' } },
        { status: 400 }
      );
    }

    const updated = await SessionBookingService.recordAttendanceStatus({
      appointmentId,
      therapistAccountId: therapistAuth.therapistId,
      attendanceStatus,
      notes,
    });

    return NextResponse.json({
      success: true,
      appointment: updated,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      {
        error: {
          code: err.code || 'ATTENDANCE_UPDATE_FAILED',
          message: err.message || 'Failed to update appointment attendance status.',
        },
      },
      { status }
    );
  }
}
