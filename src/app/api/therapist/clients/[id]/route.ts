import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../../lib/therapist/therapistPlatformService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const { id } = await params;

    const profile = await TherapistPlatformService.getClientClinicalProfile(
      account.id,
      id
    );

    return NextResponse.json({ success: true, ...profile });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'CLIENT_PROFILE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
