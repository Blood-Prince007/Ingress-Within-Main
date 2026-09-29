import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';
import { getAuthenticatedTherapist } from '../../../../../lib/therapist/therapistAuthHelper';
import { GoogleAuthService } from '../../../../../lib/calendar/googleAuthService';

function getBaseOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const asTherapist = searchParams.get('type') === 'therapist';
    const returnTo = searchParams.get('returnTo') || (asTherapist ? '/therapist/calendar' : '/client/appointments');
    const acceptsJson = request.headers.get('accept')?.includes('application/json') || searchParams.get('format') === 'json';

    let accountType: 'user' | 'therapist' = 'user';
    let userId: string | undefined;
    let therapistAccountId: string | undefined;

    if (asTherapist) {
      const therapistAuth = await getAuthenticatedTherapist(request);
      if (!therapistAuth) {
        if (acceptsJson) {
          return NextResponse.json({ error: { code: 'AUTH_REQUIRED', message: 'Therapist authentication required.' } }, { status: 401 });
        }
        const base = getBaseOrigin(request);
        const loginUrl = new URL('/therapist/auth', base);
        loginUrl.searchParams.set('returnTo', returnTo);
        return NextResponse.redirect(loginUrl);
      }
      accountType = 'therapist';
      therapistAccountId = therapistAuth.therapistId;
    } else {
      const userAuth = await getAuthenticatedUser(request);
      if (!userAuth) {
        if (acceptsJson) {
          return NextResponse.json({ error: { code: 'AUTH_REQUIRED', message: 'User authentication required.' } }, { status: 401 });
        }
        const base = getBaseOrigin(request);
        const loginUrl = new URL('/auth', base);
        loginUrl.searchParams.set('returnTo', returnTo);
        return NextResponse.redirect(loginUrl);
      }
      accountType = 'user';
      userId = userAuth.userId;
    }

    const authUrl = await GoogleAuthService.getAuthUrl({
      accountType,
      userId,
      therapistAccountId,
      returnTo,
    });

    if (acceptsJson) {
      return NextResponse.json({ url: authUrl });
    }
    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    const acceptsJson = request.headers.get('accept')?.includes('application/json') || request.nextUrl.searchParams.get('format') === 'json';
    if (acceptsJson) {
      return NextResponse.json(
        { error: { code: 'OAUTH_INITIATE_FAILED', message: err.message || 'Failed to start Google OAuth flow' } },
        { status: 500 }
      );
    }
    const base = getBaseOrigin(request);
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(err.message || 'oauth_initiate_failed')}`, base));
  }
}
