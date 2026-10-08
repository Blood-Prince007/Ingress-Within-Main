import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedAdmin } from '../../../../../../lib/auth/adminAuthHelper';
import { AdminPlatformService } from '../../../../../../lib/admin/adminPlatformService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuthorizedAdmin(request);
    const resolvedParams = await params;
    const applicationId = resolvedParams.id;

    const body = await request.json().catch(() => ({}));
    const { notes } = body;

    const result = await AdminPlatformService.approveApplication(
      applicationId,
      admin.adminId,
      notes
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'APPROVE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
