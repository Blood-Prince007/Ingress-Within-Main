import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
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
  let returnTo = '/';

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const googleError = searchParams.get('error');

    // Attempt to resolve initiating return_to destination early from state record
    if (state && typeof state === 'string' && state.length >= 32) {
      try {
        const stateHash = crypto.createHash('sha256').update(state).digest('hex');
        const stateRecord = await GoogleAuthService.getStateRecordByHash(stateHash);
        if (stateRecord?.return_to) {
          returnTo = stateRecord.return_to;
        } else if (stateRecord?.account_type === 'therapist') {
          returnTo = '/therapist/calendar';
        } else if (stateRecord?.account_type === 'user') {
          returnTo = '/client/appointments';
        }
      } catch {
        // Non-blocking fallback
      }
    }

    // Handle explicit errors returned from Google OAuth consent (e.g. access_denied)
    if (googleError) {
      console.warn(`[GoogleCallback] Google OAuth returned error: ${googleError}`);
      const errDestination = new URL(returnTo, base);
      errDestination.searchParams.set('error', googleError);
      return NextResponse.redirect(errDestination);
    }

    if (!code || !state) {
      const errDestination = new URL(returnTo, base);
      errDestination.searchParams.set('error', 'missing_oauth_params');
      return NextResponse.redirect(errDestination);
    }

    // Determine current caller session to enforce account binding if cookie is provided
    const therapistAuth = await getAuthenticatedTherapist(request);
    const userAuth = await getAuthenticatedUser(request);

    let callerSession: { accountType: 'user' | 'therapist'; accountId: string } | undefined;
    if (therapistAuth) {
      callerSession = { accountType: 'therapist', accountId: therapistAuth.therapistId };
    } else if (userAuth) {
      callerSession = { accountType: 'user', accountId: userAuth.userId };
    }

    // If caller session cookie is not sent due to cross-site SameSite browser policy,
    // callerSession remains undefined. GoogleAuthService safely validates and consumes
    // the single-use, 256-bit cryptographically secure server-side state token bound
    // to the verified account when /connect was called.
    const result = await GoogleAuthService.handleOAuthCallback(code, state, callerSession);

    // Redirect to returned destination with success query param
    const destination = new URL(result.returnTo || returnTo || '/', base);
    destination.searchParams.set('google_calendar_connected', 'true');

    return NextResponse.redirect(destination);
  } catch (err: any) {
    const errorCode = err.code || 'calendar_connection_failed';
    console.error(`[GoogleCallback] Error during OAuth callback: ${errorCode}`, err);
    const errDestination = new URL(returnTo, base);
    errDestination.searchParams.set('error', encodeURIComponent(errorCode));
    return NextResponse.redirect(errDestination);
  }
}

