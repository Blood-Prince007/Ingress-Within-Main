import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../lib/therapist/therapistPlatformService';

export async function GET(request: NextRequest) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const clientId = searchParams.get('clientId') || undefined;
    const status = searchParams.get('status') || undefined;

    const appointments = await TherapistPlatformService.getAppointments(account.id, {
      startDate,
      endDate,
      clientId,
      status,
    });

    return NextResponse.json({ success: true, appointments });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'SESSIONS_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const body = await request.json().catch(() => ({}));
    const clientId = body.clientId || body.user_id;
    const startsAt = body.startsAt || body.scheduled_start;
    const endsAt = body.endsAt || body.scheduled_end;
    const sessionType = body.sessionType || body.session_type;
    const modality = body.modality;
    const meetingLink = body.meetingLink || body.meeting_link;
    const clientNotes = body.clientNotes || body.client_notes;

    if (!clientId || !startsAt || !endsAt) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'clientId (or user_id), startsAt, and endsAt are required.' } },
        { status: 400 }
      );
    }

    const appointment = await TherapistPlatformService.createAppointment(account.id, {
      clientId,
      userId: clientId,
      startsAt,
      scheduledStart: startsAt,
      endsAt,
      scheduledEnd: endsAt,
      sessionType,
      modality,
      meetingLink,
      clientNotes,
    });

    return NextResponse.json({ success: true, session: appointment, appointment }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'SESSION_CREATE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
