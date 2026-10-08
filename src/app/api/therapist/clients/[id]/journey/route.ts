import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../../../lib/therapist/therapistPlatformService';

/**
 * GET /api/therapist/clients/[id]/journey
 * Retrieves longitudinal Care Journey for an authorized client relationship.
 * Strict Tenancy: Ensures requested client is bound to authenticated therapist account.
 * Privacy Boundary: Zero access to client private journals, reflections, or self-work.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const { id } = await params;

    const journey = await TherapistPlatformService.getCareJourney(
      account.id,
      id
    );

    return NextResponse.json({ success: true, ...journey });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'JOURNEY_RETRIEVAL_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
