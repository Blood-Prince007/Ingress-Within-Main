import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedAdmin } from '../../../../lib/auth/adminAuthHelper';
import { AdminPlatformService } from '../../../../lib/admin/adminPlatformService';

export async function GET(request: NextRequest) {
  try {
    await requireAuthorizedAdmin(request);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || undefined;

    const result = await AdminPlatformService.getApplications({
      status,
      page,
      limit,
      search,
    });

    return NextResponse.json({
      success: true,
      applications: (result as any).applications || result,
      pagination: (result as any).pagination,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'APPLICATIONS_QUERY_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
