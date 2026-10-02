import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { EmailService } from '../../../../lib/email/emailService';
import { supabase } from '../../../../lib/db';

function getWebhookSecret(): string {
  return process.env.RESEND_WEBHOOK_SECRET || process.env.EMAIL_WEBHOOK_SECRET || '';
}

/**
 * Validates HMAC SHA-256 signature for incoming provider webhooks.
 */
function verifySignature(payload: string, signatureHeader: string | null): boolean {
  const secret = getWebhookSecret();
  if (!secret) {
    // If no webhook secret is configured in dev/test, warn but permit if test flag is active
    return process.env.NODE_ENV !== 'production' || process.env.TEST_MODE === 'true';
  }

  if (!signatureHeader) {
    return false;
  }

  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Support both raw hex or "v1=hex" formats
    const cleanSig = signatureHeader.replace(/^v\d+=/, '').trim();
    return crypto.timingSafeEqual(Buffer.from(cleanSig), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * POST /api/webhooks/email
 * Receives delivery status events from transactional email provider (Resend / SendGrid).
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature =
      request.headers.get('svix-signature') ||
      request.headers.get('x-resend-signature') ||
      request.headers.get('x-webhook-signature');

    const eventId =
      request.headers.get('svix-id') ||
      request.headers.get('x-resend-event-id') ||
      `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Signature Verification
    if (getWebhookSecret() && !verifySignature(rawBody, signature)) {
      console.warn('[Email Webhook] Signature verification failed.');
      return NextResponse.json(
        { error: { code: 'INVALID_SIGNATURE', message: 'Webhook signature verification failed.' } },
        { status: 401 }
      );
    }

    // 2. Parse payload
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: { code: 'MALFORMED_JSON', message: 'Invalid JSON payload.' } },
        { status: 400 }
      );
    }

    // 3. Replay Protection & Idempotency
    try {
      const { data: existing } = await supabase
        .from('webhook_events')
        .select('id, processed')
        .eq('event_id', eventId)
        .maybeSingle();

      if (existing && existing.processed) {
        console.log(`[Email Webhook] Replayed event ignored: ${eventId}`);
        return NextResponse.json({ received: true, replayed: true });
      }

      await supabase.from('webhook_events').upsert(
        {
          event_id: eventId,
          provider: 'resend_email',
          event_type: body.type || 'unknown',
          processed: true,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'event_id' }
      );
    } catch (dbErr) {
      console.warn('[Email Webhook] Idempotency record notice:', dbErr);
    }

    // 4. State Transition Processing
    const eventType = body.type;
    const messageId = body.data?.email_id || body.data?.id;

    if (messageId && (eventType === 'email.delivered' || eventType === 'email.bounced' || eventType === 'email.complained')) {
      await EmailService.handleProviderWebhook({
        type: eventType,
        messageId,
        timestamp: body.created_at || new Date().toISOString(),
        reason: body.data?.reason || body.data?.error || null,
      });
    }

    return NextResponse.json({ received: true, eventId });
  } catch (err: any) {
    console.error('[Email Webhook] Error processing event:', err);
    return NextResponse.json(
      { error: { code: 'WEBHOOK_ERROR', message: err.message || 'Internal error' } },
      { status: 500 }
    );
  }
}
