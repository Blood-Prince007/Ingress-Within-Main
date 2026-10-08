import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../lib/therapist/therapistPlatformService';

export async function GET(request: NextRequest) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const search = request.nextUrl.searchParams.get('search') || undefined;
    const clients = await TherapistPlatformService.getAuthorizedClients(account.id, search);
    return NextResponse.json({ success: true, clients });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'CLIENTS_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
