import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { saveTherapySafety } from '../../../../lib/therapy/therapyService';

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

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid request body.',
          },
        },
        { status: 400 }
      );
    }

    const {
      therapySessionId,
      safetyStatus,
      triageLevel,
      recentTiming,
      planOrMeans,
      priorAttempt,
      physicalSafety,
      psychiatricCare,
      answers,
      evaluatedBy,
      evaluationMetadata,
    } = body;

    if (
      !therapySessionId ||
      typeof therapySessionId !== 'string'
    ) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_SESSION',
            message: 'therapySessionId is required.',
          },
        },
        { status: 400 }
      );
    }

    if (
      !safetyStatus ||
      ![
        'not_assessed',
        'negative',
        'positive',
        'declined',
      ].includes(safetyStatus)
    ) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_SAFETY_STATUS',
            message: 'Invalid safetyStatus.',
          },
        },
        { status: 400 }
      );
    }

    const safety = await saveTherapySafety({
      therapySessionId,
      userId: authUser.userId,
      safetyStatus,
      triageLevel: triageLevel ?? null,
      recentTiming: recentTiming ?? null,
      planOrMeans: planOrMeans ?? null,
      priorAttempt: priorAttempt ?? null,
      physicalSafety: physicalSafety ?? null,
      psychiatricCare: psychiatricCare ?? null,
      answers:
        answers && typeof answers === 'object'
          ? answers
          : {},
      evaluatedBy:
        evaluatedBy === 'deterministic' ||
        evaluatedBy === 'ai' ||
        evaluatedBy === 'hybrid' ||
        evaluatedBy === 'human'
          ? evaluatedBy
          : 'deterministic',
      evaluationMetadata:
        evaluationMetadata &&
        typeof evaluationMetadata === 'object'
          ? evaluationMetadata
          : {},
    });

    return NextResponse.json(
      {
        success: true,
        safety,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Therapy Safety POST] Error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to save Therapy safety assessment.',
        },
      },
      { status: 500 }
    );
  }
}