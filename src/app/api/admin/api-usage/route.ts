import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedAdmin } from '../../../../lib/auth/adminAuthHelper';
import { ApiUsageService } from '../../../../lib/admin/apiUsageService';

export async function GET(request: NextRequest) {
  try {
    await requireAuthorizedAdmin(request);

    const summaries = await ApiUsageService.getUsageSummary();
    const recentEvents = await ApiUsageService.getRecentEvents(50);

    return NextResponse.json({
      success: true,
      summaries,
      recentEvents,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'API_USAGE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
