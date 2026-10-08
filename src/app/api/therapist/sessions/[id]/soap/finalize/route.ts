import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../../../../lib/therapist/therapistPlatformService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const finalized = await TherapistPlatformService.finalizeSoapNote(account.id, id, {
      subjective: body.subjective,
      objective: body.objective,
      assessment: body.assessment,
      plan: body.plan,
    });

    return NextResponse.json({
      success: true,
      note: finalized,
      message: 'SOAP note finalized successfully.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'SOAP_FINALIZE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
