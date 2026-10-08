import { NextRequest, NextResponse } from 'next/server';
import { requireTherapistProfile } from '../../../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../../../lib/therapist/therapistPlatformService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { account } = await requireTherapistProfile(request);
    const { id } = await params;

    await TherapistPlatformService.markNotificationRead(account.id, id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'NOTIFICATION_READ_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
