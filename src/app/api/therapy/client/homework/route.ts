import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';
import { ClientHomeworkService } from '../../../../../lib/therapy/clientHomeworkService';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const assignments = await ClientHomeworkService.getClientAssignments(authUser.userId, {
      status,
    });

    return NextResponse.json({ success: true, assignments });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'CLIENT_HOMEWORK_FETCH_ERROR', message: err.message || 'Failed to fetch homework' } },
      { status: 500 }
    );
  }
}
