import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedAdmin } from '../../../../lib/auth/adminAuthHelper';
import { AdminPlatformService } from '../../../../lib/admin/adminPlatformService';

export async function GET(request: NextRequest) {
  try {
    await requireAuthorizedAdmin(request);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    const result = await AdminPlatformService.getTherapists({
      page,
      limit,
      search,
      status,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'THERAPISTS_QUERY_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
