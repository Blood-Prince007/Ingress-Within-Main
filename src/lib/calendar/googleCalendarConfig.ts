/**
 * Ingress Within — Google Calendar & Meet Configuration Helper
 * 
 * SERVER-SIDE ONLY: Never import in client components.
 * Strictly protects GOOGLE_CLIENT_SECRET from leakage to client JavaScript,
 * responses, or public logs.
 */

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  isConfigured: boolean;
}

export class GoogleCalendarConfigService {
  /**
   * Reads and validates Google Calendar environment configuration.
   * Never throws in a way that crashes the entire application.
   */
  static getConfig(): GoogleCalendarConfig {
    const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
    
    // Resolve environment-specific default redirect URI if not explicitly defined
    const defaultRedirectUri = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`
      : (process.env.NODE_ENV === 'production'
          ? 'https://ingresswithin.com/api/calendar/google/callback'
          : 'http://localhost:3000/api/calendar/google/callback');

    const redirectUri = (process.env.GOOGLE_REDIRECT_URI || defaultRedirectUri).trim();

    const isConfigured = Boolean(
      clientId &&
      clientSecret &&
      redirectUri &&
      clientId !== 'your-google-oauth-client-id.apps.googleusercontent.com'
    );

    return {
      clientId,
      clientSecret,
      redirectUri,
      isConfigured,
    };
  }

  /**
   * Asserts that Google Calendar is configured before initiating OAuth.
   * Returns a clean, controlled error message.
   */
  static assertConfigured(): GoogleCalendarConfig {
    const config = this.getConfig();

    if (!config.isConfigured) {
      const isDev = process.env.NODE_ENV !== 'production';
      const message = isDev
        ? 'Google Calendar credentials are not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env. See docs/google-calendar-setup.md for details.'
        : 'Google Calendar integration is temporarily unavailable. Please try again later.';

      const err: any = new Error(message);
      err.code = 'GOOGLE_CALENDAR_NOT_CONFIGURED';
      err.status = 503;
      throw err;
    }

    return config;
  }
}
