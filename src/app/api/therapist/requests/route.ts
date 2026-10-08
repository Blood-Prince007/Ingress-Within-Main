import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../lib/therapist/therapistPlatformService';

export async function GET(request: NextRequest) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const requests = await TherapistPlatformService.getAssignedRequests(account.id);
    return NextResponse.json({ success: true, requests });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'REQUESTS_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
