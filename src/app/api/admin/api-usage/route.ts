import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedAdmin } from '../../../../lib/auth/adminAuthHelper';
import { ApiUsageService } from '../../../../lib/admin/apiUsageService';

export async function GET(request: NextRequest) {
  try {
    // 1. Strict Super Admin / Admin Authentication Guard
    await requireAuthorizedAdmin(request);

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '24h';
    const provider = searchParams.get('provider') || 'all';

    // 3. Compute timeframe lower bound
    const now = new Date();
    let startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    let bucketMinutes = 60;

    if (range === '1h') {
      startDate = new Date(now.getTime() - 60 * 60 * 1000);
      bucketMinutes = 5;
    } else if (range === '24h') {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      bucketMinutes = 60;
    } else if (range === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      bucketMinutes = 240; // 4 hours
    } else if (range === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      bucketMinutes = 1440; // 1 day
    }

    // 4. Fetch metrics concurrently
    const [
      overview,
      timeSeries,
      topEndpoints,
      providerSummaries,
      aiOperations,
      recentEvents,
    ] = await Promise.all([
      ApiUsageService.getOverviewMetrics(startDate),
      ApiUsageService.getTimeSeries(startDate, bucketMinutes),
      ApiUsageService.getEndpointMetrics(startDate),
      ApiUsageService.getUsageSummary(startDate),
      ApiUsageService.getAIOperationMetrics(startDate),
      ApiUsageService.getRecentEvents(50, provider),
    ]);

    return NextResponse.json({
      success: true,
      timeframe: {
        range,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        bucketMinutes,
      },
      overview,
      timeSeries,
      topEndpoints,
      providerSummaries,
      aiOperations,
      recentEvents,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'API_USAGE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
