import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../../../lib/therapist/therapistPlatformService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    const cancelled = await TherapistPlatformService.cancelAppointment(
      account.id,
      id,
      reason
    );

    return NextResponse.json({ success: true, session: cancelled, appointment: cancelled });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'CANCEL_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
