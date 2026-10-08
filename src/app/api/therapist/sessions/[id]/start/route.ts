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

    const started = await TherapistPlatformService.startAppointment(
      account.id,
      id
    );

    return NextResponse.json({
      success: true,
      session: started,
      appointment: started,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'START_SESSION_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
