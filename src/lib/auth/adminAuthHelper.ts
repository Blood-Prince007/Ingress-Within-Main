import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '../auth-helper';
import { supabase } from '../db';
import { COOKIE_ADMIN_ACCESS_NAME } from '../../utils/cookies';
import { AdminAuthService, AdminRole } from '../admin/adminAuthService';

export interface AdminSession {
  adminId: string;
  email?: string;
  fullName?: string;
  actorType: 'admin_api_key' | 'admin_user';
  role: AdminRole | 'admin';
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 */
function secureCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Server-side Admin Authorization Guard.
 * 
 * Strict Security Invariants:
 * 1. Zero development secret fallback in production code.
 * 2. Never uses Supabase service-role key as an HTTP user credential.
 * 3. Never trusts client-supplied roles, query parameters, or request headers (x-role, body.role).
 * 4. Verifies:
 *    A. Server-side configured ADMIN_SECRET_KEY / ADMIN_API_KEY (timing-safe).
 *    B. Dedicated admin session cookie (COOKIE_ADMIN_ACCESS_NAME) verified against admin_accounts.
 *    C. Backward-compatible verified user session from database users.is_admin.
 */
export async function requireAuthorizedAdmin(request: NextRequest): Promise<AdminSession> {
  const authHeader = request.headers.get('authorization') || '';
  const adminKeyHeader = request.headers.get('x-admin-key') || '';

  // 1. Check configured server-side admin secret/API key
  const configuredAdminKey = process.env.ADMIN_SECRET_KEY || process.env.ADMIN_API_KEY || '';

  let suppliedKey = '';
  if (adminKeyHeader) {
    suppliedKey = adminKeyHeader;
  } else if (authHeader.startsWith('Bearer ')) {
    suppliedKey = authHeader.slice(7).trim();
  }

  // If a valid server-side admin key is configured and matches securely:
  if (configuredAdminKey && suppliedKey && secureCompare(suppliedKey, configuredAdminKey)) {
    return {
      adminId: 'api_admin',
      actorType: 'admin_api_key',
      role: 'super_admin',
    };
  }

  // 2. Check dedicated admin token from cookie or Authorization header
  let adminCookieToken = request.cookies?.get(COOKIE_ADMIN_ACCESS_NAME)?.value;
  if (!adminCookieToken) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`${COOKIE_ADMIN_ACCESS_NAME}=([^;]+)`));
    if (match) adminCookieToken = match[1];
  }

  const tokenToVerify = adminCookieToken || (authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '');

  if (tokenToVerify) {
    try {
      const adminRecord = await AdminAuthService.validateAdminToken(tokenToVerify);
      if (adminRecord && adminRecord.status === 'active') {
        return {
          adminId: adminRecord.id,
          email: adminRecord.email,
          fullName: adminRecord.full_name,
          actorType: 'admin_user',
          role: adminRecord.role,
        };
      }
    } catch {
      // Continue to fallback checks
    }
  }

  // 3. Fallback: Check authenticated user session with database is_admin verification (for backwards compatibility)
  try {
    const authUser = await getAuthenticatedUser(request);
    if (authUser?.userId) {
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.userId)
        .maybeSingle();

      if (dbUser && ((dbUser as any).is_admin === true || (dbUser as any).role === 'admin')) {
        return {
          adminId: dbUser.id,
          email: dbUser.email || undefined,
          fullName: dbUser.name || 'Admin',
          actorType: 'admin_user',
          role: 'admin',
        };
      }
    }
  } catch {
    // Session parsing failed; reject
  }

  // 4. Unauthorized: reject with strict 403
  const err: any = new Error('ADMIN_UNAUTHORIZED: Administrative credentials required.');
  err.code = 'ADMIN_UNAUTHORIZED';
  err.status = 403;
  throw err;
}

/**
 * Super Admin Authorization Guard for destructive operations (e.g. suspending admins).
 */
export async function requireSuperAdmin(request: NextRequest): Promise<AdminSession> {
  const session = await requireAuthorizedAdmin(request);
  if (session.role !== 'super_admin' && session.actorType !== 'admin_api_key') {
    const err: any = new Error('SUPER_ADMIN_REQUIRED: Elevated super-admin privileges required.');
    err.code = 'SUPER_ADMIN_REQUIRED';
    err.status = 403;
    throw err;
  }
  return session;
}
