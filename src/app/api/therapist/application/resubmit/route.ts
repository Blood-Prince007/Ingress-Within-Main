import { NextRequest, NextResponse } from 'next/server';
import { requireTherapistApplicant } from '../../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../../lib/therapist/therapistPlatformService';

export async function POST(request: NextRequest) {
  try {
    const { account } = await requireTherapistApplicant(request);

    const body = await request.json().catch(() => ({}));
    const answers = body?.answers || {};
    const documents = body?.documents || [];

    const result = await TherapistPlatformService.resubmitApplication(account.id, answers, documents);

    return NextResponse.json({
      message: 'Application resubmitted successfully for clinical review.',
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'RESUBMIT_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
