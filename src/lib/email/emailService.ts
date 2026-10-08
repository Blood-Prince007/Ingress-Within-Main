import { supabase } from '../db';
import { EmailEvents } from './emailEvents';
import { EmailTemplates } from './emailTemplates';
import { getEmailProvider } from './emailProvider';
import { getEmailConfig, getFormattedSender, getReplyToAddress } from './emailConfig';
import { SendEmailOptions, EmailDeliveryRecord, EmailDeliveryStatus } from './emailTypes';
import { validateAndNormalizeEmail } from './emailValidation';
import { ApiUsageService } from '../admin/apiUsageService';
import { processEmailJob } from '../queue/workers/emailWorker';
import { queueRegistry } from '../queue/registry';

export class EmailService {
  /**
   * Dispatches email immediately or records and executes delivery safely.
   * Fail-safe by default: Catches all errors so email issues NEVER break clinical or database transactions.
   */
  static async sendEmail(
    options: SendEmailOptions,
    failSafe = true
  ): Promise<EmailDeliveryRecord | null> {
    try {
      return await processEmailJob(options);
    } catch (err: any) {
      console.error('[EmailService] sendEmail error:', err.message || err);
      if (!failSafe) throw err;
      return null;
    }
  }

  /**
   * Controlled smoke-test sending ONE real email via the real provider pipeline.
   * Exercises: EmailService -> email_deliveries -> processEmailJob -> Resend API -> provider_message_id.
   * Exposes diagnostic details without leaking any API keys or secrets.
   */
  static async sendSmokeTestEmail(options: {
    recipientEmail: string;
    senderEmail?: string;
  }): Promise<{
    success: boolean;
    provider: 'resend' | 'mock';
    recipient?: string;
    messageId?: string;
    deliveryId?: string;
    status: string;
    errorCategory?: string;
    error?: string;
  }> {
    const validation = validateAndNormalizeEmail(options.recipientEmail);
    if (!validation.valid) {
      return {
        success: false,
        provider: 'resend',
        recipient: options.recipientEmail,
        status: 'failed',
        errorCategory: 'INVALID_RECIPIENT_EMAIL',
        error: validation.error || 'Invalid recipient email address',
      };
    }

    const testIdempotencyKey = `smoke_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const deliveryRecord = await processEmailJob({
        eventType: 'smoke_test',
        recipient: {
          email: validation.normalizedEmail!,
          name: 'Authorized Administrator',
          type: 'admin',
        },
        templateKey: 'therapist_application_received',
        templateData: {
          therapistName: 'System Administrator (Live Smoke Test)',
          statusUrl: 'https://ingresswithin.com/admin/emails',
        },
        idempotencyKey: testIdempotencyKey,
        metadata: {
          isSmokeTest: true,
          triggeredAt: new Date().toISOString(),
        },
      });

      return {
        success: deliveryRecord?.status === 'sent',
        provider: (deliveryRecord?.provider as any) || 'resend',
        recipient: validation.normalizedEmail!,
        messageId: deliveryRecord?.providerMessageId || undefined,
        deliveryId: deliveryRecord?.id || undefined,
        status: deliveryRecord?.status || 'failed',
        errorCategory: deliveryRecord?.lastErrorCategory || undefined,
        error: deliveryRecord?.lastError || undefined,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: 'resend',
        recipient: validation.normalizedEmail!,
        status: 'failed',
        errorCategory: err.errorCategory || 'SMOKE_TEST_FAILURE',
        error: err.message || 'Controlled smoke test failed to deliver',
      };
    }
  }

  /**
   * Asynchronously queues an email job into BullMQ (or runs background task).
   * Guarantees zero blocking of the calling API request.
   */
  static async queueEmail(
    options: SendEmailOptions,
    jobIdPrefix = 'email'
  ): Promise<{ queued: boolean; jobId?: string; deliveryRecord?: EmailDeliveryRecord | null }> {
    try {
      const emailValidation = validateAndNormalizeEmail(options.recipient.email);
      if (!emailValidation.valid) {
        console.warn('[EmailService.queueEmail] Invalid email address rejected:', emailValidation.error);
        return { queued: false };
      }

      const normalizedOptions: SendEmailOptions = {
        ...options,
        recipient: {
          ...options.recipient,
          email: emailValidation.normalizedEmail!,
        },
      };

      const finalJobId = options.idempotencyKey || `${jobIdPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const config = getEmailConfig();

      // 1. Record queued state in DB (fail-safe)
      const now = new Date().toISOString();
      try {
        const templateRenderer = EmailTemplates[options.templateKey];
        const rendered = templateRenderer ? templateRenderer(options.templateData) : null;

        await supabase
          .from('email_deliveries')
          .upsert(
            {
              event_type: options.eventType,
              recipient_type: options.recipient.type,
              recipient_id: options.recipient.id || null,
              recipient_email: emailValidation.normalizedEmail!,
              template_key: options.templateKey,
              subject: rendered?.subject || `Notification: ${options.eventType}`,
              body_html: rendered?.html || '',
              body_text: rendered?.text || '',
              entity_type: options.entityType || null,
              entity_id: options.entityId || null,
              status: 'queued',
              attempt_count: 0,
              provider: 'resend',
              idempotency_key: options.idempotencyKey || null,
              metadata: options.metadata || {},
              created_at: now,
            },
            { onConflict: options.idempotencyKey ? 'idempotency_key' : undefined }
          );
      } catch (dbErr) {
        console.warn('[EmailService.queueEmail] DB record notice:', dbErr);
      }

      // 2. Direct immediate dispatch (ideal for Vercel / serverless or when BYPASS_REDIS=true)
      if (config.dispatchMode === 'immediate') {
        try {
          const deliveryRecord = await processEmailJob(normalizedOptions);
          return { queued: true, jobId: finalJobId, deliveryRecord };
        } catch (jobErr: any) {
          console.error('[EmailService.queueEmail] Immediate delivery execution error:', jobErr.message || jobErr);
          return { queued: false, jobId: finalJobId };
        }
      }

      // 3. Enqueue in BullMQ if dispatchMode is 'queue'
      try {
        const enqueuePromise = queueRegistry.addJob(
          'transactional_email',
          `send_${options.templateKey}`,
          normalizedOptions,
          finalJobId,
          {
            attempts: 4,
            backoff: { type: 'custom' },
            removeOnComplete: true,
          }
        );
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('BullMQ Redis connection timed out after 2000ms')), 2000)
        );
        await Promise.race([enqueuePromise, timeoutPromise]);
        return { queued: true, jobId: finalJobId };
      } catch (qErr) {
        // Fail-safe fallback: execute direct dispatch so emails are NEVER dropped or hung
        console.warn('[EmailService.queueEmail] BullMQ queueing unavailable or timed out, executing direct dispatch:', qErr);
        try {
          const deliveryRecord = await processEmailJob(normalizedOptions);
          return { queued: true, jobId: finalJobId, deliveryRecord };
        } catch (jobErr) {
          console.error('[EmailService] Direct fallback delivery failed:', jobErr);
          return { queued: false, jobId: finalJobId };
        }
      }

    } catch (err: any) {
      console.warn('[EmailService.queueEmail] Non-blocking notice:', err.message || err);
      return { queued: false };
    }
  }


  // =========================================================================
  // THERAPIST WORKFLOW NOTIFICATIONS (ONBOARDING, VERIFICATION, DECISIONS)
  // =========================================================================

  /**
   * Triggered when a new therapist application is formally submitted.
   * Sends:
   * 1. Notification to official admin address (contactus@ingresswithin.com)
   * 2. Confirmation receipt to the therapist applicant.
   */
  static async notifyTherapistApplicationSubmitted(payload: {
    therapistAccountId: string;
    therapistName: string;
    email: string;
    specialization?: string | string[];
    experienceYears?: number;
    submittedAt?: string;
    applicationId?: string;
  }) {
    const submittedAtIso = payload.submittedAt || new Date().toISOString();

    // 1. Admin Notification to contactus@ingresswithin.com
    await this.queueEmail({
      eventType: EmailEvents.THERAPIST_APPLICATION_SUBMITTED_ADMIN,
      recipient: {
        email: getEmailConfig().adminNotificationEmail,
        name: 'Ingress Within Clinical Admin',
        type: 'admin',
      },
      templateKey: 'therapist_application_submitted_admin',
      templateData: {
        therapistName: payload.therapistName,
        email: payload.email,
        specialization: payload.specialization,
        experience: payload.experienceYears,
        submittedAt: submittedAtIso,
        adminReviewUrl: 'https://ingresswithin.com/admin/applications',
      },
      entityType: 'application',
      entityId: payload.applicationId || payload.therapistAccountId,
      idempotencyKey: `therapist_app_sub_admin:${payload.therapistAccountId}:${submittedAtIso.substring(0, 16)}`,
      metadata: {
        therapistAccountId: payload.therapistAccountId,
      },
    });

    // 2. Confirmation email to the therapist applicant
    await this.queueEmail({
      eventType: EmailEvents.THERAPIST_APPLICATION_RECEIVED,
      recipient: {
        email: payload.email,
        name: payload.therapistName,
        type: 'therapist',
        id: payload.therapistAccountId,
      },
      templateKey: 'therapist_application_received',
      templateData: {
        therapistName: payload.therapistName,
        statusUrl: 'https://ingresswithin.com/therapist/application/status',
      },
      entityType: 'application',
      entityId: payload.applicationId || payload.therapistAccountId,
      idempotencyKey: `therapist_app_rec_conf:${payload.therapistAccountId}:${submittedAtIso.substring(0, 16)}`,
      metadata: {
        therapistAccountId: payload.therapistAccountId,
      },
    });
  }

  /**
   * Triggered when an admin approves a therapist application.
   */
  static async notifyTherapistApplicationApproved(payload: {
    therapistAccountId: string;
    therapistName: string;
    email: string;
    applicationId?: string;
  }) {
    await this.queueEmail({
      eventType: EmailEvents.THERAPIST_APPLICATION_APPROVED,
      recipient: {
        email: payload.email,
        name: payload.therapistName,
        type: 'therapist',
        id: payload.therapistAccountId,
      },
      templateKey: 'therapist_application_approved',
      templateData: {
        therapistName: payload.therapistName,
        dashboardUrl: 'https://ingresswithin.com/therapist',
      },
      entityType: 'therapist',
      entityId: payload.therapistAccountId,
      idempotencyKey: `therapist_app_approved:${payload.therapistAccountId}`,
      metadata: {
        therapistAccountId: payload.therapistAccountId,
      },
    });
  }

  /**
   * Triggered when an admin rejects a therapist application with a specific reason.
   */
  static async notifyTherapistApplicationRejected(payload: {
    therapistAccountId: string;
    therapistName: string;
    email: string;
    rejectionReason: string;
    applicationId?: string;
  }) {
    await this.queueEmail({
      eventType: EmailEvents.THERAPIST_APPLICATION_REJECTED,
      recipient: {
        email: payload.email,
        name: payload.therapistName,
        type: 'therapist',
        id: payload.therapistAccountId,
      },
      templateKey: 'therapist_application_rejected',
      templateData: {
        therapistName: payload.therapistName,
        rejectionReason: payload.rejectionReason,
        reviewUrl: 'https://ingresswithin.com/therapist/application/status',
      },
      entityType: 'application',
      entityId: payload.applicationId || payload.therapistAccountId,
      idempotencyKey: `therapist_app_rejected:${payload.therapistAccountId}:${Date.now()}`,
      metadata: {
        therapistAccountId: payload.therapistAccountId,
        hasReason: Boolean(payload.rejectionReason),
      },
    });
  }

  // =========================================================================
  // EXISTING CARE CONNECTION & SESSION WORKFLOWS (PRESERVED)
  // =========================================================================

  /**
   * Dispatches match acceptance notice to client and ops team coordination notice.
   */
  /**
   * Sends an operational notification to a therapist when the server-side
   * matching engine creates a new candidate match.
   */
  static async notifyTherapistMatchRequest(data: {
    matchId: string;
    therapistId: string;
    therapistName: string;
    therapistEmail: string;
    rank: number;
    score: number;
  }) {
    return this.queueEmail({
      eventType: EmailEvents.THERAPIST_MATCH_REQUEST,
      recipient: {
        email: data.therapistEmail,
        name: data.therapistName,
        type: 'therapist',
        id: data.therapistId,
      },
      templateKey: 'therapist_match_request',
      templateData: {
        therapistName: data.therapistName,
        matchId: data.matchId,
        rank: data.rank,
        dashboardUrl: 'https://ingresswithin.com/therapist',
      },
      entityType: 'match',
      entityId: data.matchId,
      idempotencyKey: `therapy_match_request:${data.matchId}:${data.therapistId}`,
      metadata: {
        therapistAccountId: data.therapistId,
        matchRank: data.rank,
        matchScore: data.score,
      },
    });
  }

  /**
   * Dispatches match acceptance notice to client, acceptance confirmation to therapist, and ops coordination notice.
   */
  static async notifyTherapistAccepted(data: {
    matchId: string;
    therapistId: string;
    therapistName: string;
    therapistEmail?: string;
    clientId: string;
    clientEmail?: string;
    clientName?: string;
  }) {
    // 1. Client Notice (if client email is known)
    if (data.clientEmail) {
      await this.sendEmail({
        eventType: EmailEvents.THERAPIST_ACCEPTED_CLIENT,
        recipient: {
          email: data.clientEmail,
          name: data.clientName,
          type: 'client',
          id: data.clientId,
        },
        templateKey: 'therapist_accepted_client',
        templateData: {
          clientName: data.clientName,
          therapistName: data.therapistName,
        },
        entityType: 'match',
        entityId: data.matchId,
      });
    }

    // 2. Therapist Confirmation Notice (if therapist email is known)
    if (data.therapistEmail) {
      await this.sendEmail({
        eventType: EmailEvents.THERAPIST_ACCEPTED_CONFIRMATION,
        recipient: {
          email: data.therapistEmail,
          name: data.therapistName,
          type: 'therapist',
          id: data.therapistId,
        },
        templateKey: 'therapist_accepted_therapist_confirmation',
        templateData: {
          clientName: data.clientName,
          therapistName: data.therapistName,
          clientEmail: data.clientEmail || '',
          dashboardUrl: 'https://ingresswithin.com/therapist',
        },
        entityType: 'match',
        entityId: data.matchId,
      });
    }

    // 3. Operations Team Notice
    await this.sendEmail({
      eventType: EmailEvents.FIRST_SESSION_COORDINATION_REQUIRED,
      recipient: {
        email: getEmailConfig().opsTeamEmail,
        name: 'Clinical Ops Team',
        type: 'team',
      },
      templateKey: 'first_session_coordination_team',
      templateData: {
        matchId: data.matchId,
        therapistName: data.therapistName,
        clientEmail: data.clientEmail || 'Client email pending intake',
      },
      entityType: 'match',
      entityId: data.matchId,
    });
  }

  /**
   * Dispatches session confirmation email with Meet details.
   */
  static async notifySessionConfirmed(data: {
    appointmentId: string;
    scheduledStart: string;
    scheduledEnd?: string;
    googleMeetUrl?: string;
    clientEmail: string;
    therapistEmail: string;
    clientName?: string;
    therapistName?: string;
    bookingId?: string;
    bookingReference?: string;
    clientId?: string;
    therapistId?: string;
  }) {
    // Client
    await this.sendEmail({
      eventType: EmailEvents.SESSION_CONFIRMED,
      recipient: { email: data.clientEmail, name: data.clientName, type: 'client' },
      templateKey: 'session_confirmed',
      templateData: {
        recipientName: data.clientName,
        otherPartyName: data.therapistName || 'Your Therapist',
        scheduledStart: data.scheduledStart,
        googleMeetUrl: data.googleMeetUrl,
        bookingReference: data.bookingReference || data.appointmentId.substring(0, 8).toUpperCase(),
      },
      entityType: 'appointment',
      entityId: data.appointmentId,
    });

    // Therapist
    await this.sendEmail({
      eventType: EmailEvents.SESSION_CONFIRMED,
      recipient: { email: data.therapistEmail, name: data.therapistName, type: 'therapist' },
      templateKey: 'session_confirmed',
      templateData: {
        recipientName: data.therapistName,
        otherPartyName: data.clientName || 'Your Client',
        scheduledStart: data.scheduledStart,
        googleMeetUrl: data.googleMeetUrl,
        bookingReference: data.bookingReference || data.appointmentId.substring(0, 8).toUpperCase(),
      },
      entityType: 'appointment',
      entityId: data.appointmentId,
    });
  }

  /**
   * Dispatches session rescheduling notice.
   */
  static async notifySessionRescheduled(data: {
    appointmentId: string;
    oldStart?: string;
    previousStart?: string;
    newStart: string;
    clientEmail: string;
    therapistEmail: string;
    clientName?: string;
    therapistName?: string;
    googleMeetUrl?: string;
  }) {
    const effectiveOldStart = data.oldStart || data.previousStart || '';

    // Client
    await this.sendEmail({
      eventType: EmailEvents.SESSION_RESCHEDULED,
      recipient: { email: data.clientEmail, name: data.clientName, type: 'client' },
      templateKey: 'session_rescheduled',
      templateData: {
        recipientName: data.clientName,
        otherPartyName: data.therapistName || 'Therapist',
        oldStart: effectiveOldStart,
        newStart: data.newStart,
        googleMeetUrl: data.googleMeetUrl,
      },
      entityType: 'appointment',
      entityId: data.appointmentId,
    });

    // Therapist
    await this.sendEmail({
      eventType: EmailEvents.SESSION_RESCHEDULED,
      recipient: { email: data.therapistEmail, name: data.therapistName, type: 'therapist' },
      templateKey: 'session_rescheduled',
      templateData: {
        recipientName: data.therapistName,
        otherPartyName: data.clientName || 'Client',
        oldStart: data.oldStart,
        newStart: data.newStart,
        googleMeetUrl: data.googleMeetUrl,
      },
      entityType: 'appointment',
      entityId: data.appointmentId,
    });
  }

  /**
   * Dispatches cancellation notice.
   */
  static async notifySessionCancelled(data: {
    appointmentId: string;
    scheduledStart: string;
    clientEmail: string;
    therapistEmail: string;
    clientName?: string;
    therapistName?: string;
    reason?: string;
    refundStatus?: string;
  }) {
    // Client
    await this.sendEmail({
      eventType: EmailEvents.SESSION_CANCELLED,
      recipient: { email: data.clientEmail, name: data.clientName, type: 'client' },
      templateKey: 'session_cancelled',
      templateData: {
        recipientName: data.clientName,
        otherPartyName: data.therapistName || 'Therapist',
        scheduledStart: data.scheduledStart,
        reason: data.reason,
        refundStatus: data.refundStatus,
      },
      entityType: 'appointment',
      entityId: data.appointmentId,
    });

    // Therapist
    await this.sendEmail({
      eventType: EmailEvents.SESSION_CANCELLED,
      recipient: { email: data.therapistEmail, name: data.therapistName, type: 'therapist' },
      templateKey: 'session_cancelled',
      templateData: {
        recipientName: data.therapistName,
        otherPartyName: data.clientName || 'Client',
        scheduledStart: data.scheduledStart,
        reason: data.reason,
        refundStatus: data.refundStatus,
      },
      entityType: 'appointment',
      entityId: data.appointmentId,
    });
  }

  /**
   * Dispatches refund confirmation notice.
   */
  static async notifyRefundInitiated(data: {
    clientEmail: string;
    clientName?: string;
    amountPaise: number;
    refundId: string;
    bookingId?: string;
  }) {
    await this.sendEmail({
      eventType: EmailEvents.REFUND_INITIATED,
      recipient: { email: data.clientEmail, name: data.clientName, type: 'client' },
      templateKey: 'refund_initiated',
      templateData: {
        recipientName: data.clientName,
        amountPaise: data.amountPaise,
        refundId: data.refundId,
      },
      entityType: 'refund',
      entityId: data.bookingId,
    });
  }

  /**
   * Dispatches no-show notice.
   */
  static async notifyNoShow(data: {
    appointmentId: string;
    scheduledStart: string;
    clientEmail: string;
    therapistEmail: string;
    clientName?: string;
    therapistName?: string;
    attendanceStatus: 'client_no_show' | 'therapist_no_show';
  }) {
    const isClientNoShow = data.attendanceStatus === 'client_no_show';
    const eventType = isClientNoShow ? EmailEvents.CLIENT_NO_SHOW : EmailEvents.THERAPIST_NO_SHOW;

    await this.sendEmail({
      eventType,
      recipient: { email: data.clientEmail, name: data.clientName, type: 'client' },
      templateKey: 'no_show_recorded',
      templateData: {
        recipientName: data.clientName,
        attendanceStatus: data.attendanceStatus,
        scheduledStart: data.scheduledStart,
      },
      entityType: 'appointment',
      entityId: data.appointmentId,
    });
  }

  // =========================================================================
  // ADMIN OBSERVABILITY, LOGGING & DELIVERY STATUS
  // =========================================================================

  /**
   * Returns paginated email deliveries for administrative auditing.
   * Strictly filters out raw email bodies containing clinical notes or credentials.
   */
  static async getEmailDeliveries(params: {
    page?: number;
    limit?: number;
    status?: string;
    eventType?: string;
    search?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    try {
      let query = supabase
        .from('email_deliveries')
        .select(
          'id, event_type, recipient_type, recipient_id, recipient_email, template_key, subject, entity_type, entity_id, status, idempotency_key, provider, provider_message_id, attempt_count, last_error, last_error_category, sent_at, delivered_at, failed_at, created_at',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }
      if (params.eventType && params.eventType !== 'all') {
        query = query.eq('event_type', params.eventType);
      }
      if (params.search) {
        query = query.or(`recipient_email.ilike.%${params.search}%,subject.ilike.%${params.search}%`);
      }

      const { data, count, error } = await query;
      if (error) {
        if (error.message.includes('column')) {
          const { data: fallbackData, count: fallbackCount } = await supabase
            .from('email_deliveries')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

          if (fallbackData) {
            return {
              deliveries: fallbackData,
              pagination: {
                page,
                limit,
                total: fallbackCount || 0,
                pages: Math.ceil((fallbackCount || 0) / limit),
              },
            };
          }
        }
        console.warn('[EmailService.getEmailDeliveries] DB error:', error.message);
        return {
          deliveries: [],
          pagination: { page, limit, total: 0, pages: 0 },
        };
      }

      return {
        deliveries: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (err: any) {
      console.warn('[EmailService.getEmailDeliveries] Exception:', err.message);
      return {
        deliveries: [],
        pagination: { page, limit, total: 0, pages: 0 },
      };
    }
  }

  /**
   * Aggregates email delivery health metrics for the Admin System Health dashboard.
   */
  static async getEmailHealthMetrics(): Promise<{
    status: 'healthy' | 'degraded' | 'error';
    total: number;
    queued: number;
    sent: number;
    delivered: number;
    failed: number;
    retrying: number;
    bounceRatePercent: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('email_deliveries')
        .select('status')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error || !data) {
        return {
          status: 'healthy',
          total: 0,
          queued: 0,
          sent: 0,
          delivered: 0,
          failed: 0,
          retrying: 0,
          bounceRatePercent: 0,
        };
      }

      let queued = 0;
      let sent = 0;
      let delivered = 0;
      let failed = 0;
      let retrying = 0;

      for (const row of data) {
        if (row.status === 'queued') queued++;
        else if (row.status === 'sent') sent++;
        else if (row.status === 'delivered') delivered++;
        else if (row.status === 'failed') failed++;
        else if (row.status === 'retrying') retrying++;
      }

      const total = data.length;
      const bounceRatePercent = total > 0 ? Math.round((failed / total) * 1000) / 10 : 0;

      let status: 'healthy' | 'degraded' | 'error' = 'healthy';
      if (bounceRatePercent > 10 || failed > 25) {
        status = 'error';
      } else if (bounceRatePercent > 3 || retrying > 5) {
        status = 'degraded';
      }

      return {
        status,
        total,
        queued,
        sent,
        delivered,
        failed,
        retrying,
        bounceRatePercent,
      };
    } catch {
      return {
        status: 'healthy',
        total: 0,
        queued: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        retrying: 0,
        bounceRatePercent: 0,
      };
    }
  }

  /**
   * Processes email provider webhooks (e.g., Resend delivered/bounced events).
   */
  static async handleProviderWebhook(event: {
    type: 'email.delivered' | 'email.bounced' | 'email.complained';
    messageId: string;
    timestamp?: string;
    reason?: string;
  }): Promise<{ updated: boolean }> {
    try {
      const now = event.timestamp || new Date().toISOString();
      const isDelivered = event.type === 'email.delivered';
      const isBounce = event.type === 'email.bounced' || event.type === 'email.complained';

      const updateData: Record<string, any> = {};

      if (isDelivered) {
        updateData.status = 'delivered';
        updateData.delivered_at = now;
      } else if (isBounce) {
        updateData.status = 'failed';
        updateData.failed_at = now;
        updateData.last_error = event.reason || `Provider webhook status: ${event.type}`;
        updateData.last_error_category = event.type === 'email.bounced' ? 'BOUNCE' : 'COMPLAINT';
      }

      const { data, error } = await supabase
        .from('email_deliveries')
        .update(updateData)
        .eq('provider_message_id', event.messageId)
        .select('id');

      return { updated: !error && Boolean(data && data.length > 0) };
    } catch (err: any) {
      console.warn('[EmailService.handleProviderWebhook] Exception:', err.message);
      return { updated: false };
    }
  }
}
