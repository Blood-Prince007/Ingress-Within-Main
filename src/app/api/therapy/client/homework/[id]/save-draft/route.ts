import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../../../lib/auth-helper';
import { ClientHomeworkService } from '../../../../../../../lib/therapy/clientHomeworkService';

export async function POST(
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
    const body = await request.json().catch(() => ({}));

    const content = body.content !== undefined ? body.content : (body.responseContent ?? '');
    const metadata = body.metadata || body.responseMetadata || {};

    const result = await ClientHomeworkService.saveDraftResponse(authUser.userId, id, content, metadata);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'DRAFT_SAVE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
