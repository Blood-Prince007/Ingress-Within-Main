import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedAdmin } from '../../../../lib/auth/adminAuthHelper';
import { ComplimentaryAccessService } from '../../../../lib/billing/complimentaryAccessService';

/**
 * GET /api/admin/complimentary-access
 * Lists all active permanent complimentary access entitlements.
 * Requires authorized admin credentials.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuthorizedAdmin(request);
    const entitlements = await ComplimentaryAccessService.listComplimentaryEntitlements();

    return NextResponse.json({
      success: true,
      entitlements,
      count: entitlements.length
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'COMPLIMENTARY_QUERY_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}

/**
 * POST /api/admin/complimentary-access
 * Grants permanent complimentary access to an account by userId or phone number.
 * Requires authorized admin credentials.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuthorizedAdmin(request);
    const body = await request.json();

    const { userId, phone, reason = 'Permanent internal complimentary access' } = body;

    if (!userId && !phone) {
      return NextResponse.json(
        { error: { code: 'INVALID_PARAMETERS', message: 'userId or phone is required.' } },
        { status: 400 }
      );
    }

    if (phone) {
      const results = await ComplimentaryAccessService.provisionAccountsByPhone([phone], admin.adminId, reason);
      const res = results[0];
      if (res.status === 'not_found') {
        return NextResponse.json({ error: { code: 'USER_NOT_FOUND', message: res.error } }, { status: 404 });
      }
      if (res.status === 'ambiguous') {
        return NextResponse.json({ error: { code: 'AMBIGUOUS_PHONE', message: res.error } }, { status: 409 });
      }

      return NextResponse.json({
        success: true,
        result: res
      });
    }

    const result = await ComplimentaryAccessService.grantComplimentaryAccess({
      userId,
      grantedBy: admin.adminId,
      reason
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'COMPLIMENTARY_GRANT_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}

/**
 * DELETE /api/admin/complimentary-access
 * Revokes permanent complimentary access for a user.
 * Reverts account to standard billing requirements.
 * Requires authorized admin credentials.
 */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAuthorizedAdmin(request);
    const body = await request.json();

    const { userId, reason = 'Admin revoked complimentary entitlement' } = body;

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'INVALID_PARAMETERS', message: 'userId is required.' } },
        { status: 400 }
      );
    }

    const result = await ComplimentaryAccessService.revokeComplimentaryAccess({
      userId,
      revokedBy: admin.adminId,
      reason
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'COMPLIMENTARY_REVOCATION_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
