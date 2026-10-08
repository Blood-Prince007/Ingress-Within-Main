import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedAdmin } from '../../../../../lib/auth/adminAuthHelper';
import { supabase } from '../../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAuthorizedAdmin(request);

    // Fetch up-to-date record from database if available
    const { data: dbAdmin } = await supabase
      .from('admin_accounts')
      .select('id, email, full_name, role, status, last_login_at, created_at')
      .eq('id', admin.adminId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.adminId,
        email: dbAdmin?.email || admin.email || 'admin@ingresswithin.com',
        full_name: dbAdmin?.full_name || admin.fullName || 'Administrator',
        role: dbAdmin?.role || admin.role,
        status: dbAdmin?.status || 'active',
        last_login_at: dbAdmin?.last_login_at || null,
        actorType: admin.actorType,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'ADMIN_UNAUTHORIZED', message: err.message } },
      { status: err.status || 403 }
    );
  }
}
