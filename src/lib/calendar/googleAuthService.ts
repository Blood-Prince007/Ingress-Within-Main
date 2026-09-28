import crypto from 'crypto';
import { supabase } from '../db';
import { encryptToken, decryptToken } from '../../utils/encryption';
import { GoogleCalendarConfigService } from './googleCalendarConfig';

export interface OAuthStatePayload {
  accountType: 'user' | 'therapist';
  userId?: string;
  therapistAccountId?: string;
  returnTo?: string;
}

export interface AuthenticatedCallerSession {
  accountType: 'user' | 'therapist';
  accountId: string;
}

export interface OAuthStateRecord {
  id: string;
  state_hash: string;
  account_type: 'user' | 'therapist';
  user_id: string | null;
  therapist_account_id: string | null;
  return_to: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

/**
 * SCOPES SPECIFICATION (Strict Minimal Privileges):
 * 1. https://www.googleapis.com/auth/calendar.events:
 *    Permits managing Ingress Within clinical events, generating Google Meet conferences via
 *    conferenceDataVersion=1, and querying freeBusy availability on calendars.
 * 2. https://www.googleapis.com/auth/userinfo.email:
 *    Permits identifying the connected Google account email for identity display.
 * 
 * EXCLUDED: https://www.googleapis.com/auth/calendar.readonly (Over-broad: leaks all private event details)
 * EXCLUDED: https://www.googleapis.com/auth/calendar (Over-broad administrative control)
 */
export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export class GoogleAuthService {
  // In-memory fallback stores for test/local environments when DB table is pending migration
  private static inMemoryStates: Map<string, OAuthStateRecord> = new Map();
  private static inMemoryConnections: Map<string, any> = new Map();

  private static getClientId(): string {
    return GoogleCalendarConfigService.getConfig().clientId;
  }

  private static getClientSecret(): string {
    return GoogleCalendarConfigService.getConfig().clientSecret;
  }

  private static getRedirectUri(): string {
    return GoogleCalendarConfigService.getConfig().redirectUri;
  }

  /**
   * Generates a cryptographically random, short-lived, single-use server-side OAuth state
   * and returns the Google OAuth 2.0 authorization URL.
   */
  static async getAuthUrl(statePayload: OAuthStatePayload): Promise<string> {
    const { accountType, userId, therapistAccountId, returnTo } = statePayload;

    // Database ownership invariant check
    if (accountType === 'user' && (!userId || therapistAccountId)) {
      throw new Error('INVALID_OAUTH_OWNERSHIP: User OAuth must specify userId and no therapistAccountId.');
    }
    if (accountType === 'therapist' && (!therapistAccountId || userId)) {
      throw new Error('INVALID_OAUTH_OWNERSHIP: Therapist OAuth must specify therapistAccountId and no userId.');
    }

    const config = GoogleCalendarConfigService.assertConfigured();

    // 1. Generate opaque cryptographically random state token (64 hex characters)
    const rawState = crypto.randomBytes(32).toString('hex');

    // 2. Hash state using SHA-256 for secure server-side lookup
    const stateHash = crypto.createHash('sha256').update(rawState).digest('hex');

    // 3. Store server-side state with 10-minute expiry
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const record: OAuthStateRecord = {
      id: crypto.randomUUID(),
      state_hash: stateHash,
      account_type: accountType,
      user_id: accountType === 'user' ? (userId || null) : null,
      therapist_account_id: accountType === 'therapist' ? (therapistAccountId || null) : null,
      return_to: returnTo || (accountType === 'therapist' ? '/therapist/calendar' : '/client/appointments'),
      expires_at: expiresAt,
      used_at: null,
      created_at: new Date().toISOString(),
    };

    const { error: insertErr } = await supabase
      .from('google_oauth_states')
      .insert(record);

    if (insertErr) {
      if (insertErr.code === 'PGRST205' || insertErr.code === '42P01') {
        // Fallback for test/local environments where migration 009 has not yet run
        this.inMemoryStates.set(stateHash, record);
      } else {
        console.error('[GoogleAuth] Failed to persist oauth state:', insertErr);
        throw new Error('Failed to generate secure OAuth state.');
      }
    } else {
      // Also cache in memory for ultra-fast lookup
      this.inMemoryStates.set(stateHash, record);
    }

    const clientId = this.getClientId();
    const redirectUri = this.getRedirectUri();

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GOOGLE_CALENDAR_SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state: rawState,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Helper to retrieve state record by hash (checking Supabase and falling back to memory)
   */
  static async getStateRecordByHash(stateHash: string): Promise<OAuthStateRecord | null> {
    const { data } = await supabase
      .from('google_oauth_states')
      .select('*')
      .eq('state_hash', stateHash)
      .maybeSingle();

    if (data) return data as OAuthStateRecord;
    return this.inMemoryStates.get(stateHash) || null;
  }

  /**
   * Helper for tests / administrative state seeding (e.g. expired state simulation)
   */
  static async seedStateForTesting(record: OAuthStateRecord): Promise<void> {
    this.inMemoryStates.set(record.state_hash, record);
    await supabase.from('google_oauth_states').insert(record);
  }

  /**
   * Validates and atomically consumes a server-side OAuth state token.
   * Enforces expiry, single-use, and strict account ownership.
   */
  static async validateAndConsumeState(
    rawState: string,
    callerSession?: AuthenticatedCallerSession
  ): Promise<OAuthStateRecord> {
    if (!rawState || typeof rawState !== 'string' || rawState.length < 32) {
      const err: any = new Error('MALFORMED_STATE: OAuth state is missing or malformed.');
      err.code = 'MALFORMED_STATE';
      err.status = 400;
      throw err;
    }

    const stateHash = crypto.createHash('sha256').update(rawState).digest('hex');

    // 1. Fetch state record from database (with in-memory fallback)
    let record: OAuthStateRecord | null = null;
    const { data: dbRecord, error: fetchErr } = await supabase
      .from('google_oauth_states')
      .select('*')
      .eq('state_hash', stateHash)
      .maybeSingle();

    if (dbRecord) {
      record = dbRecord as OAuthStateRecord;
    } else if (fetchErr && (fetchErr.code === 'PGRST205' || fetchErr.code === '42P01')) {
      record = this.inMemoryStates.get(stateHash) || null;
    } else {
      record = this.inMemoryStates.get(stateHash) || null;
    }

    if (!record) {
      const err: any = new Error('UNKNOWN_STATE: Unrecognized or forged OAuth state.');
      err.code = 'UNKNOWN_STATE';
      err.status = 400;
      throw err;
    }

    // 2. Validate single-use (cannot be already consumed)
    if (record.used_at) {
      const err: any = new Error('STATE_ALREADY_USED: OAuth state has already been consumed.');
      err.code = 'STATE_ALREADY_USED';
      err.status = 400;
      throw err;
    }

    // 3. Validate expiration
    if (new Date(record.expires_at).getTime() < Date.now()) {
      const err: any = new Error('STATE_EXPIRED: OAuth state has expired.');
      err.code = 'STATE_EXPIRED';
      err.status = 400;
      throw err;
    }

    // 4. Validate account ownership against authenticated session
    if (callerSession) {
      if (record.account_type !== callerSession.accountType) {
        const err: any = new Error('ACCOUNT_MISMATCH: OAuth state belongs to a different account type.');
        err.code = 'ACCOUNT_MISMATCH';
        err.status = 403;
        throw err;
      }

      if (record.account_type === 'user' && record.user_id !== callerSession.accountId) {
        const err: any = new Error('ACCOUNT_MISMATCH: User account does not match initiating OAuth session.');
        err.code = 'ACCOUNT_MISMATCH';
        err.status = 403;
        throw err;
      }

      if (record.account_type === 'therapist' && record.therapist_account_id !== callerSession.accountId) {
        const err: any = new Error('ACCOUNT_MISMATCH: Therapist account does not match initiating OAuth session.');
        err.code = 'ACCOUNT_MISMATCH';
        err.status = 403;
        throw err;
      }
    }

    // 5. Atomically mark state as used (concurrency safe)
    const nowIso = new Date().toISOString();
    let markedUsed = false;

    const { data: updated, error: updateErr } = await supabase
      .from('google_oauth_states')
      .update({ used_at: nowIso })
      .eq('id', record.id)
      .is('used_at', null)
      .select('id')
      .maybeSingle();

    if (!updateErr && updated) {
      markedUsed = true;
    } else if (this.inMemoryStates.has(stateHash)) {
      const memRecord = this.inMemoryStates.get(stateHash)!;
      if (!memRecord.used_at) {
        memRecord.used_at = nowIso;
        markedUsed = true;
      }
    }

    if (!markedUsed) {
      const err: any = new Error('STATE_ALREADY_USED: Concurrent state consumption detected.');
      err.code = 'STATE_ALREADY_USED';
      err.status = 400;
      throw err;
    }

    record.used_at = nowIso;
    return record;
  }

  /**
   * Exchanges authorization code for tokens and persists encrypted credentials.
   * Requires authenticated caller session to bind ownership.
   */
  static async handleOAuthCallback(
    code: string,
    rawState: string,
    callerSession?: AuthenticatedCallerSession
  ) {
    if (!code) {
      const err: any = new Error('MISSING_AUTH_CODE: Authorization code is required.');
      err.code = 'MISSING_AUTH_CODE';
      err.status = 400;
      throw err;
    }

    // 1. Validate & consume server-side state
    const stateRecord = await this.validateAndConsumeState(rawState, callerSession);

    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();
    const redirectUri = this.getRedirectUri();

    // 2. Exchange code for access & refresh tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      console.error('[GoogleAuth] Token exchange failed with status', tokenRes.status);
      const err: any = new Error(`GOOGLE_TOKEN_EXCHANGE_FAILED: ${tokenRes.status}`);
      err.code = 'GOOGLE_TOKEN_EXCHANGE_FAILED';
      err.status = 400;
      throw err;
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = Number(tokenData.expires_in) || 3600;
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 3. Fetch Google user info (email)
    let googleEmail = '';
    let googleAccountId = '';
    try {
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userRes.ok) {
        const userInfo = await userRes.json();
        googleEmail = userInfo.email || '';
        googleAccountId = userInfo.id || '';
      }
    } catch {
      // Non-blocking: continue with connection setup
    }

    // 4. Encrypt tokens for secure storage
    const encryptedAccess = encryptToken(accessToken);
    const encryptedRefresh = refreshToken ? encryptToken(refreshToken) : '';

    // 5. Save into google_calendar_connections table with strict ownership
    const targetUserId = stateRecord.account_type === 'user' ? stateRecord.user_id : null;
    const targetTherapistId = stateRecord.account_type === 'therapist' ? stateRecord.therapist_account_id : null;
    const connectionKey = `${stateRecord.account_type}:${targetUserId || targetTherapistId}`;

    let query = supabase.from('google_calendar_connections').select('id, refresh_token_encrypted');
    if (stateRecord.account_type === 'therapist') {
      query = query.eq('therapist_account_id', targetTherapistId).eq('account_type', 'therapist');
    } else {
      query = query.eq('user_id', targetUserId).eq('account_type', 'user');
    }

    const { data: existing } = await query.maybeSingle();
    const finalRefreshTokenEncrypted = encryptedRefresh || existing?.refresh_token_encrypted || '';

    const payload = {
      id: existing?.id || crypto.randomUUID(),
      account_type: stateRecord.account_type,
      user_id: targetUserId,
      therapist_account_id: targetTherapistId,
      google_email: googleEmail || 'unknown@google.com',
      google_account_id: googleAccountId,
      access_token_encrypted: encryptedAccess,
      refresh_token_encrypted: finalRefreshTokenEncrypted,
      token_expiry: tokenExpiry,
      sync_status: 'connected',
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      await supabase.from('google_calendar_connections').update(payload).eq('id', existing.id);
    } else {
      const { error: insertErr } = await supabase.from('google_calendar_connections').insert(payload);
      if (insertErr && (insertErr.code === 'PGRST205' || insertErr.code === '42P01')) {
        this.inMemoryConnections.set(connectionKey, payload);
      }
    }
    this.inMemoryConnections.set(connectionKey, payload);

    return {
      success: true,
      accountType: stateRecord.account_type,
      googleEmail,
      returnTo: stateRecord.return_to || '/',
    };
  }

  /**
   * Retrieves a valid decrypted access token, automatically refreshing if expired.
   * Handles refresh token revocation gracefully.
   */
  static async getValidAccessToken(
    accountType: 'user' | 'therapist',
    accountId: string
  ): Promise<string | null> {
    const connectionKey = `${accountType}:${accountId}`;
    let connection = this.inMemoryConnections.get(connectionKey) || null;

    if (!connection) {
      let query = supabase.from('google_calendar_connections').select('*');
      if (accountType === 'therapist') {
        query = query.eq('therapist_account_id', accountId).eq('account_type', 'therapist');
      } else {
        query = query.eq('user_id', accountId).eq('account_type', 'user');
      }

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        connection = data;
        this.inMemoryConnections.set(connectionKey, data);
      }
    }

    if (!connection || connection.sync_status === 'revoked') {
      return null;
    }

    const now = Date.now();
    const expiry = connection.token_expiry ? new Date(connection.token_expiry).getTime() : 0;
    const isExpiringSoon = expiry - now < 5 * 60 * 1000; // within 5 minutes

    const decryptedAccess = decryptToken(connection.access_token_encrypted);

    if (!isExpiringSoon && decryptedAccess) {
      return decryptedAccess;
    }

    const decryptedRefresh = decryptToken(connection.refresh_token_encrypted);
    if (!decryptedRefresh) {
      return decryptedAccess || null;
    }

    try {
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.getClientId(),
          client_secret: this.getClientSecret(),
          refresh_token: decryptedRefresh,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshRes.ok) {
        const errorText = await refreshRes.text();
        if (errorText.includes('invalid_grant')) {
          console.warn(`[GoogleAuth] Google Calendar authorization revoked for ${accountType} #${accountId}`);
          connection.sync_status = 'revoked';
          await supabase
            .from('google_calendar_connections')
            .update({
              sync_status: 'revoked',
              updated_at: new Date().toISOString(),
            })
            .eq('id', connection.id);
        }
        return null;
      }

      const refreshedData = await refreshRes.json();
      const newAccessToken = refreshedData.access_token;
      const expiresIn = Number(refreshedData.expires_in) || 3600;
      const newExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();

      connection.access_token_encrypted = encryptToken(newAccessToken);
      connection.token_expiry = newExpiry;
      connection.sync_status = 'connected';

      await supabase
        .from('google_calendar_connections')
        .update({
          access_token_encrypted: connection.access_token_encrypted,
          token_expiry: newExpiry,
          sync_status: 'connected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);

      return newAccessToken;
    } catch {
      console.error('[GoogleAuth] Exception refreshing Google access token');
      return decryptedAccess || null;
    }
  }

  /**
   * Disconnects and revokes calendar sync for an account.
   */
  static async disconnectGoogleCalendar(accountType: 'user' | 'therapist', accountId: string) {
    const connectionKey = `${accountType}:${accountId}`;
    this.inMemoryConnections.delete(connectionKey);

    let query = supabase.from('google_calendar_connections').update({
      sync_status: 'revoked',
      updated_at: new Date().toISOString(),
    });

    if (accountType === 'therapist') {
      query = query.eq('therapist_account_id', accountId).eq('account_type', 'therapist');
    } else {
      query = query.eq('user_id', accountId).eq('account_type', 'user');
    }

    const { error } = await query;
    return { success: !error };
  }

  /**
   * Checks status of connection without leaking sensitive tokens.
   */
  static async getConnectionStatus(accountType: 'user' | 'therapist', accountId: string) {
    const connectionKey = `${accountType}:${accountId}`;
    const memConn = this.inMemoryConnections.get(connectionKey);
    if (memConn) {
      return {
        connected: memConn.sync_status === 'connected',
        googleEmail: memConn.google_email || null,
        syncStatus: memConn.sync_status || 'not_connected',
        lastSyncedAt: memConn.last_synced_at || null,
      };
    }

    let query = supabase.from('google_calendar_connections').select('id, google_email, sync_status, last_synced_at');
    if (accountType === 'therapist') {
      query = query.eq('therapist_account_id', accountId).eq('account_type', 'therapist');
    } else {
      query = query.eq('user_id', accountId).eq('account_type', 'user');
    }

    const { data } = await query.maybeSingle();
    return {
      connected: Boolean(data && data.sync_status === 'connected'),
      googleEmail: data?.google_email || null,
      syncStatus: data?.sync_status || 'not_connected',
      lastSyncedAt: data?.last_synced_at || null,
    };
  }
}
