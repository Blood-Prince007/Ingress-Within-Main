import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import {
  addTherapyMessage,
  getTherapyMessages,
  getTherapySession,
} from '../../../../lib/therapy/therapyService';

function invalidRequest(message: string) {
  return NextResponse.json(
    {
      error: {
        code: 'INVALID_REQUEST',
        message,
      },
    },
    { status: 400 }
  );
}

/**
 * GET /api/therapy/messages?therapySessionId=<id>
 *
 * Returns conversation messages for the authenticated user's own
 * Therapy session.
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

    const therapySessionId =
      request.nextUrl.searchParams.get('therapySessionId')?.trim() || '';

    if (!therapySessionId) {
      return invalidRequest('therapySessionId is required.');
    }

    const session = await getTherapySession(
      therapySessionId,
      authUser.userId
    );

    if (!session) {
      return NextResponse.json(
        {
          error: {
            code: 'THERAPY_SESSION_NOT_FOUND',
            message: 'Therapy session not found.',
          },
        },
        { status: 404 }
      );
    }

    const messages = await getTherapyMessages(
      therapySessionId,
      authUser.userId
    );

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('[Therapy Messages GET] Error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve Therapy messages.',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/therapy/messages
 *
 * Saves a user/assistant conversation message for the authenticated
 * user's own Therapy session.
 *
 * System messages are intentionally not accepted from the browser;
 * they should only be created by trusted server-side code.
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

    const body = await request.json();

    const therapySessionId =
      typeof body?.therapySessionId === 'string'
        ? body.therapySessionId.trim()
        : '';

    const content =
      typeof body?.content === 'string' ? body.content.trim() : '';

    const role = body?.role;

    if (!therapySessionId) {
      return invalidRequest('therapySessionId is required.');
    }

    if (role !== 'user' && role !== 'assistant') {
      return invalidRequest('role must be user or assistant.');
    }

    if (!content) {
      return invalidRequest('content is required.');
    }

    if (content.length > 20000) {
      return invalidRequest('content is too long.');
    }

    const session = await getTherapySession(
      therapySessionId,
      authUser.userId
    );

    if (!session) {
      return NextResponse.json(
        {
          error: {
            code: 'THERAPY_SESSION_NOT_FOUND',
            message: 'Therapy session not found.',
          },
        },
        { status: 404 }
      );
    }

    const metadata =
      body?.metadata &&
      typeof body.metadata === 'object' &&
      !Array.isArray(body.metadata)
        ? body.metadata
        : {};

    const message = await addTherapyMessage({
      therapySessionId,
      userId: authUser.userId,
      role,
      content,
      metadata,
    });

    return NextResponse.json(
      {
        success: true,
        message,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Therapy Messages POST] Error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to save Therapy message.',
        },
      },
      { status: 500 }
    );
  }
}
