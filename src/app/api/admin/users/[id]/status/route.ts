import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedAdmin } from '../../../../../../lib/auth/adminAuthHelper';
import { supabase } from '../../../../../../lib/db';
import { AdminAuditService } from '../../../../../../lib/admin/adminAuditService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuthorizedAdmin(request);
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    const body = await request.json().catch(() => ({}));
    const { status, reason } = body;

    if (!status || (status !== 'active' && status !== 'suspended' && status !== 'deactivated')) {
      return NextResponse.json(
        { error: { code: 'INVALID_STATUS', message: "status must be 'active', 'suspended', or 'deactivated'." } },
        { status: 400 }
      );
    }

    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('id, account_status')
      .eq('id', userId)
      .maybeSingle();

    if (fetchErr || !user) {
      return NextResponse.json(
        { error: { code: 'USER_NOT_FOUND', message: 'User not found.' } },
        { status: 404 }
      );
    }

    const previousStatus = user.account_status;

    await supabase
      .from('users')
      .update({
        account_status: status,
        is_active: status === 'active',
      })
      .eq('id', userId);

    await AdminAuditService.logAction({
      actorId: admin.adminId,
      actorType: admin.actorType,
      action: 'user_status_changed',
      entityType: 'user',
      entityId: userId,
      metadata: {
        previousStatus,
        newStatus: status,
        reason: reason || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User status changed to ${status}.`,
      userId,
      newStatus: status,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'USER_STATUS_UPDATE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
