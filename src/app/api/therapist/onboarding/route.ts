import { NextRequest, NextResponse } from 'next/server';
import { requireTherapistApplicant } from '../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../lib/therapist/therapistPlatformService';

export async function GET(request: NextRequest) {
  try {
    const { account } = await requireTherapistApplicant(request);
    const data = await TherapistPlatformService.getOnboardingState(account.id);
    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'ONBOARDING_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
