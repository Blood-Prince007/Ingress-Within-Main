/**
 * Ingress Within — Transactional Email Configuration
 * Centralized, fail-safe environment variable resolution, sender parsing, and mode control.
 */

export interface EmailConfig {
  resendApiKey: string | null;
  fromAddress: string;
  fromName: string;
  replyTo: string;
  adminNotificationEmail: string;
  opsTeamEmail: string;
  webhookSecret: string | null;
  dispatchMode: 'queue' | 'immediate';
  isProduction: boolean;
  allowMockEmail: boolean;
}

export function getEmailConfig(): EmailConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true';

  const resendApiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : null;
  const fromAddress = process.env.EMAIL_FROM ? process.env.EMAIL_FROM.trim() : 'care@ingresswithin.com';
  const fromName = process.env.EMAIL_FROM_NAME ? process.env.EMAIL_FROM_NAME.trim() : 'Ingress Within';
  const replyTo = process.env.EMAIL_REPLY_TO ? process.env.EMAIL_REPLY_TO.trim() : 'contactus@ingresswithin.com';
  
  const adminNotificationEmail =
    process.env.THERAPIST_APPLICATION_NOTIFICATION_EMAIL?.trim() ||
    process.env.OPS_TEAM_EMAIL?.trim() ||
    'contactus@ingresswithin.com';

  const opsTeamEmail = process.env.OPS_TEAM_EMAIL?.trim() || 'care@ingresswithin.com';
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim() || process.env.EMAIL_WEBHOOK_SECRET?.trim() || null;

  // By default, dispatch immediately so emails are always sent via the Resend API
  // without hanging or depending on an external BullMQ/Redis worker process.
  // Only use BullMQ queue if EMAIL_DISPATCH_MODE is explicitly set to 'queue' AND BYPASS_REDIS !== 'true'.
  const dispatchMode =
    process.env.EMAIL_DISPATCH_MODE === 'queue' && process.env.BYPASS_REDIS !== 'true'
      ? 'queue'
      : 'immediate';


  // Mock email provider can only be selected in test environments or if explicitly opted in via ALLOW_MOCK_EMAIL=true.
  // It is NEVER silently selected in production.
  const allowMockEmail = isTest || process.env.ALLOW_MOCK_EMAIL === 'true';

  return {
    resendApiKey,
    fromAddress,
    fromName,
    replyTo,
    adminNotificationEmail,
    opsTeamEmail,
    webhookSecret,
    dispatchMode,
    isProduction,
    allowMockEmail,
  };
}

/**
 * Returns formatted RFC 5322 sender string, e.g. "Ingress Within <care@ingresswithin.com>"
 */
export function getFormattedSender(): string {
  const config = getEmailConfig();
  if (config.fromAddress.includes('<') && config.fromAddress.includes('>')) {
    return config.fromAddress;
  }
  return `"${config.fromName}" <${config.fromAddress}>`;
}

/**
 * Returns canonical reply-to address
 */
export function getReplyToAddress(): string {
  return getEmailConfig().replyTo;
}
