import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '../../../../../lib/billing/billingService';
import { TherapistPayoutAccountService } from '../../../../../lib/therapist/therapistPayoutAccountService';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-razorpay-signature header' },
        { status: 400 }
      );
    }

    const secret = BillingService.getWebhookSecret();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('[RazorpayPayoutWebhook] Signature mismatch');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const eventId = request.headers.get('x-razorpay-event-id') || event.payload?.payout?.entity?.id || event.id;

    console.log(`[RazorpayPayoutWebhook] Processing payout event: ${eventType} (id: ${eventId})`);

    // Idempotency check via webhook_events
    if (eventId) {
      try {
        const { supabase } = await import('../../../../../lib/db');
        const { data: existingEvent } = await supabase
          .from('webhook_events')
          .select('id, processed')
          .eq('event_id', eventId)
          .maybeSingle();

        if (existingEvent && existingEvent.processed) {
          console.log(`[RazorpayPayoutWebhook] Duplicate webhook event: ${eventId} already processed.`);
          return NextResponse.json({ status: 'ok', received: true, duplicate: true });
        }

        await supabase.from('webhook_events').upsert({
          event_id: eventId,
          event_type: eventType,
          payload: { event: eventType, created_at: event.created_at },
          processed: false,
        }, { onConflict: 'event_id' });
      } catch {
        // Safe fallback in test/dev
      }
    }

    // Process payout event
    const result = await TherapistPayoutAccountService.handlePayoutWebhookEvent(event);

    if (eventId) {
      try {
        const { supabase } = await import('../../../../../lib/db');
        await supabase
          .from('webhook_events')
          .update({ processed: true })
          .eq('event_id', eventId);
      } catch {
        // Safe fallback
      }
    }

    return NextResponse.json({ received: true, ...result });
  } catch (err: any) {
    console.error('[RazorpayPayoutWebhook] Error processing payout webhook:', err);
    // Return 200 to prevent endless retry on internal unhandled errors
    return NextResponse.json({ status: 'error_logged', error: err.message }, { status: 200 });
  }
}
