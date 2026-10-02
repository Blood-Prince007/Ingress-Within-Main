export type EmailRecipientType = 'client' | 'therapist' | 'team' | 'admin';

export type EmailDeliveryStatus =
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'retrying'
  | 'pending';

export interface EmailRecipient {
  email: string;
  name?: string;
  type: EmailRecipientType;
  id?: string;
}

export interface EmailRenderedContent {
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailOptions {
  eventType: string;
  recipient: EmailRecipient;
  templateKey: string;
  templateData: Record<string, any>;
  entityType?: 'appointment' | 'booking' | 'match' | 'refund' | 'application' | 'therapist';
  entityId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}

export interface EmailDeliveryRecord {
  id: string;
  eventType: string;
  recipientType: EmailRecipientType;
  recipientId?: string | null;
  recipientEmail: string;
  templateKey: string;
  subject: string;
  bodyHtml?: string;
  bodyText?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  status: EmailDeliveryStatus;
  idempotencyKey?: string | null;
  provider?: string;
  providerMessageId?: string | null;
  attemptCount: number;
  lastError?: string | null;
  lastErrorCategory?: string | null;
  metadata?: Record<string, any>;
  sentAt?: string | null;
  deliveredAt?: string | null;
  failedAt?: string | null;
  createdAt: string;
}
