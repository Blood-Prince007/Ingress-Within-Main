import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/db';
import { getAuthenticatedUser } from '../../../lib/auth-helper';

/**
 * GET /api/reports: Fetches all weekly and milestone reports for the authenticated user.
 * Read-only — fully accessible to dormant and active users alike.
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

    const { data: reports, error: reportsErr } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('user_id', authUser.userId)
      .order('week_number', { ascending: true });

    if (reportsErr) {
      console.error('[GET /api/reports] Error fetching reports:', reportsErr.message);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve reports.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reports: reports || []
    });
  } catch (error: any) {
    console.error('[GET /api/reports] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
