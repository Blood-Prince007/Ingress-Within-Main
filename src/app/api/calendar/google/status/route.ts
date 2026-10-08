import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';
import { getAuthenticatedTherapist } from '../../../../../lib/therapist/therapistAuthHelper';
import { GoogleAuthService } from '../../../../../lib/calendar/googleAuthService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const asTherapist = searchParams.get('type') === 'therapist';

    let accountType: 'user' | 'therapist' = 'user';
    let accountId = '';

    if (asTherapist) {
      const therapistAuth = await getAuthenticatedTherapist(request);
      if (!therapistAuth) {
        return NextResponse.json({ error: { code: 'AUTH_REQUIRED', message: 'Therapist authentication required.' } }, { status: 401 });
      }
      accountType = 'therapist';
      accountId = therapistAuth.therapistId;
    } else {
      const userAuth = await getAuthenticatedUser(request);
      if (!userAuth) {
        return NextResponse.json({ error: { code: 'AUTH_REQUIRED', message: 'User authentication required.' } }, { status: 401 });
      }
      accountType = 'user';
      accountId = userAuth.userId;
    }

    const status = await GoogleAuthService.getConnectionStatus(accountType, accountId);
    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'STATUS_CHECK_FAILED', message: err.message || 'Failed to check connection status' } },
      { status: 500 }
    );
  }
}
