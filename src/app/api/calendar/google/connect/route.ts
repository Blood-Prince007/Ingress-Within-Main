import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';
import { getAuthenticatedTherapist } from '../../../../../lib/therapist/therapistAuthHelper';
import { GoogleAuthService } from '../../../../../lib/calendar/googleAuthService';
import { GoogleCalendarConfigService } from '../../../../../lib/calendar/googleCalendarConfig';

function getBaseOrigin(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
  }
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const proto = forwardedProto || (request.nextUrl.protocol ? request.nextUrl.protocol.replace(':', '') : (isLocal ? 'http' : 'https'));
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const asTherapist = searchParams.get('type') === 'therapist';
  const returnTo = searchParams.get('returnTo') || (asTherapist ? '/therapist/profile' : '/client/appointments');
  const isSimulate = searchParams.get('simulate') === 'true';

  // Check whether caller expects JSON or is doing a direct page navigation in the browser bar
  const isDocumentNavigation =
    request.headers.get('sec-fetch-dest') === 'document' ||
    (Boolean(request.headers.get('accept')?.includes('text/html')) &&
      !request.headers.get('accept')?.includes('application/json') &&
      searchParams.get('format') !== 'json');

  const returnsJson = !isDocumentNavigation || searchParams.get('format') === 'json';

  try {
    let accountType: 'user' | 'therapist' = 'user';
    let userId: string | undefined;
    let therapistAccountId: string | undefined;

    if (asTherapist) {
      const therapistAuth = await getAuthenticatedTherapist(request);
      if (!therapistAuth) {
        if (returnsJson) {
          return NextResponse.json(
            { error: { code: 'AUTH_REQUIRED', message: 'Therapist authentication required.' } },
            { status: 401 }
          );
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
        if (returnsJson) {
          return NextResponse.json(
            { error: { code: 'AUTH_REQUIRED', message: 'User authentication required.' } },
            { status: 401 }
          );
        }
        const base = getBaseOrigin(request);
        const loginUrl = new URL('/auth', base);
        loginUrl.searchParams.set('returnTo', returnTo);
        return NextResponse.redirect(loginUrl);
      }
      accountType = 'user';
      userId = userAuth.userId;
    }

    const currentAccountId = (accountType === 'therapist' ? therapistAccountId : userId)!;

    // Check if simulation requested (e.g. for development or testing)
    if (isSimulate) {
      const simResult = await GoogleAuthService.simulateConnection(accountType, currentAccountId);
      if (returnsJson) {
        return NextResponse.json({
          success: true,
          simulated: true,
          googleEmail: simResult.googleEmail,
          message: 'Simulated Google Calendar connected successfully.',
        });
      }
      const base = getBaseOrigin(request);
      const dest = new URL(returnTo, base);
      dest.searchParams.set('google_calendar_connected', 'true');
      return NextResponse.redirect(dest);
    }

    // Check configuration
    const config = GoogleCalendarConfigService.getConfig();
    if (!config.isConfigured) {
      const isDev = process.env.NODE_ENV !== 'production';
      const msg = isDev
        ? 'Google Calendar credentials are not configured in .env. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or use simulated mode for development.'
        : 'Google Calendar integration is temporarily unavailable. Please try again later.';

      if (returnsJson) {
        return NextResponse.json(
          {
            error: {
              code: 'GOOGLE_CALENDAR_NOT_CONFIGURED',
              message: msg,
            },
            isConfigured: false,
            canSimulate: isDev,
          },
          { status: 503 }
        );
      }
      const base = getBaseOrigin(request);
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent('google_calendar_not_configured')}`, base)
      );
    }

    const authUrl = await GoogleAuthService.getAuthUrl({
      accountType,
      userId,
      therapistAccountId,
      returnTo,
    });

    if (returnsJson) {
      return NextResponse.json({ url: authUrl });
    }
    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    if (returnsJson) {
      return NextResponse.json(
        {
          error: {
            code: err.code || 'OAUTH_INITIATE_FAILED',
            message: err.message || 'Failed to start Google OAuth flow',
          },
        },
        { status: err.status || 500 }
      );
    }
    const base = getBaseOrigin(request);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(err.message || 'oauth_initiate_failed')}`, base)
    );
  }
}

