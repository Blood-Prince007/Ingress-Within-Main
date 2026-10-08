import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedAdmin } from '../../../../../lib/auth/adminAuthHelper';
import { AdminPlatformService } from '../../../../../lib/admin/adminPlatformService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthorizedAdmin(request);
    const resolvedParams = await params;
    const applicationId = resolvedParams.id;

    const detail = await AdminPlatformService.getApplicationDetail(applicationId);

    return NextResponse.json({
      success: true,
      application: detail,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'APPLICATION_DETAIL_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
