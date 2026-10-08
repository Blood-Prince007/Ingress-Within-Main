import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

/**
 * GET /api/reports/:id: Fetches single report if owned by authenticated user.
 * Pure read — accessible to dormant and active users alike.
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const reportId = params.id;
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    if (!reportId) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing report ID.' } },
        { status: 400 }
      );
    }

    const { data: report, error: reportErr } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', authUser.userId)
      .maybeSingle();

    if (reportErr) {
      console.error('[GET /api/reports/:id] Error:', reportErr.message);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve report.' } },
        { status: 500 }
      );
    }

    if (!report) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Report not found.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error: any) {
    console.error('[GET /api/reports/:id] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
