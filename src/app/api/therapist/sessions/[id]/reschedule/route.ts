import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../../../lib/therapist/therapistPlatformService';

async function handleReschedule(
  request: NextRequest,
  paramsPromise: Promise<{ id: string }>
) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const { id } = await paramsPromise;
    const body = await request.json().catch(() => ({}));
    const startsAt = body.startsAt || body.new_start;
    const endsAt = body.endsAt || body.new_end;
    const reason = body.reason;

    if (!startsAt || !endsAt) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'startsAt (or new_start) and endsAt (or new_end) are required.' } },
        { status: 400 }
      );
    }

    const updated = await TherapistPlatformService.rescheduleAppointment(
      account.id,
      id,
      startsAt,
      endsAt,
      reason
    );

    return NextResponse.json({ success: true, session: updated, appointment: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'RESCHEDULE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleReschedule(request, params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleReschedule(request, params);
}
