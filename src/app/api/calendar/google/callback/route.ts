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
  const base = getBaseOrigin(request);
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.redirect(new URL('/?error=missing_oauth_params', base));
    }

    // Determine current caller session to enforce account binding
    const therapistAuth = await getAuthenticatedTherapist(request);
    const userAuth = await getAuthenticatedUser(request);

    let callerSession: { accountType: 'user' | 'therapist'; accountId: string } | undefined;
    if (therapistAuth) {
      callerSession = { accountType: 'therapist', accountId: therapistAuth.therapistId };
    } else if (userAuth) {
      callerSession = { accountType: 'user', accountId: userAuth.userId };
    } else {
      console.warn('[GoogleCallback] Unauthenticated callback attempt');
      return NextResponse.redirect(new URL('/?error=auth_required_for_calendar', base));
    }

    const result = await GoogleAuthService.handleOAuthCallback(code, state, callerSession);

    // Redirect to returned destination with success query param
    const destination = new URL(result.returnTo || '/', base);
    destination.searchParams.set('google_calendar_connected', 'true');

    return NextResponse.redirect(destination);
  } catch (err: any) {
    const errorCode = err.code || 'calendar_connection_failed';
    console.error(`[GoogleCallback] Error during OAuth callback: ${errorCode}`);
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(errorCode)}`, base));
  }
}
