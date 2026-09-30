import { NextRequest } from 'next/server';
import { supabase } from '../db';
import { verifyJwt } from '../../utils/crypto';
import { COOKIE_THERAPIST_ACCESS_NAME } from '../../utils/cookies';
import { TherapistAuthService } from './therapistAuthService';

export interface AuthenticatedTherapist {
  therapistId: string;
  phoneNumber: string;
  deviceId: string;
  scope: 'therapist';
}

export interface AuthenticatedTherapistAccount {
  id: string;
  phone_number: string;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  is_active: boolean;
  can_practice: boolean;
  application_status: 'onboarding_incomplete' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'suspended';
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  rci_registered?: boolean;
  rci_number?: string | null;
  commission_rate?: number;
  per_session_fee?: number;
  created_at: string;
  updated_at: string;
}

export interface AuthenticatedTherapistProfileData {
  id: string;
  phone_number: string;
  full_name: string;
  title?: string;
  bio?: string;
  qualification?: string;
  experience_years?: number;
  specializations?: string[];
  languages?: string[];
  session_formats?: string[];
  availability_hours?: Record<string, string[]>;
  profile_image_url?: string | null;
  city?: string | null;
  state?: string | null;
  practice_name?: string;
  practice_address?: string;
  timezone?: string;
  notification_preferences?: {
    email_appointment_reminders?: boolean;
    email_booking_notifications?: boolean;
    email_cancellation_alerts?: boolean;
    email_homework_submissions?: boolean;
    in_app_session_alerts?: boolean;
    security_alerts?: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface AuthenticatedTherapistProfile {
  account: AuthenticatedTherapistAccount;
  profile: AuthenticatedTherapistProfileData;
}

/**
 * Extracts and verifies the therapist access token from cookies or Authorization header.
 * Validates against active sessions in database.
 * Rejects any non-therapist tokens (e.g. user tokens).
 */
export async function getAuthenticatedTherapist(request: NextRequest): Promise<AuthenticatedTherapist | null> {
  try {
    let token = request.cookies?.get(COOKIE_THERAPIST_ACCESS_NAME)?.value;

    if (!token) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(new RegExp(`${COOKIE_THERAPIST_ACCESS_NAME}=([^;]+)`));
      if (match) token = match[1];
    }

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) return null;

    const jwtSecret = TherapistAuthService.getJwtSecret();
    const payload = verifyJwt(token, jwtSecret);

    // Strict therapist check: must have tid and scope === 'therapist'
    // Ordinary user tokens have uid and no therapist scope, so they are immediately rejected.
    if (!payload || !payload.tid || payload.scope !== 'therapist') {
      return null;
    }

    // Validate that session is still active in database
    try {
      const { data: sessions, error: sessionError } = await supabase
        .from('therapist_sessions')
        .select('id')
        .eq('therapist_account_id', payload.tid)
        .eq('device_id', payload.did)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false });

      if (!sessionError && sessions && sessions.length === 0) {
        return null;
      }
    } catch (dbErr) {
      console.warn('[therapistAuthHelper] DB session check notice:', dbErr);
    }

    return {
      therapistId: payload.tid,
      phoneNumber: payload.phone,
      deviceId: payload.did,
      scope: payload.scope
    };
  } catch (error) {
    console.error('[therapistAuthHelper] getAuthenticatedTherapist error:', error);
    return null;
  }
}

/**
 * Requires an authenticated therapist session.
 * Throws an Error with status 401 if unauthenticated or if a user token is provided.
 */
export async function requireAuthenticatedTherapist(request: NextRequest): Promise<AuthenticatedTherapist> {
  const therapist = await getAuthenticatedTherapist(request);
  if (!therapist) {
    const error: any = new Error('Therapist authentication required.');
    error.status = 401;
    error.code = 'THERAPIST_AUTH_REQUIRED';
    throw error;
  }
  return therapist;
}

/**
 * Retrieves the therapist account record and profile for the authenticated therapist session.
 */
