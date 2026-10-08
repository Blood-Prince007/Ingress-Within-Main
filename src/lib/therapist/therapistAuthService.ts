import { supabase } from '../db';
import { signJwt, generateToken, hashOtp } from '../../utils/crypto';
import { normalizePhoneNumber } from '../auth/phone';
import crypto from 'crypto';

export interface EstablishTherapistSessionResult {
  success: boolean;
  therapist: {
    id: string;
    phone_number: string;
    status: 'pending' | 'active' | 'suspended' | 'rejected';
    is_active: boolean;
    can_practice?: boolean;
    application_status?: 'onboarding_incomplete' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'suspended';
    verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected';
    rci_registered?: boolean;
    created_at: string;
  };
  profile: {
    id: string;
    phone_number: string;
    full_name: string;
    created_at: string;
    updated_at: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface CompleteTherapistSignupPayload {
  phoneNumber: string;
  fullName: string;
  deviceId: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class TherapistAuthService {
  public static getJwtSecret(): string {
    return process.env.JWT_SECRET || 'jwt_default_secret_dev';
  }

  private static readonly SESSION_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days rolling session

  /**
   * Sanitizes display name to prevent XSS / script injection.
   */
  static sanitizeName(rawName: string): string {
    if (!rawName || typeof rawName !== 'string') return '';
    return rawName
      .trim()
      .replace(/[<>'"&]/g, '')
      .substring(0, 100);
  }

  /**
   * Finds an active or pending therapist account by phone number.
   */
  static async findTherapistByPhone(phoneNumber: string) {
    const canonical = normalizePhoneNumber(phoneNumber) || phoneNumber;
    const { data: account, error } = await supabase
      .from('therapist_accounts')
      .select('*')
      .eq('phone_number', canonical)
      .neq('status', 'rejected')
      .maybeSingle();

    if (error) {
      console.warn('[TherapistAuthService] findTherapistByPhone DB notice:', error.message);
      return null;
    }

    return account;
  }

  /**
   * Finds a therapist account by ID.
   */
  static async findTherapistById(id: string) {
    const { data: account, error } = await supabase
      .from('therapist_accounts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.warn('[TherapistAuthService] findTherapistById DB notice:', error.message);
      return null;
    }

    return account;
  }

  /**
   * Completes new therapist signup with initial status 'pending'.
   * Collects ONLY Full Name and Phone Number (+91).
   */
  static async completeTherapistSignup(payload: CompleteTherapistSignupPayload): Promise<EstablishTherapistSessionResult> {
    const canonical = normalizePhoneNumber(payload.phoneNumber);
    if (!canonical) {
      throw new Error("That doesn't look like a valid Indian phone number.");
    }

    const cleanName = this.sanitizeName(payload.fullName);
    if (!cleanName || cleanName.length < 1) {
      throw new Error('Full name is required.');
    }

    const sanitizedIp = (payload.ipAddress || '127.0.0.1').split(',')[0].trim().substring(0, 45);
    const userAgent = payload.userAgent || 'Unknown';

    // 1. Check if therapist account already exists
    let therapistRecord = await this.findTherapistByPhone(canonical);

    if (!therapistRecord) {
      const authUserId = crypto.randomUUID();

      // Create new therapist account with status: 'pending'
      const { data: newAccount, error: createError } = await supabase
        .from('therapist_accounts')
        .insert({
          auth_user_id: authUserId,
          phone_number: canonical,
          status: 'pending'
        })
        .select()
        .single();

      if (createError) {
        if (createError.code === '23505' || createError.message?.includes('duplicate')) {
          therapistRecord = await this.findTherapistByPhone(canonical);
          if (!therapistRecord) {
            throw new Error(`Failed to create therapist account: ${createError.message}`);
          }
        } else {
          throw new Error(`Failed to create therapist account: ${createError.message}`);
        }
      } else {
        therapistRecord = newAccount;
      }
    }

    // 2. Ensure therapist profile exists (uses therapist_account_id foreign key)
    const { data: existingProfile } = await supabase
      .from('therapist_profiles')
      .select('*')
      .eq('therapist_account_id', therapistRecord.id)
      .maybeSingle();

    let profileRecord = existingProfile;

    if (!existingProfile) {
      const { data: newProfile, error: profileError } = await supabase
        .from('therapist_profiles')
        .insert({
          therapist_account_id: therapistRecord.id,
          phone: canonical,
          full_name: cleanName
        })
        .select()
        .single();

      if (profileError) {
        console.warn('[TherapistAuthService] Profile creation notice:', profileError.message);
      }
      profileRecord = newProfile || {
        id: therapistRecord.id,
        therapist_account_id: therapistRecord.id,
        phone: canonical,
        full_name: cleanName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } else if (!existingProfile.full_name) {
      await supabase
        .from('therapist_profiles')
        .update({ full_name: cleanName, updated_at: new Date().toISOString() })
        .eq('therapist_account_id', therapistRecord.id);
      profileRecord.full_name = cleanName;
    }

    // 3. Establish therapist session
    return this.establishTherapistSession(
      therapistRecord,
      profileRecord,
      payload.deviceId,
      payload.deviceName || 'Browser',
      sanitizedIp,
      userAgent
    );
  }

  /**
   * Establishes a rolling 30-day session for an authenticated therapist.
   * Stores session in therapist_sessions and signs a therapist-scoped JWT.
   */
  static async establishTherapistSession(
    account: any,
    profile: any,
    deviceId: string,
    deviceName: string = 'Browser',
    ipAddress: string = '127.0.0.1',
    userAgent: string = 'Unknown'
  ): Promise<EstablishTherapistSessionResult> {
    const sanitizedIp = (ipAddress || '127.0.0.1').split(',')[0].trim().substring(0, 45);

    // 1. Generate session tokens
    const rawRefreshToken = generateToken();
    const hashedRefreshToken = hashOtp(rawRefreshToken, 'therapist_session_salt_static');
    const sessionExpiresAt = new Date(Date.now() + this.SESSION_EXPIRY_SECONDS * 1000).toISOString();

    // 2. Multi-device support: Deactivate only sessions on the SAME device_id for this therapist
    await supabase
      .from('therapist_sessions')
      .update({ is_active: false })
      .eq('therapist_account_id', account.id)
      .eq('device_id', deviceId)
      .eq('is_active', true);

    // 3. Store Session Record in therapist_sessions table
    const { error: sessionError } = await supabase
      .from('therapist_sessions')
      .insert({
        therapist_account_id: account.id,
        refresh_token_hash: hashedRefreshToken,
        device_id: deviceId,
        device_name: deviceName ? deviceName.substring(0, 100) : 'Browser',
        ip_address: sanitizedIp,
        user_agent: userAgent,
        expires_at: sessionExpiresAt,
        is_active: true
      });

    if (sessionError) {
      console.warn('[TherapistAuthService] Session insertion notice:', sessionError.message);
    }

    // 4. Generate JWT Access Token with explicit scope: 'therapist' and tid
    const accessToken = signJwt(
      {
        tid: account.id,
        phone: account.phone_number,
        did: deviceId,
        scope: 'therapist'
      },
      this.getJwtSecret(),
      this.SESSION_EXPIRY_SECONDS
    );

    const isAccountActive = account.status !== 'suspended' && account.status !== 'rejected';

    return {
      success: true,
      therapist: {
        id: account.id,
        phone_number: account.phone_number,
        status: account.status || 'pending',
        is_active: isAccountActive,
        can_practice: Boolean(account.can_practice),
        application_status: account.application_status || 'onboarding_incomplete',
        verification_status: account.verification_status || 'unverified',
        rci_registered: Boolean(account.rci_registered),
        created_at: account.created_at || new Date().toISOString()
      },
      profile: {
        id: profile?.id || account.id,
        phone_number: profile?.phone || profile?.phone_number || account.phone_number,
        full_name: profile?.full_name || '',
        created_at: profile?.created_at || new Date().toISOString(),
        updated_at: profile?.updated_at || new Date().toISOString()
      },
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: this.SESSION_EXPIRY_SECONDS
    };
  }

  /**
   * Deactivates a therapist's session.
   */
  static async deactivateSession(therapistId: string, deviceId?: string) {
    let query = supabase
      .from('therapist_sessions')
      .update({ is_active: false })
      .eq('therapist_account_id', therapistId);

    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }

    await query;
  }
}
