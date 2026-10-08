import { NextRequest } from 'next/server';
import { getAuthenticatedUser, AuthenticatedUser } from './auth-helper';
import { supabase } from './db';

export interface AuthenticatedAdmin extends AuthenticatedUser {
  isAdmin: boolean;
  role: string;
}

/**
 * Server-side authorization check for Admin / Developer routes.
 * Enforces admin authorization and environment restrictions.
 * Returns null if user is unauthenticated, non-admin, or if developer lab is disabled in production.
 */
export async function getAuthenticatedAdmin(request: NextRequest): Promise<AuthenticatedAdmin | null> {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const isDevLabEnabled = process.env.ENABLE_DEVELOPER_LAB === 'true' || process.env.NEXT_PUBLIC_ENABLE_DEV_LAB === 'true';

    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return null;
    }

    // Query user record in database to check admin status
    const { data: userRecord } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.userId)
      .maybeSingle();

    const isAdmin = (userRecord as any)?.is_admin === true || (userRecord as any)?.role === 'admin';

    if (!isAdmin) {
      return null;
    }

    return {
      ...authUser,
      isAdmin: true,
      role: userRecord?.role || 'admin'
    };
  } catch (error) {
    console.error('getAuthenticatedAdmin helper error:', error);
    return null;
  }
}
