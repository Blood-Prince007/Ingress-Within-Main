import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { getClientConnectedTherapist } from '../../../../lib/therapy/therapyService';

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

    const connectedTherapist = await getClientConnectedTherapist(authUser.userId);

    return NextResponse.json({
      success: true,
      connected: Boolean(connectedTherapist),
      connection: connectedTherapist,
    });
  } catch (error: any) {
    console.error('[Therapy Connection GET] Error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve therapy connection status.',
        },
      },
      { status: 500 }
    );
  }
}
