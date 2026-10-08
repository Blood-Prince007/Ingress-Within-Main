import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../../lib/auth-helper';
import { ClientHomeworkService } from '../../../../../../lib/therapy/clientHomeworkService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const assignment = await ClientHomeworkService.getClientAssignmentById(authUser.userId, id);

    return NextResponse.json({ success: true, assignment });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'CLIENT_HOMEWORK_FETCH_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
