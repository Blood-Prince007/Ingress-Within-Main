import { supabase } from '../db';
import { EmailEvents } from './emailEvents';
import { EmailTemplates } from './emailTemplates';
import { getEmailProvider } from './emailProvider';
import { SendEmailOptions, EmailDeliveryRecord } from './emailTypes';
import { ApiUsageService } from '../admin/apiUsageService';

const DEFAULT_SENDER = process.env.EMAIL_FROM || 'care@ingresswithin.com';
const OPS_TEAM_EMAIL = process.env.OPS_TEAM_EMAIL || 'clinical-ops@ingresswithin.com';

export class EmailService {
  /**
   * Main dispatch method. Idempotently tracks delivery in email_deliveries.
   * By default, catches errors and logs them so an email outage will NEVER
   * crash or roll back clinical transactions or payment webhooks.
   */
  static async sendEmail(
    options: SendEmailOptions,
    failSafe = true
  ): Promise<EmailDeliveryRecord | null> {
    try {
      const templateRenderer = EmailTemplates[options.templateKey];
      if (!templateRenderer) {
        console.warn(`[EmailService] Template key "${options.templateKey}" not found.`);
        return null;
      }

      const rendered = templateRenderer(options.templateData);

      // 1. Record pending delivery in DB
      let deliveryId: string | null = null;
      try {
        const { data: record, error: dbErr } = await supabase
          .from('email_deliveries')
          .insert({
            event_type: options.eventType,
            recipient_type: options.recipient.type,
            recipient_id: options.recipient.id || null,
            recipient_email: options.recipient.email,
            template_key: options.templateKey,
            subject: rendered.subject,
            body_html: rendered.html,
            body_text: rendered.text,
            entity_type: options.entityType || null,
            entity_id: options.entityId || null,
            status: 'pending',
            attempt_count: 1,
            metadata: options.metadata || {},
          })
          .select('*')
          .single();

        if (!dbErr && record) {
          deliveryId = record.id;
        }
      } catch (insertErr) {
        console.warn('[EmailService] Failed to insert initial delivery record:', insertErr);
      }

      // 2. Dispatch via provider
      const provider = getEmailProvider();
      const emailStart = Date.now();
      const sendResult = await provider.send({
        to: options.recipient.email,
        from: DEFAULT_SENDER,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });
      const emailLatency = Date.now() - emailStart;

      ApiUsageService.recordEvent({
        provider: 'email',
        service: options.eventType || 'transactional_email',
        endpoint: 'emailProvider.send',
        statusCode: sendResult.success ? 200 : 500,
        success: sendResult.success,
        latencyMs: emailLatency,
        metadata: {
          templateKey: options.templateKey,
          recipientType: options.recipient.type,
        },
        errorCategory: sendResult.success ? null : 'DISPATCH_FAILURE',
      });

      // 3. Update delivery status
      const now = new Date().toISOString();
      if (deliveryId) {
        if (sendResult.success) {
          await supabase
            .from('email_deliveries')
            .update({
              status: 'sent',
              sent_at: now,
            })
            .eq('id', deliveryId);
        } else {
          await supabase
            .from('email_deliveries')
            .update({
              status: 'failed',
              last_error: sendResult.error || 'Provider rejected email',
            })
            .eq('id', deliveryId);
        }
      }

      return {
        id: deliveryId || `temp_${Date.now()}`,
        eventType: options.eventType,
        recipientType: options.recipient.type,
        recipientId: options.recipient.id || null,
        recipientEmail: options.recipient.email,
        templateKey: options.templateKey,
        subject: rendered.subject,
        bodyHtml: rendered.html,
        bodyText: rendered.text,
        entityType: options.entityType || null,
        entityId: options.entityId || null,
        status: sendResult.success ? 'sent' : 'failed',
        attemptCount: 1,
        lastError: sendResult.error || null,
        sentAt: sendResult.success ? now : null,
        createdAt: now,
      };
    } catch (err: any) {
      console.error('[EmailService] Unexpected failure during email processing:', err);
      if (!failSafe) {
        throw err;
      }
      return null;
    }
  }

  /**
   * Dispatches match acceptance notice to client and ops team coordination notice.
   */
  static async notifyTherapistAccepted(data: {
    matchId: string;
    therapistId: string;
    therapistName: string;
    clientId: string;
    clientEmail: string;
    clientName?: string;
  }) {
    // 1. Notify Client
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

    // 2. Notify Ingress Within Care Coordination Team
    await this.sendEmail({
      eventType: EmailEvents.FIRST_SESSION_COORDINATION_REQUIRED,
      recipient: {
        email: OPS_TEAM_EMAIL,
        name: 'Care Coordination Ops',
        type: 'team',
      },
      templateKey: 'first_session_coordination_team',
      templateData: {
        matchId: data.matchId,
        therapistName: data.therapistName,
        clientEmail: data.clientEmail,
      },
      entityType: 'match',
      entityId: data.matchId,
    });
  }

  /**
   * Dispatches session confirmation emails with Google Meet URL to both parties.
   */
  static async notifySessionConfirmed(data: {
    bookingId?: string;
    appointmentId?: string;
    bookingReference: string;
    scheduledStart: string;
    scheduledEnd: string;
    clientEmail: string;
    therapistEmail: string;
    clientName?: string;
    therapistName?: string;
    googleMeetUrl?: string;
    clientId?: string;
    therapistId?: string;
  }) {
    // Send to Client
    await this.sendEmail({
      eventType: EmailEvents.SESSION_CONFIRMED,
      recipient: {
        email: data.clientEmail,
        name: data.clientName,
        type: 'client',
        id: data.clientId,
      },
      templateKey: 'session_confirmed',
      templateData: {
        recipientName: data.clientName,
        otherPartyName: data.therapistName || 'Your Therapist',
        scheduledStart: data.scheduledStart,
        googleMeetUrl: data.googleMeetUrl,
        bookingReference: data.bookingReference,
      },
      entityType: 'appointment',
      entityId: data.appointmentId,
    });

    // Send to Therapist
    await this.sendEmail({
      eventType: EmailEvents.SESSION_CONFIRMED,
      recipient: {
        email: data.therapistEmail,
        name: data.therapistName,
        type: 'therapist',
        id: data.therapistId,
      },
      templateKey: 'session_confirmed',
      templateData: {
        recipientName: data.therapistName,
        otherPartyName: data.clientName || 'Your Client',
        scheduledStart: data.scheduledStart,
        googleMeetUrl: data.googleMeetUrl,
        bookingReference: data.bookingReference,
      },
      entityType: 'appointment',
      entityId: data.appointmentId,
    });
  }

  /**
   * Dispatches reschedule notices.
   */
  static async notifySessionRescheduled(data: {
    appointmentId: string;
    previousStart: string;
    newStart: string;
    clientEmail: string;
    therapistEmail: string;
    clientName?: string;
    therapistName?: string;
    googleMeetUrl?: string;
  }) {
    // Client
    await this.sendEmail({
      eventType: EmailEvents.SESSION_RESCHEDULED,
      recipient: { email: data.clientEmail, name: data.clientName, type: 'client' },
      templateKey: 'session_rescheduled',
      templateData: {
        recipientName: data.clientName,
        otherPartyName: data.therapistName || 'Therapist',
        previousStart: data.previousStart,
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
        previousStart: data.previousStart,
        newStart: data.newStart,
        googleMeetUrl: data.googleMeetUrl,
      },
      entityType: 'appointment',
      entityId: data.appointmentId,
    });
  }

  /**
   * Dispatches cancellation notices with refund info.
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
}
