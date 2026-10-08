import { NextRequest, NextResponse } from 'next/server';
import { requireTherapistApplicant } from '../../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../../lib/therapist/therapistPlatformService';

export async function POST(request: NextRequest) {
  try {
    const { account } = await requireTherapistApplicant(request);
    const body = await request.json().catch(() => ({}));
    const { answers, documents } = body;

    const result = await TherapistPlatformService.submitApplication(account.id, answers || {}, Array.isArray(documents) ? documents : []);

    return NextResponse.json({
      message: 'Application submitted successfully for clinical review.',
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'SUBMIT_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
