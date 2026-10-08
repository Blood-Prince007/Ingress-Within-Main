import { NextRequest, NextResponse } from 'next/server';
import { AdminAnalyticsService } from '../../../../lib/admin/adminAnalyticsService';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let userId = body.userId || null;
    let role = body.role || 'guest';
    const route = body.route || request.headers.get('referer') || '/';

    // Verify session if available
    try {
      const authUser = await getAuthenticatedUser(request);
      if (authUser?.userId) {
        userId = authUser.userId;
      }
    } catch {
      // Unauthenticated / guest session
    }

    AdminAnalyticsService.recordHeartbeat({
      userId,
      role: role as any,
      route,
    });

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err.message || 'Heartbeat failed' } },
      { status: 400 }
    );
  }
}
