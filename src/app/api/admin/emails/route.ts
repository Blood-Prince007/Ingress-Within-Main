import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedAdmin } from '../../../../lib/auth/adminAuthHelper';
import { EmailService } from '../../../../lib/email/emailService';

/**
 * GET /api/admin/emails
 * Authenticated administrative log of transactional email deliveries and delivery health.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuthorizedAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') || 'all';
    const eventType = searchParams.get('eventType') || 'all';
    const search = searchParams.get('search') || '';

    const [deliveriesResult, healthMetrics] = await Promise.all([
      EmailService.getEmailDeliveries({ page, limit, status, eventType, search }),
      EmailService.getEmailHealthMetrics(),
    ]);

    return NextResponse.json({
      success: true,
      deliveries: deliveriesResult.deliveries,
      pagination: deliveriesResult.pagination,
      health: healthMetrics,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'EMAIL_AUDIT_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}

/**
 * POST /api/admin/emails
 * Sends a real, controlled smoke-test transactional email via the production provider pipeline.
 * Available only to authorized administrators for live provider verification.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuthorizedAdmin(request);

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const recipientEmail = body.recipientEmail || admin.email || 'contactus@ingresswithin.com';

    const smokeResult = await EmailService.sendSmokeTestEmail({
      recipientEmail,
    });

    return NextResponse.json({
      success: smokeResult.success,
      smokeTest: smokeResult,
    }, { status: smokeResult.success ? 200 : 422 });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'SMOKE_TEST_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
