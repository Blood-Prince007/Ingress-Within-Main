import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../../lib/therapist/therapistPlatformService';

export async function POST(request: NextRequest) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const body = await request.json().catch(() => ({}));
    const { blocks } = body;

    if (!Array.isArray(blocks)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'blocks array is required.' } },
        { status: 400 }
      );
    }

    const saved = await TherapistPlatformService.saveAvailabilityBlocks(
      account.id,
      blocks
    );

    return NextResponse.json({ success: true, blocks: saved });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'AVAILABILITY_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
