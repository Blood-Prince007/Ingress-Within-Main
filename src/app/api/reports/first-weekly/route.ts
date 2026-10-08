import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

/**
 * GET /api/reports/first-weekly: Fetches the first weekly report for the user.
 * PERMANENT FREE ENTITLEMENT — accessible forever regardless of subscription status.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const { data: report, error: reportErr } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('user_id', authUser.userId)
      .eq('week_number', 1)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reportErr) {
      console.error('[GET /api/reports/first-weekly] Error:', reportErr.message);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve first weekly report.' } },
        { status: 500 }
      );
    }



    if (!report) {
      return NextResponse.json(
        {
          success: true,
          exists: false,
          message: 'First weekly report has not been generated yet.'
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      exists: true,
      report
    });
  } catch (error: any) {
    console.error('[GET /api/reports/first-weekly] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
