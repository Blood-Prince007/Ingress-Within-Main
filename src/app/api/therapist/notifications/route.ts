import { NextRequest, NextResponse } from 'next/server';
import { requireTherapistProfile } from '../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../lib/therapist/therapistPlatformService';

export async function GET(request: NextRequest) {
  try {
    const { account } = await requireTherapistProfile(request);
    const notifications = await TherapistPlatformService.getNotifications(account.id);
    return NextResponse.json({ success: true, notifications });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'NOTIFICATIONS_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
