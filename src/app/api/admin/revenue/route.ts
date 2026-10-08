import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedAdmin } from '../../../../lib/auth/adminAuthHelper';
import { AdminPlatformService } from '../../../../lib/admin/adminPlatformService';

export async function GET(request: NextRequest) {
  try {
    await requireAuthorizedAdmin(request);

    const range = request.nextUrl.searchParams.get('range') || '30d';
    const analytics = await AdminPlatformService.getRevenueAnalytics(range);

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'REVENUE_QUERY_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