export async function requireTherapistProfile(request: NextRequest): Promise<AuthenticatedTherapistProfile> {
  const authTherapist = await requireAuthenticatedTherapist(request);

  // 1. Fetch therapist account
  const { data: account, error: accountError } = await supabase
    .from('therapist_accounts')
    .select('*')
    .eq('id', authTherapist.therapistId)
    .neq('status', 'rejected')
    .single();

  if (accountError || !account) {
    const error: any = new Error('Therapist account not found or deactivated.');
    error.status = 401;
    error.code = 'THERAPIST_NOT_FOUND';
    throw error;
  }

  // 2. Fetch therapist profile (foreign key is therapist_account_id)
  const { data: profile } = await supabase
    .from('therapist_profiles')
    .select('*')
    .eq('therapist_account_id', authTherapist.therapistId)
    .maybeSingle();

  const isAccountActive = account.status !== 'suspended' && account.status !== 'rejected';

  const profileData: AuthenticatedTherapistProfileData = profile ? {
    id: profile.id,
    phone_number: profile.phone || account.phone_number,
    full_name: profile.full_name || '',
    title: profile.title || 'Consultant Psychologist',
    bio: profile.bio || '',
    qualification: profile.qualification || '',
    experience_years: profile.experience_years ?? 0,
    specializations: Array.isArray(profile.specializations) ? profile.specializations : [],
    languages: Array.isArray(profile.languages) ? profile.languages : ['English', 'Hindi'],
    session_formats: Array.isArray(profile.session_formats) ? profile.session_formats : ['telehealth'],
    availability_hours: profile.availability_hours || {},
    profile_image_url: profile.profile_image_url || null,
    city: profile.city || null,
    state: profile.state || null,
    practice_name: profile.practice_name || '',
    practice_address: profile.practice_address || '',
    timezone: profile.timezone || 'Asia/Kolkata',
    notification_preferences: profile.notification_preferences || {
      email_appointment_reminders: true,
      email_booking_notifications: true,
      email_cancellation_alerts: true,
      email_homework_submissions: true,
      in_app_session_alerts: true,
      security_alerts: true,
    },
    created_at: profile.created_at || account.created_at,
    updated_at: profile.updated_at || account.updated_at
  } : {
    id: account.id,
    phone_number: account.phone_number,
    full_name: '',
    title: 'Consultant Psychologist',
    bio: '',
    qualification: '',
    experience_years: 0,
    specializations: [],
    languages: ['English', 'Hindi'],
    session_formats: ['telehealth'],
    availability_hours: {},
    profile_image_url: null,
    city: null,
    state: null,
    practice_name: '',
    practice_address: '',
    timezone: 'Asia/Kolkata',
    notification_preferences: {
      email_appointment_reminders: true,
      email_booking_notifications: true,
      email_cancellation_alerts: true,
      email_homework_submissions: true,
      in_app_session_alerts: true,
      security_alerts: true,
    },
    created_at: account.created_at,
    updated_at: account.updated_at
  };

  return {
    account: {
      id: account.id,
      phone_number: account.phone_number,
      status: account.status,
      is_active: isAccountActive,
      can_practice: Boolean(account.can_practice),
      application_status: account.application_status || 'onboarding_incomplete',
      verification_status: account.verification_status || 'unverified',
      rci_registered: Boolean(account.rci_registered),
      rci_number: account.rci_number || null,
      commission_rate: Number(account.commission_rate) || 15,
      per_session_fee: Number(account.per_session_fee) || 1500,
      created_at: account.created_at,
      updated_at: account.updated_at
    },
    profile: profileData
  };
}

/**
 * Requires an authenticated therapist who has completed clinical review
 * and is actively authorized to practice (can_practice === true).
 * Used to protect clinical client data, SOAP notes, booking, and earnings.
 */
export async function requireAuthorizedTherapist(request: NextRequest): Promise<AuthenticatedTherapistProfile> {
  const profile = await requireTherapistProfile(request);

  if (!profile.account.is_active || profile.account.status !== 'active') {
    const error: any = new Error('Therapist account is not active.');
    error.status = 403;
    error.code = 'THERAPIST_NOT_ACTIVE';
    throw error;
  }

  if (profile.account.application_status !== 'approved') {
    const error: any = new Error('Therapist application is not approved.');
    error.status = 403;
    error.code = 'APPLICATION_NOT_APPROVED';
    error.application_status = profile.account.application_status;
    throw error;
  }

  if (profile.account.verification_status !== 'verified') {
    const error: any = new Error('Therapist practitioner verification required.');
    error.status = 403;
    error.code = 'VERIFICATION_REQUIRED';
    error.verification_status = profile.account.verification_status;
    throw error;
  }

  if (!profile.account.can_practice) {
    const error: any = new Error('Therapist practice authorization required. Clinical onboarding is pending review.');
    error.status = 403;
    error.code = 'PRACTICE_NOT_AUTHORIZED';
    error.application_status = profile.account.application_status;
    throw error;
  }

  return profile;
}

/**
 * Requires an authenticated therapist applicant (for onboarding and application tracking).
 * Does not require can_practice === true.
 */
export async function requireTherapistApplicant(request: NextRequest): Promise<AuthenticatedTherapistProfile> {
  const profile = await requireTherapistProfile(request);

  if (profile.account.status === 'suspended' || profile.account.status === 'rejected') {
    const error: any = new Error('Therapist account is suspended or rejected.');
    error.status = 403;
    error.code = 'THERAPIST_DEACTIVATED';
    throw error;
  }

  return profile;
}
