import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '../auth-helper';
import { supabase } from '../db';

export interface AdminSession {
  adminId: string;
  email?: string;
  actorType: 'admin_api_key' | 'admin_user';
  role: 'admin';
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
 * 4. Verifies either a cryptographically configured ADMIN_SECRET_KEY / ADMIN_API_KEY
 *    or a verified admin user session from the authoritative database.
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
      role: 'admin',
    };
  }

  // 2. Check authenticated user session with database is_admin verification
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
          actorType: 'admin_user',
          role: 'admin',
        };
      }
    }
  } catch (userAuthErr) {
    // Session parsing failed; reject
  }

  // 3. Unauthorized: reject with strict 403
  const err: any = new Error('ADMIN_UNAUTHORIZED: Administrative credentials required.');
  err.code = 'ADMIN_UNAUTHORIZED';
  err.status = 403;
  throw err;
}
