import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../../../../lib/therapist/therapistPlatformService';

/**
 * PATCH /api/therapist/clients/[id]/journey/stage
 * Atomically transitions care stage with append-only history audit.
 * Enforces canonical state machine:
 *   intake -> active_care | completed
 *   active_care -> maintenance | completed
 *   maintenance -> active_care | completed
 *   completed -> terminal state
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const careStage = body.careStage || body.care_stage;
    const reason = body.reason;

    const validStages = new Set(['intake', 'active_care', 'maintenance', 'completed']);
    if (!careStage || !validStages.has(careStage)) {
      return NextResponse.json(
        { error: { code: 'INVALID_CARE_STAGE', message: 'Valid careStage is required (intake, active_care, maintenance, completed).' } },
        { status: 400 }
      );
    }

    const result = await TherapistPlatformService.transitionCareStage(
      account.id,
      id,
      careStage,
      reason
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'CARE_STAGE_TRANSITION_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
