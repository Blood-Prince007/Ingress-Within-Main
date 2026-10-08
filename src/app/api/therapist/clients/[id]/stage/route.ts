import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../../../lib/therapist/therapistPlatformService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { care_stage, status } = body;

    const validStages = new Set(['intake', 'active_care', 'maintenance', 'completed']);
    if (!care_stage || !validStages.has(care_stage)) {
      return NextResponse.json(
        { error: { code: 'INVALID_STAGE', message: 'Valid care_stage is required.' } },
        { status: 400 }
      );
    }

    const updated = await TherapistPlatformService.updateCareStage(
      account.id,
      id,
      care_stage,
      status
    );

    return NextResponse.json({ success: true, relationship: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'STAGE_UPDATE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
