import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { backfillPatterns } from '../../../../lib/patterns/patternBackfill';
import { supabase } from '../../../../lib/db';
import { AccessControlService, AccessDeniedError } from '../../../../lib/billing/accessControlService';

/**
 * POST /api/patterns/backfill: Manually triggers the backfill orchestrator to scan and backfill missing patterns and snapshots.
 * Supports ?all=true query parameter to scan and rebuild for all users.
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

    const { searchParams } = new URL(request.url);
    const allUsers = searchParams.get('all') === 'true';

    if (allUsers) {
      if (process.env.ENABLE_ADMIN_MAINTENANCE !== 'true') {
        return NextResponse.json(
          {
            error: {
              code: 'FORBIDDEN',
              message: 'Global pattern backfill is disabled. Use the single-user backfill path or enable admin maintenance explicitly.'
            }
          },
          { status: 403 }
        );
      }

      console.log(`[API Patterns Backfill] Triggered pattern backfill for all users`);
      const { data: users, error: usersErr } = await supabase
        .from('profiles')
        .select('id');

      if (usersErr) {
        throw new Error(`Failed to fetch users: ${usersErr.message}`);
      }

      const results: any[] = [];
      for (const u of users || []) {
        console.log(`[API Patterns Backfill] Scanning user ${u.id}`);
        const result = await backfillPatterns(u.id);
        results.push({ userId: u.id, ...result });
      }

      return NextResponse.json({
        success: true,
        backfill: results
      });
    }

    const userId = authUser.userId;

    // Guard single-user pattern backfill with self-help generation access
    await AccessControlService.requirePatternGenerateAccess(userId);

    // Idempotency guard: skip if backfill has already completed for this user.
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('pattern_backfill_completed')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.pattern_backfill_completed === true) {
        console.log(`[API Patterns Backfill] Skipping — backfill already completed for user ${userId}`);
        return NextResponse.json({
          success: true,
          skipped: true,
          reason: 'Backfill already completed for this user.'
        });
      }
    } catch (guardErr: any) {
      // Column may not exist yet; fall through and run backfill normally.
      console.warn('[API Patterns Backfill] Could not check idempotency flag:', guardErr.message);
    }

    // Run the backfill audit programmatically for the single user
    console.log(`[API Patterns Backfill] Starting backfill for user ${userId}`);
    const backfillResult = await backfillPatterns(userId);

    return NextResponse.json({
      success: true,
      backfill: backfillResult
    });

  } catch (error: any) {
    if (error instanceof AccessDeniedError || error.code === 'SUBSCRIPTION_REQUIRED' || error.code === 'SELF_HELP_SUBSCRIPTION_REQUIRED') {
      return NextResponse.json(
        {
          error: {
            code: 'SELF_HELP_SUBSCRIPTION_REQUIRED',
            message: error.message || 'An active self-help subscription is required to generate new patterns.',
            state: error.state || 'DORMANT'
          }
        },
        { status: error.statusCode || 403 }
      );
    }

    console.error('[API Patterns Backfill POST] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
