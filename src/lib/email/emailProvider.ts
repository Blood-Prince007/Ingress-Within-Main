import { getEmailConfig } from './emailConfig';

export interface EmailSendOptions {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailSendResult {
  success: boolean;
  provider: 'resend' | 'mock';
  messageId?: string;
  statusCode?: number;
  error?: string;
  errorCategory?: string;
  isPermanent?: boolean;
}


export interface IEmailProvider {
  send(options: EmailSendOptions): Promise<EmailSendResult>;
}

/**
 * Resilient in-memory mock provider for automated unit testing and isolated staging.
 * CANNOT be silently activated in production unless ALLOW_MOCK_EMAIL=true is explicitly set.
 */
export class LoggedEmailProvider implements IEmailProvider {
  public static sentMessages: Array<{
    to: string;
    from: string;
    subject: string;
    html: string;
    text?: string;
    sentAt: string;
    messageId: string;
  }> = [];

  async send(options: EmailSendOptions): Promise<EmailSendResult> {
    const messageId = `mock_msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const record = {
      ...options,
      sentAt: new Date().toISOString(),
      messageId,
    };
    LoggedEmailProvider.sentMessages.push(record);
    console.log(`[EmailProvider:Mock] Simulated dispatch (no real email delivered). to=${options.to} subject="${options.subject}" id=${messageId}`);
    return {
      success: true,
      provider: 'mock',
      messageId,
    };
  }

  static getSentMessages() {
    return this.sentMessages;
  }

  static clear() {
    this.sentMessages = [];
  }
}

/**
 * Production HTTP/REST-based email provider communicating directly with Resend API.
 */
export class RestEmailProvider implements IEmailProvider {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string, endpoint = 'https://api.resend.com/emails') {
    this.apiKey = apiKey.trim();
    this.endpoint = endpoint;
  }

  async send(options: EmailSendOptions): Promise<EmailSendResult> {
    try {
      const payload: Record<string, any> = {
        from: options.from,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      if (options.replyTo) {
        payload.reply_to = options.replyTo;
      }

      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();
      let responseJson: any = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        // Raw text response
      }

      if (!res.ok) {
        const errorMsg =
          responseJson?.message ||
          responseJson?.error?.message ||
          `HTTP ${res.status}: ${responseText || 'Unknown Resend error'}`;

        let errorCategory = 'TRANSIENT_PROVIDER_ERROR';
        if (res.status === 401) {
          errorCategory = 'AUTHENTICATION_ERROR';
        } else if (res.status === 403) {
          if (/domain|verify|verified/i.test(errorMsg)) {
            errorCategory = 'DOMAIN_NOT_VERIFIED';
          } else {
            errorCategory = 'ACCESS_DENIED';
          }
        } else if (res.status === 422) {
          errorCategory = 'VALIDATION_ERROR';
        } else if (res.status === 429) {
          errorCategory = 'RATE_LIMIT_EXCEEDED';
        } else if (res.status >= 500) {
          errorCategory = 'PROVIDER_UNAVAILABLE';
        }

        console.error(`[RestEmailProvider:Failure] Status ${res.status} [${errorCategory}]: ${errorMsg}`);

        const isPermanent =
          errorCategory === 'AUTHENTICATION_ERROR' ||
          errorCategory === 'DOMAIN_NOT_VERIFIED' ||
          errorCategory === 'VALIDATION_ERROR' ||
          errorCategory === 'ACCESS_DENIED';

        return {
          success: false,
          provider: 'resend',
          statusCode: res.status,
          error: errorMsg,
          errorCategory,
          isPermanent,
        };
      }

      const messageId = responseJson?.id;
      if (!messageId) {
        console.error('[RestEmailProvider:Failure] Resend returned HTTP 200 without a valid message ID:', responseText);
        return {
          success: false,
          provider: 'resend',
          statusCode: res.status,
          error: 'Resend response missing provider message ID',
          errorCategory: 'INVALID_PROVIDER_RESPONSE',
          isPermanent: true,
        };
      }

      console.log(`[RestEmailProvider:Success] Email accepted by Resend API. id=${messageId} to=${options.to}`);

      return {
        success: true,
        provider: 'resend',
        statusCode: res.status,
        messageId,
      };
    } catch (err: any) {
      console.error('[RestEmailProvider:Exception]', err);
      return {
        success: false,
        provider: 'resend',
        error: err.message || 'Network exception communicating with Resend API',
        errorCategory: 'NETWORK_ERROR',
        isPermanent: false,
      };
    }
  }
}

/**
 * Fallback provider that fails clearly when RESEND_API_KEY is not configured in production.
 * Ensures the system never marks an email as 'sent' when no provider is configured.
 */
export class MissingCredentialsProvider implements IEmailProvider {
  private reason: string;

  constructor(reason = 'RESEND_API_KEY is not configured in environment.') {
    this.reason = reason;
  }

  async send(options: EmailSendOptions): Promise<EmailSendResult> {
    const errorMsg = `[Email Provider Failure] ${this.reason} Cannot send email to ${options.to}.`;
    console.error(errorMsg);
    return {
      success: false,
      provider: 'resend',
      error: errorMsg,
      errorCategory: 'MISSING_PROVIDER_CREDENTIALS',
      isPermanent: true,
    };
  }
}

/**
 * Factory to retrieve the active email provider.
 * Guarantees that production environments fail loudly if RESEND_API_KEY is absent,
 * preventing silent failures and false "sent" reports.
 */
export function getEmailProvider(): IEmailProvider {
  const config = getEmailConfig();

  // 1. If valid Resend API key is present, use the real REST provider
  if (config.resendApiKey) {
    if (process.env.NODE_ENV === 'test' && process.env.FORCE_MOCK_EMAIL === 'true') {
      return new LoggedEmailProvider();
    }
    return new RestEmailProvider(config.resendApiKey);
  }

  // 2. If no Resend key, check if mock provider is permitted (test or explicit ALLOW_MOCK_EMAIL=true)
  if (config.allowMockEmail) {
    console.warn('[EmailProvider] RESEND_API_KEY not configured. Falling back to LoggedEmailProvider (allowed via test/ALLOW_MOCK_EMAIL=true).');
    return new LoggedEmailProvider();
  }

  // 3. Strict production failure: NEVER report sent if provider credentials are missing
  return new MissingCredentialsProvider(
    'RESEND_API_KEY is missing in environment. Production transactional email requires a valid Resend API key.'
  );
}
