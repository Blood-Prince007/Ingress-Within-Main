import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedAdmin } from '../../../../lib/auth/adminAuthHelper';
import { AdminPlatformService } from '../../../../lib/admin/adminPlatformService';

export async function GET(request: NextRequest) {
  try {
    await requireAuthorizedAdmin(request);

    const status = request.nextUrl.searchParams.get('status') || 'pending';
    const applications = await AdminPlatformService.getApplications(status);

    return NextResponse.json({
      success: true,
      applications,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'APPLICATIONS_QUERY_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
