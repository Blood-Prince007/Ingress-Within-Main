import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedAdmin } from '../../../../../lib/auth/adminAuthHelper';
import { AdminAnalyticsService } from '../../../../../lib/admin/adminAnalyticsService';

export async function GET(request: NextRequest) {
  try {
    await requireAuthorizedAdmin(request);

    const range = request.nextUrl.searchParams.get('range') || '30d';
    const startDate = request.nextUrl.searchParams.get('startDate');
    const endDate = request.nextUrl.searchParams.get('endDate');

    const boundary = AdminAnalyticsService.parseTimeRange(range, startDate, endDate);
    const data = await AdminAnalyticsService.getRevenueConversionAnalytics();

    return NextResponse.json({
      success: true,
      data,
      boundary: {
        range: boundary.range,
        startDate: boundary.startDate.toISOString(),
        endDate: boundary.endDate.toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'ANALYTICS_REVENUE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
