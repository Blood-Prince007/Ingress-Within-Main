import { supabase } from '../../db';
import { EmailTemplates } from '../../email/emailTemplates';
import { getEmailProvider } from '../../email/emailProvider';
import { getFormattedSender, getReplyToAddress } from '../../email/emailConfig';
import { SendEmailOptions, EmailDeliveryRecord } from '../../email/emailTypes';
import { validateAndNormalizeEmail } from '../../email/emailValidation';
import { ApiUsageService } from '../../admin/apiUsageService';

// In-memory idempotency cache to protect against microsecond double-clicks / concurrent worker ticks
const memoryIdempotencySet = new Map<string, { status: string; timestamp: number }>();

export class EmailWorkerError extends Error {
  public isPermanent: boolean;
  public errorCategory: string;

  constructor(message: string, isPermanent = false, errorCategory = 'TRANSIENT_FAILURE') {
    super(message);
    this.name = 'EmailWorkerError';
    this.isPermanent = isPermanent;
    this.errorCategory = errorCategory;
  }
}

/**
 * Core processor for transactional email jobs.
 * Enforces strict delivery tracking, idempotent deduping, and transient vs permanent error classification.
 */
export async function processEmailJob(
  jobData: SendEmailOptions & { attempt?: number; maxAttempts?: number }
): Promise<EmailDeliveryRecord | null> {
  const attempt = jobData.attempt || 1;
  const maxAttempts = jobData.maxAttempts || 4;
  const idempotencyKey = jobData.idempotencyKey || null;

  // 1. Strict Server-Side Email Validation & CRLF Injection Defense
  const validation = validateAndNormalizeEmail(jobData.recipient.email);
  if (!validation.valid) {
    const errorMsg = validation.error || 'Invalid recipient email address';
    console.error(`[EmailWorker] Permanent Failure for ${jobData.recipient.email}: ${errorMsg}`);

    if (idempotencyKey) {
      await supabase
        .from('email_deliveries')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          last_error: errorMsg,
          last_error_category: 'INVALID_RECIPIENT_EMAIL',
        })
        .eq('idempotency_key', idempotencyKey);
    }

    throw new EmailWorkerError(errorMsg, true, 'INVALID_RECIPIENT_EMAIL');
  }

  const normalizedTo = validation.normalizedEmail!;

  // 2. Deterministic Idempotency Guard
  if (idempotencyKey) {
    const cached = memoryIdempotencySet.get(idempotencyKey);
    if (cached && (cached.status === 'sent' || cached.status === 'delivered')) {
      console.log(`[EmailWorker] In-memory idempotency hit for "${idempotencyKey}". Skipping duplicate send.`);
      return null;
    }

    try {
      const { data: existing } = await supabase
        .from('email_deliveries')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (existing && (existing.status === 'sent' || existing.status === 'delivered')) {
        console.log(`[EmailWorker] DB idempotency hit for key "${idempotencyKey}". Already ${existing.status}.`);
        memoryIdempotencySet.set(idempotencyKey, { status: existing.status, timestamp: Date.now() });
        return existing as EmailDeliveryRecord;
      }
    } catch (dbErr) {
      console.warn('[EmailWorker] Idempotency DB check notice:', dbErr);
    }
  }

  // 3. Render Template
  const templateRenderer = EmailTemplates[jobData.templateKey];
  if (!templateRenderer) {
    const errorMsg = `Email template renderer "${jobData.templateKey}" not found.`;
    console.error(`[EmailWorker] ${errorMsg}`);
    throw new EmailWorkerError(errorMsg, true, 'MISSING_TEMPLATE');
  }

  const rendered = templateRenderer(jobData.templateData);

  // 4. Upsert/Record in-flight delivery state in DB
  let deliveryId: string | null = null;
  const now = new Date().toISOString();

  try {
    const deliveryPayload: Record<string, any> = {
      event_type: jobData.eventType,
      recipient_type: jobData.recipient.type,
      recipient_id: jobData.recipient.id || null,
      recipient_email: normalizedTo,
      template_key: jobData.templateKey,
      subject: rendered.subject,
      body_html: rendered.html,
      body_text: rendered.text,
      entity_type: jobData.entityType || null,
      entity_id: jobData.entityId || null,
      status: 'sending',
      attempt_count: attempt,
      provider: 'resend',
      metadata: {
        ...(jobData.metadata || {}),
        templateKey: jobData.templateKey,
      },
    };

    if (idempotencyKey) {
      deliveryPayload.idempotency_key = idempotencyKey;
    }

    const { data: record, error: insertErr } = await supabase
      .from('email_deliveries')
      .upsert(deliveryPayload, {
        onConflict: idempotencyKey ? 'idempotency_key' : undefined,
      })
      .select('*')
      .single();

    if (!insertErr && record) {
      deliveryId = record.id;
    }
  } catch (upsertErr) {
    console.warn('[EmailWorker] Failed to record in-flight delivery in DB:', upsertErr);
  }

  // 5. Provider Dispatch & Safe Latency Telemetry
  const provider = getEmailProvider();
  const formattedSender = getFormattedSender();
  const replyTo = getReplyToAddress();
  const emailStart = Date.now();
  let sendResult;

  try {
    sendResult = await provider.send({
      to: normalizedTo,
      from: formattedSender,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      replyTo,
    });
  } catch (dispatchErr: any) {
    sendResult = {
      success: false,
      provider: 'resend' as const,
      error: dispatchErr.message || 'Network exception in email provider',
      errorCategory: 'NETWORK_ERROR',
    };
  }

  const emailLatency = Date.now() - emailStart;

  // Record Telemetry
  ApiUsageService.recordEvent({
    provider: 'email',
    service: jobData.eventType || 'transactional_email',
    endpoint: 'emailProvider.send',
    statusCode: sendResult.statusCode || (sendResult.success ? 200 : 500),
    success: sendResult.success,
    latencyMs: emailLatency,
    metadata: {
      templateKey: jobData.templateKey,
      recipientType: jobData.recipient.type,
      attempt,
      providerType: sendResult.provider,
    },
    errorCategory: sendResult.success ? null : (sendResult.errorCategory || 'DISPATCH_FAILURE'),
  });

  // 6. Handle Outcome (Success vs Retry vs Permanent Failure)
  const finishTime = new Date().toISOString();

  if (sendResult.success) {
    const messageId = sendResult.messageId!;
    if (idempotencyKey) {
      memoryIdempotencySet.set(idempotencyKey, { status: 'sent', timestamp: Date.now() });
    }

    try {
      await supabase
        .from('email_deliveries')
        .update({
          status: 'sent',
          sent_at: finishTime,
          provider: sendResult.provider,
          provider_message_id: messageId,
          last_error: null,
          last_error_category: null,
        })
        .match(deliveryId ? { id: deliveryId } : { idempotency_key: idempotencyKey });
    } catch (updateErr) {
      console.warn('[EmailWorker] DB sent status update notice:', updateErr);
    }

    return {
      id: deliveryId || `temp_${Date.now()}`,
      eventType: jobData.eventType,
      recipientType: jobData.recipient.type,
      recipientId: jobData.recipient.id || null,
      recipientEmail: normalizedTo,
      templateKey: jobData.templateKey,
      subject: rendered.subject,
      bodyHtml: rendered.html,
      bodyText: rendered.text,
      entityType: jobData.entityType || null,
      entityId: jobData.entityId || null,
      status: 'sent',
      idempotencyKey,
      provider: sendResult.provider,
      providerMessageId: messageId,
      attemptCount: attempt,
      lastError: null,
      sentAt: finishTime,
      createdAt: now,
    };
  }

  // Failure scenario
  const rawErr = sendResult.error || 'Unknown email dispatch failure';
  const category = sendResult.errorCategory || 'TRANSIENT_PROVIDER_ERROR';

  // Permanent failure classification:
  // Missing credentials, unverified domain, invalid email, auth errors MUST NOT be blindly retried in loops
  const isPermanent =
    category === 'MISSING_PROVIDER_CREDENTIALS' ||
    category === 'AUTHENTICATION_ERROR' ||
    category === 'DOMAIN_NOT_VERIFIED' ||
    category === 'VALIDATION_ERROR' ||
    category === 'INVALID_RECIPIENT_EMAIL' ||
    /invalid email|suppressed|blacklisted|hard bounce|malformed|missing|not verified/i.test(rawErr);

  const willRetry = !isPermanent && attempt < maxAttempts;
  const nextStatus = willRetry ? 'retrying' : 'failed';

  try {
    await supabase
      .from('email_deliveries')
      .update({
        status: nextStatus,
        failed_at: willRetry ? null : finishTime,
        provider: sendResult.provider,
        last_error: rawErr,
        last_error_category: category,
      })
      .match(deliveryId ? { id: deliveryId } : { idempotency_key: idempotencyKey });
  } catch (statusErr) {
    console.warn('[EmailWorker] DB failed/retrying update notice:', statusErr);
  }

  if (willRetry) {
    console.warn(`[EmailWorker] Transient email failure (attempt ${attempt}/${maxAttempts}). Will retry. Category: ${category}. Error: ${rawErr}`);
    throw new EmailWorkerError(rawErr, false, category);
  } else {
    console.error(`[EmailWorker] Permanent or terminal email failure (attempt ${attempt}/${maxAttempts}). Category: ${category}. Halting retries. Error: ${rawErr}`);
    throw new EmailWorkerError(rawErr, true, category);
  }
}
