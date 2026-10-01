import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedAdmin } from '../../../../../../../lib/auth/adminAuthHelper';
import { AdminPlatformService } from '../../../../../../../lib/admin/adminPlatformService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuthorizedAdmin(request);
    const resolvedParams = await params;
    const applicationId = resolvedParams.id;

    const body = await request.json().catch(() => ({}));
    const { documentPath } = body;

    if (!documentPath || typeof documentPath !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'documentPath is required.',
          },
        },
        { status: 400 }
      );
    }

    const result = await AdminPlatformService.generateDocumentSignedUrl({
      therapistAccountId: applicationId,
      documentPath,
      adminId: admin.adminId,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'SIGNED_URL_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
