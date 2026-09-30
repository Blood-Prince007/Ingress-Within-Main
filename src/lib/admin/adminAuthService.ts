import crypto from 'crypto';
import { supabase } from '../db';
import { signJwt, verifyJwt, generateToken } from '../../utils/crypto';
import { AdminAuditService } from './adminAuditService';

export type AdminRole = 'super_admin' | 'admin' | 'finance_admin' | 'support_admin' | 'analyst';
export type AdminStatus = 'active' | 'suspended' | 'deactivated';

export interface AdminAccountRecord {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: AdminRole;
  status: AdminStatus;
  failed_login_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
  last_login_ip: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSessionRecord {
  id: string;
  admin_id: string;
  device_id: string;
  token_hash: string;
  is_active: boolean;
  ip_address?: string | null;
  user_agent?: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface AdminAuthResult {
  admin: {
    id: string;
    email: string;
    full_name: string;
    role: AdminRole;
    status: AdminStatus;
    last_login_at: string | null;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AdminAuthService {
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly ACCESS_TOKEN_EXPIRY_SECONDS = 8 * 60 * 60; // 8 hours for high-security admin session
  private static readonly REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

  // In-memory fallback stores for tests / environments without live DB
  private static inMemoryAdmins: Map<string, AdminAccountRecord> = new Map();
  private static inMemorySessions: Map<string, AdminSessionRecord> = new Map();

  /**
   * Hashes a password using Node's native scrypt memory-hard key derivation.
   */
  static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  /**
   * Timing-safe verification of password against scrypt salt:hash.
   */
  static verifyPassword(password: string, storedHash: string): boolean {
    if (!storedHash || !storedHash.includes(':')) return false;
    const [salt, key] = storedHash.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedBuffer = crypto.scryptSync(password, salt, 64);
    if (keyBuffer.length !== derivedBuffer.length) return false;
    return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
  }

  /**
   * Hashes a token using SHA-256 for secure DB session lookup.
   */
  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Provisions or registers an admin account in the in-memory store (useful for tests and bootstrapping).
   */
  static registerInMemoryAdmin(admin: AdminAccountRecord): void {
    this.inMemoryAdmins.set(admin.id, admin);
    this.inMemoryAdmins.set(admin.email.toLowerCase(), admin);
  }

  /**
   * Clears in-memory test state.
   */
  static clearInMemory(): void {
    this.inMemoryAdmins.clear();
    this.inMemorySessions.clear();
  }

  /**
   * Authenticates an administrator with email and password.
   * Enforces brute-force lockout, account status checks, and audit logging.
   */
  static async login(params: {
    email: string;
    password: string;
    deviceId: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<AdminAuthResult> {
    const { email, password, deviceId, ipAddress, userAgent } = params;

    if (!email || !password) {
      const err: any = new Error('Email and password are required.');
      err.code = 'INVALID_CREDENTIALS';
      err.status = 400;
      throw err;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Fetch admin account from DB or in-memory store
    let adminRecord: AdminAccountRecord | null = null;

    const { data: dbAdmin } = await supabase
      .from('admin_accounts')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (dbAdmin) {
      adminRecord = {
        id: dbAdmin.id,
        email: dbAdmin.email,
        password_hash: dbAdmin.password_hash,
        full_name: dbAdmin.full_name,
        role: dbAdmin.role,
        status: dbAdmin.status,
        failed_login_attempts: dbAdmin.failed_login_attempts || 0,
        locked_until: dbAdmin.locked_until,
        last_login_at: dbAdmin.last_login_at,
        last_login_ip: dbAdmin.last_login_ip,
        created_by: dbAdmin.created_by,
        created_at: dbAdmin.created_at,
        updated_at: dbAdmin.updated_at,
      };
    } else {
      adminRecord = this.inMemoryAdmins.get(normalizedEmail) || null;
    }

    if (!adminRecord) {
      // Intentionally uniform error to prevent user enumeration
      const err: any = new Error('Invalid email or password.');
      err.code = 'INVALID_CREDENTIALS';
      err.status = 401;
      throw err;
    }

    // 2. Check Lockout State
    const now = new Date();
    if (adminRecord.locked_until && new Date(adminRecord.locked_until) > now) {
      const remainingMinutes = Math.ceil(
        (new Date(adminRecord.locked_until).getTime() - now.getTime()) / 60000
      );
      const err: any = new Error(
        `Account temporarily locked due to consecutive failed attempts. Please try again in ${remainingMinutes} minute(s).`
      );
      err.code = 'ACCOUNT_LOCKED';
      err.status = 423;
      throw err;
    }

    // 3. Verify Account Status
    if (adminRecord.status !== 'active') {
      const err: any = new Error(`Admin account is ${adminRecord.status}. Access denied.`);
      err.code = 'ACCOUNT_INACTIVE';
      err.status = 403;
      throw err;
    }

    // 4. Verify Password
    const passwordValid = this.verifyPassword(password, adminRecord.password_hash);
    if (!passwordValid) {
      const attempts = (adminRecord.failed_login_attempts || 0) + 1;
      let lockedUntil: string | null = null;

      if (attempts >= this.MAX_FAILED_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MS).toISOString();
      }

      adminRecord.failed_login_attempts = attempts;
      adminRecord.locked_until = lockedUntil;
      adminRecord.updated_at = new Date().toISOString();

      await supabase
        .from('admin_accounts')
        .update({
          failed_login_attempts: attempts,
          locked_until: lockedUntil,
          updated_at: adminRecord.updated_at,
        })
        .eq('id', adminRecord.id);

      this.inMemoryAdmins.set(adminRecord.id, adminRecord);
      this.inMemoryAdmins.set(normalizedEmail, adminRecord);

      await AdminAuditService.logAction({
        actorId: adminRecord.id,
        actorType: 'admin_user',
        action: 'admin_login_failed',
        entityType: 'admin_account',
        entityId: adminRecord.id,
        ipAddress: ipAddress || null,
        metadata: {
          attempts,
          locked: !!lockedUntil,
        },
      });

      const err: any = new Error('Invalid email or password.');
      err.code = 'INVALID_CREDENTIALS';
      err.status = 401;
      throw err;
    }

    // 5. Successful Password Verification: Reset Lockout Counters
    const nowIso = now.toISOString();
    adminRecord.failed_login_attempts = 0;
    adminRecord.locked_until = null;
    adminRecord.last_login_at = nowIso;
    adminRecord.last_login_ip = ipAddress || null;
    adminRecord.updated_at = nowIso;

    await supabase
      .from('admin_accounts')
      .update({
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: nowIso,
        last_login_ip: ipAddress || null,
        updated_at: nowIso,
      })
      .eq('id', adminRecord.id);

    this.inMemoryAdmins.set(adminRecord.id, adminRecord);
    this.inMemoryAdmins.set(normalizedEmail, adminRecord);

    // 6. Generate Tokens
    const jwtSecret = process.env.JWT_SECRET || 'jwt_default_secret_dev';
    const accessToken = signJwt(
      {
        aid: adminRecord.id,
        email: adminRecord.email,
        role: adminRecord.role,
        scope: 'admin',
        did: deviceId,
      },
      jwtSecret,
      this.ACCESS_TOKEN_EXPIRY_SECONDS
    );

    const refreshToken = generateToken(32);
    const tokenHash = this.hashToken(refreshToken);
    const sessionExpiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY_SECONDS * 1000).toISOString();

    const sessionRecord: AdminSessionRecord = {
      id: crypto.randomUUID(),
      admin_id: adminRecord.id,
      device_id: deviceId,
      token_hash: tokenHash,
      is_active: true,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      expires_at: sessionExpiresAt,
      created_at: nowIso,
      updated_at: nowIso,
    };

    await supabase.from('admin_sessions').insert(sessionRecord);
    this.inMemorySessions.set(sessionRecord.id, sessionRecord);

    // 7. Audit Log
    await AdminAuditService.logAction({
      actorId: adminRecord.id,
      actorType: 'admin_user',
      action: 'admin_login_success',
      entityType: 'admin_account',
      entityId: adminRecord.id,
      ipAddress: ipAddress || null,
      metadata: {
        role: adminRecord.role,
        deviceId,
      },
    });

    return {
      admin: {
        id: adminRecord.id,
        email: adminRecord.email,
        full_name: adminRecord.full_name,
        role: adminRecord.role,
        status: adminRecord.status,
        last_login_at: adminRecord.last_login_at,
      },
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRY_SECONDS,
    };
  }

  /**
   * Validates an access token and returns the authoritative admin account if valid.
   */
  static async validateAdminToken(token: string): Promise<AdminAccountRecord | null> {
    if (!token) return null;

    const jwtSecret = process.env.JWT_SECRET || 'jwt_default_secret_dev';
    const payload = verifyJwt(token, jwtSecret);

    if (!payload || payload.scope !== 'admin' || !payload.aid) {
      return null;
    }

    // Load admin from DB or memory
    const { data: dbAdmin } = await supabase
      .from('admin_accounts')
      .select('*')
      .eq('id', payload.aid)
      .maybeSingle();

    let admin: AdminAccountRecord | null = null;
    if (dbAdmin) {
      admin = {
        id: dbAdmin.id,
        email: dbAdmin.email,
        password_hash: dbAdmin.password_hash,
        full_name: dbAdmin.full_name,
        role: dbAdmin.role,
        status: dbAdmin.status,
        failed_login_attempts: dbAdmin.failed_login_attempts || 0,
        locked_until: dbAdmin.locked_until,
        last_login_at: dbAdmin.last_login_at,
        last_login_ip: dbAdmin.last_login_ip,
        created_by: dbAdmin.created_by,
        created_at: dbAdmin.created_at,
        updated_at: dbAdmin.updated_at,
      };
    } else {
      admin = this.inMemoryAdmins.get(payload.aid) || null;
    }

    if (!admin || admin.status !== 'active') {
      return null;
    }

    return admin;
  }

  /**
   * Revokes an admin session.
   */
  static async logout(adminId: string, deviceId?: string): Promise<void> {
    if (deviceId) {
      await supabase
        .from('admin_sessions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('admin_id', adminId)
        .eq('device_id', deviceId);

      for (const s of this.inMemorySessions.values()) {
        if (s.admin_id === adminId && s.device_id === deviceId) {
          s.is_active = false;
        }
      }
    } else {
      await supabase
        .from('admin_sessions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('admin_id', adminId);

      for (const s of this.inMemorySessions.values()) {
        if (s.admin_id === adminId) {
          s.is_active = false;
        }
      }
    }
  }

  /**
   * Lists active admin sessions for security audit.
   */
  static async getActiveSessions(adminId: string): Promise<AdminSessionRecord[]> {
    const { data } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('admin_id', adminId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      return data;
    }

    const mem: AdminSessionRecord[] = [];
    for (const s of this.inMemorySessions.values()) {
      if (s.admin_id === adminId && s.is_active) {
        mem.push(s);
      }
    }
    return mem;
  }
}
