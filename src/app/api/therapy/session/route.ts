import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import {
  createTherapySession,
  getTherapySession,
  TherapyJourney,
} from '../../../../lib/therapy/therapyService';

const VALID_JOURNEYS: TherapyJourney[] = [
  'conversation',
  'guided',
  'team',
];

function isValidJourney(value: unknown): value is TherapyJourney {
  return (
    typeof value === 'string' &&
    VALID_JOURNEYS.includes(value as TherapyJourney)
  );
}

/**
 * POST /api/therapy/session
 *
 * Creates a new authenticated Therapy session.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Authentication is required.',
          },
        },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must contain valid JSON.',
          },
        },
        { status: 400 }
      );
    }

    const payload =
      body && typeof body === 'object'
        ? (body as Record<string, unknown>)
        : {};

    const journeyType = payload.journeyType;

    if (!isValidJourney(journeyType)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_JOURNEY',
            message:
              'journeyType must be one of: conversation, guided, team.',
          },
        },
        { status: 400 }
      );
    }

    const metadata =
      payload.metadata &&
      typeof payload.metadata === 'object' &&
      !Array.isArray(payload.metadata)
        ? (payload.metadata as Record<string, unknown>)
        : {};

    const session = await createTherapySession({
      userId: authUser.userId,
      journeyType,
      metadata,
    });

    return NextResponse.json(
      {
        success: true,
        session,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Therapy Session POST] Error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create Therapy session.',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/therapy/session?id=<sessionId>
 *
 * Returns a Therapy session only when it belongs to the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Authentication is required.',
          },
        },
        { status: 401 }
      );
    }

    const sessionId = request.nextUrl.searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json(
        {
          error: {
            code: 'SESSION_ID_REQUIRED',
            message: 'Therapy session id is required.',
          },
        },
        { status: 400 }
      );
    }

    const session = await getTherapySession(
      sessionId,
      authUser.userId
    );

    if (!session) {
      return NextResponse.json(
        {
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Therapy session was not found.',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('[Therapy Session GET] Error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve Therapy session.',
        },
      },
      { status: 500 }
    );
  }
}