import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import {
  getTherapySession,
  saveTherapyIntake,
} from '../../../../lib/therapy/therapyService';

function badRequest(message: string) {
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
 * POST /api/therapy/intake
 *
 * Saves the structured Therapy intake for the authenticated user's
 * Therapy session. The session ownership is checked server-side.
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

    if (!therapySessionId) {
      return badRequest('therapySessionId is required.');
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

    const intake = await saveTherapyIntake({
      therapySessionId,
      userId: authUser.userId,
      fullName:
        typeof body.fullName === 'string' ? body.fullName.trim() : null,
      email:
        typeof body.email === 'string' ? body.email.trim() : null,
      phoneNumber:
        typeof body.phoneNumber === 'string'
          ? body.phoneNumber.trim()
          : null,
      age:
        typeof body.age === 'number' && Number.isFinite(body.age)
          ? body.age
          : null,
      gender:
        typeof body.gender === 'string' ? body.gender.trim() : null,
      occupation:
        typeof body.occupation === 'string'
          ? body.occupation.trim()
          : null,
      city:
        typeof body.city === 'string' ? body.city.trim() : null,
      livingSituation:
        typeof body.livingSituation === 'string'
          ? body.livingSituation.trim()
          : null,
      presentingReason:
        typeof body.presentingReason === 'string'
          ? body.presentingReason.trim()
          : null,
      concerns: Array.isArray(body.concerns) ? body.concerns : [],
      affectedLifeAreas: Array.isArray(body.affectedLifeAreas)
        ? body.affectedLifeAreas
        : [],
      ownWords:
        typeof body.ownWords === 'string' ? body.ownWords.trim() : null,
      mentalHealthHistory:
        body.mentalHealthHistory &&
        typeof body.mentalHealthHistory === 'object' &&
        !Array.isArray(body.mentalHealthHistory)
          ? body.mentalHealthHistory
          : {},
      copingAndSupport:
        body.copingAndSupport &&
        typeof body.copingAndSupport === 'object' &&
        !Array.isArray(body.copingAndSupport)
          ? body.copingAndSupport
          : {},
      expectations:
        body.expectations &&
        typeof body.expectations === 'object' &&
        !Array.isArray(body.expectations)
          ? body.expectations
          : {},
      contactPreferences:
        body.contactPreferences &&
        typeof body.contactPreferences === 'object' &&
        !Array.isArray(body.contactPreferences)
          ? body.contactPreferences
          : {},
      consents:
        body.consents &&
        typeof body.consents === 'object' &&
        !Array.isArray(body.consents)
          ? body.consents
          : {},
      answers:
        body.answers &&
        typeof body.answers === 'object' &&
        !Array.isArray(body.answers)
          ? body.answers
          : {},
    });

    return NextResponse.json({
      success: true,
      intake,
    });
  } catch (error) {
    console.error('[Therapy Intake POST] Error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to save Therapy intake.',
        },
      },
      { status: 500 }
    );
  }
}
