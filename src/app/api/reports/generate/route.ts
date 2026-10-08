import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { AccessControlService, AccessDeniedError } from '../../../../lib/billing/accessControlService';

/**
 * POST /api/reports/generate: Triggers on-demand report generation.
 * WRITE / GENERATE — requires active self-help subscription.
 * Returns 403 SELF_HELP_SUBSCRIPTION_REQUIRED for dormant users.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    // Access control: Require report generation capability
    await AccessControlService.requireReportGenerateAccess(authUser.userId);

    const body = await request.json().catch(() => ({}));
    const { cycleId, weekNumber } = body;

    // Trigger report generation / backfill
    const { backfillWeeklyReports } = await import('../../../../lib/weeklyReportBackfill');
    const result = await backfillWeeklyReports(authUser.userId);

    return NextResponse.json({
      success: true,
      message: 'Report generation triggered successfully.',
      result
    });
  } catch (error: any) {
    if (error instanceof AccessDeniedError || error.code === 'SUBSCRIPTION_REQUIRED' || error.code === 'SELF_HELP_SUBSCRIPTION_REQUIRED') {
      return NextResponse.json(
        {
          error: {
            code: 'SELF_HELP_SUBSCRIPTION_REQUIRED',
            message: error.message || 'An active self-help subscription is required to generate new reports.',
            state: error.state || 'DORMANT'
          }
        },
        { status: error.statusCode || 403 }
      );
    }

    console.error('[POST /api/reports/generate] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
