import { NextRequest, NextResponse } from 'next/server';
import { requireTherapistApplicant } from '../../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../../lib/therapist/therapistPlatformService';

export async function POST(request: NextRequest) {
  try {
    const { account } = await requireTherapistApplicant(request);
    const body = await request.json().catch(() => ({}));
    const { step, answers, documents } = body;

    const saved = await TherapistPlatformService.saveOnboardingDraft(
      account.id,
      Number(step) || 1,
      answers || {},
      documents || []
    );

    return NextResponse.json({ success: true, application: saved });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'SAVE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
