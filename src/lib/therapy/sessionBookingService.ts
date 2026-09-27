import crypto from 'crypto';
import { supabase } from '../db';
import { BillingService } from '../billing/billingService';
import { GoogleCalendarService } from '../calendar/googleCalendarService';
import { EmailService } from '../email/emailService';
import { EmailEvents } from '../email/emailEvents';
import { TherapistPayoutService } from '../therapist/therapistPayoutService';
import { AdminAuditService } from '../admin/adminAuditService';

export interface AuthoritativePricing {
  subtotalInr: number;
  subtotalPaise: number;
  gstPaise: number;
  totalPaise: number;
  totalInr: number;
  currency: string;
}

export class SessionBookingService {
  // Concurrency Locks to protect against race conditions
  private static activeCancellationLocks: Set<string> = new Set();
  private static activeNoShowLocks: Set<string> = new Set();
  private static activeRefundLocks: Set<string> = new Set();
  /**
   * Calculates platform authoritative pricing for a therapist's session.
   * Client-side pricing is strictly prohibited and discarded.
   */
  static async getAuthoritativePricing(therapistAccountId: string): Promise<AuthoritativePricing> {
    const { data: therapist } = await supabase
      .from('therapist_accounts')
      .select('per_session_fee')
      .eq('id', therapistAccountId)
      .maybeSingle();

    const baseInr = Number(therapist?.per_session_fee) || 1500;
    const subtotalPaise = Math.round(baseInr * 100);
    const gstPaise = Math.round(subtotalPaise * 0.18); // 18% GST standard
    const totalPaise = subtotalPaise + gstPaise;

    return {
      subtotalInr: baseInr,
      subtotalPaise,
      gstPaise,
      totalPaise,
      totalInr: totalPaise / 100,
      currency: 'INR',
    };
  }

  /**
   * Verifies client booking eligibility.
   * Subsequent self-booking is ONLY allowed if the client has an active care relationship
   * and has completed their first session.
   */
  static async verifyClientBookingEligibility(
    userId: string,
    therapistAccountId: string
  ): Promise<{
    eligible: boolean;
    reason?: 'NO_ACTIVE_RELATIONSHIP' | 'RELATIONSHIP_TERMINATED' | 'FIRST_SESSION_COORDINATION_REQUIRED';
    message?: string;
    relationshipId?: string;
  }> {
    const { data: rel, error } = await supabase
      .from('therapy_care_relationships')
      .select('id, status, care_stage, first_session_completed')
      .eq('therapist_account_id', therapistAccountId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !rel || rel.status !== 'active') {
      return {
        eligible: false,
        reason: 'NO_ACTIVE_RELATIONSHIP',
        message: 'You do not have an active care relationship with this therapist. Please match first.',
      };
    }

    if (rel.care_stage === 'completed') {
      return {
        eligible: false,
        reason: 'RELATIONSHIP_TERMINATED',
        message: 'This therapy care journey has concluded.',
      };
    }

    // Check if first session has been completed
    if (!rel.first_session_completed) {
      // Check if there's any completed appointment for this relationship
      const { data: completedAppt } = await supabase
        .from('therapist_clinical_appointments')
        .select('id')
        .eq('relationship_id', rel.id)
        .eq('status', 'completed')
        .limit(1)
        .maybeSingle();

      if (!completedAppt) {
        return {
          eligible: false,
          reason: 'FIRST_SESSION_COORDINATION_REQUIRED',
          message: 'Your first session is coordinated directly by the Ingress Within clinical team. Subsequent sessions can be self-booked.',
        };
      }
    }

    return {
      eligible: true,
      relationshipId: rel.id,
    };
  }

  /**
   * Retrieves available time slots for a therapist, combining:
   * 1. Availability blocks / working hours
   * 2. Minus existing clinical appointments
   * 3. Minus Google Calendar external busy periods
   */
  static async getTherapistAvailability(
    therapistAccountId: string,
    startDateIso: string,
    endDateIso: string
  ) {
    const start = new Date(startDateIso);
    const end = new Date(endDateIso);

    // 1. Fetch therapist availability blocks
    const { data: blocks } = await supabase
      .from('therapist_availability_blocks')
      .select('*')
      .eq('therapist_account_id', therapistAccountId);

    // 2. Fetch existing appointments
    const { data: appointments } = await supabase
      .from('therapist_clinical_appointments')
      .select('scheduled_start, scheduled_end')
      .eq('therapist_account_id', therapistAccountId)
      .in('status', ['scheduled', 'confirmed', 'in_progress', 'rescheduled'])
      .gte('scheduled_end', startDateIso)
      .lte('scheduled_start', endDateIso);

    // 3. Fetch Google Calendar busy slots
    const googleBusy = await GoogleCalendarService.getBusySlots(
      therapistAccountId,
      startDateIso,
      endDateIso
    );

    // Generate potential slots (default 50-minute sessions with 10-minute breaks)
    const availableSlots: Array<{ start: string; end: string }> = [];

    // Simple slot generation for demo/testing across date range
    let currentCursor = new Date(start);
    while (currentCursor < end) {
      const slotStart = new Date(currentCursor);
      const slotEnd = new Date(slotStart.getTime() + 50 * 60 * 1000);

      // Check if slot falls within working hours (default 9am - 6pm if no custom blocks)
      const dayOfWeek = slotStart.getDay();
      const hour = slotStart.getHours();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      let withinWorkingHours = hour >= 9 && hour < 18 && !isWeekend;

      if (blocks && blocks.length > 0) {
        const dayBlock = blocks.find((b: any) => b.day_of_week === dayOfWeek);
        if (dayBlock && dayBlock.is_available) {
          const [startH] = dayBlock.start_time.split(':').map(Number);
          const [endH] = dayBlock.end_time.split(':').map(Number);
          withinWorkingHours = hour >= startH && hour < endH;
        }
      }

      if (withinWorkingHours) {
        const isConflict =
          appointments?.some((appt: any) => {
            const aStart = new Date(appt.scheduled_start).getTime();
            const aEnd = new Date(appt.scheduled_end).getTime();
            return slotStart.getTime() < aEnd && slotEnd.getTime() > aStart;
          }) ||
          googleBusy.some((gb) => {
            const bStart = new Date(gb.start).getTime();
            const bEnd = new Date(gb.end).getTime();
            return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
          });

        if (!isConflict && slotStart.getTime() > Date.now()) {
          availableSlots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
          });
        }
      }

      // Advance by 1 hour
      currentCursor = new Date(currentCursor.getTime() + 60 * 60 * 1000);
    }

    return availableSlots;
  }

  /**
   * Creates a session booking hold and generates a Razorpay Order.
   * Holds the slot for 15 minutes while awaiting payment.
   */
  static async createBookingOrder(params: {
    userId: string;
    therapistAccountId: string;
    slotStart: string;
    slotEnd: string;
    sessionType?: 'video' | 'audio' | 'in_person';
    modality?: 'telehealth' | 'in_person' | 'chat' | 'phone';
    isFirstSessionCoordination?: boolean;
    clientNotes?: string;
  }) {
    const { userId, therapistAccountId, slotStart, slotEnd } = params;

    // 1. Eligibility guard
    let relationshipId: string | null = null;
    if (!params.isFirstSessionCoordination) {
      const eligibility = await this.verifyClientBookingEligibility(userId, therapistAccountId);
      if (!eligibility.eligible) {
        const err: any = new Error(eligibility.message || 'Client ineligible for self-booking.');
        err.code = eligibility.reason || 'INELIGIBLE';
        err.status = 403;
        throw err;
      }
      relationshipId = eligibility.relationshipId || null;
    } else {
      // Find relationship
      const { data: rel } = await supabase
        .from('therapy_care_relationships')
        .select('id')
        .eq('therapist_account_id', therapistAccountId)
        .eq('user_id', userId)
        .maybeSingle();
      relationshipId = rel?.id || null;
    }

    // 2. Conflict verification
    const { data: conflict } = await supabase
      .from('therapist_clinical_appointments')
      .select('id')
      .eq('therapist_account_id', therapistAccountId)
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .lt('scheduled_start', slotEnd)
      .gt('scheduled_end', slotStart)
      .maybeSingle();

    if (conflict) {
      const err: any = new Error('Selected time slot conflicts with an existing appointment.');
      err.code = 'SLOT_UNAVAILABLE';
      err.status = 409;
      throw err;
    }

    // Check active unexpired pending holds
    const nowIso = new Date().toISOString();
    const { data: heldBooking } = await supabase
      .from('therapy_session_bookings')
      .select('id')
      .eq('therapist_account_id', therapistAccountId)
      .eq('booking_status', 'pending_payment')
      .gt('expires_at', nowIso)
      .lt('slot_start', slotEnd)
      .gt('slot_end', slotStart)
      .maybeSingle();

    if (heldBooking) {
      const err: any = new Error('Selected time slot is currently on hold for another checkout.');
      err.code = 'SLOT_ON_HOLD';
      err.status = 409;
      throw err;
    }

    // 3. Authoritative Pricing
    const pricing = await this.getAuthoritativePricing(therapistAccountId);

    // 4. Generate unique booking reference
    const bookingReference = `IW-BKG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // 5. Create Razorpay order
    let razorpayOrderId = `order_mock_${Date.now()}`;
    const rzp = BillingService.getRazorpayClient();
    if (rzp) {
      try {
        const order = await rzp.orders.create({
          amount: pricing.totalPaise,
          currency: 'INR',
          receipt: bookingReference,
          notes: {
            booking_reference: bookingReference,
            therapist_account_id: therapistAccountId,
            user_id: userId,
          },
        });
        razorpayOrderId = order.id;
      } catch (rzpErr) {
        console.error('[SessionBookingService] Razorpay order creation failed:', rzpErr);
      }
    }

    // 6. Insert pending booking hold (15-minute expiration)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const bookingType = params.isFirstSessionCoordination ? 'first_session' : 'subsequent';

    const { data: booking, error: insertErr } = await supabase
      .from('therapy_session_bookings')
      .insert({
        booking_reference: bookingReference,
        user_id: userId,
        therapist_account_id: therapistAccountId,
        relationship_id: relationshipId,
        slot_start: slotStart,
        slot_end: slotEnd,
        session_type: params.sessionType || 'video',
        modality: params.modality || 'telehealth',
        booking_type: bookingType,
        booking_status: 'pending_payment',
        amount_paise: pricing.totalPaise,
        currency: 'INR',
        razorpay_order_id: razorpayOrderId,
        payment_status: 'pending',
        expires_at: expiresAt,
        metadata: {
          client_notes: params.clientNotes || null,
          pricing,
        },
      })
      .select('*')
      .single();

    if (insertErr || !booking) {
      console.error('[SessionBookingService] Failed to create booking record:', insertErr);
      throw new Error('Failed to create session booking.');
    }

    return {
      bookingId: booking.id,
      bookingReference,
      razorpayOrderId,
      amountPaise: pricing.totalPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_key',
      expiresAt,
    };
  }

  /**
   * Confirms payment and promotes booking to a confirmed clinical appointment.
   * Idempotent: repeated callbacks or webhooks with the same payment_id will return existing record.
   */
  static async confirmSessionPayment(params: {
    razorpayOrderId?: string;
    razorpayPaymentId: string;
    razorpaySignature?: string;
    bookingId?: string;
  }) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = params;

    // 1. Locate booking
    let query = supabase.from('therapy_session_bookings').select('*');
    if (razorpayPaymentId) {
      query = query.eq('razorpay_payment_id', razorpayPaymentId);
    } else if (razorpayOrderId) {
      query = query.eq('razorpay_order_id', razorpayOrderId);
    } else if (bookingId) {
      query = query.eq('id', bookingId);
    }

    let { data: booking } = await query.maybeSingle();

    if (!booking && razorpayOrderId) {
      const fallback = await supabase
        .from('therapy_session_bookings')
        .select('*')
        .eq('razorpay_order_id', razorpayOrderId)
        .maybeSingle();
      booking = fallback.data;
    }

    if (!booking) {
      const err: any = new Error('Booking not found for this payment.');
      err.code = 'BOOKING_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    // IDEMPOTENCY GUARD:
    if (booking.payment_status === 'paid' && booking.appointment_id) {
      const { data: existingAppt } = await supabase
        .from('therapist_clinical_appointments')
        .select('*')
        .eq('id', booking.appointment_id)
        .single();

      return {
        success: true,
        alreadyProcessed: true,
        booking,
        appointment: existingAppt,
      };
    }

    // 2. Verify signature if provided
    if (razorpaySignature && razorpayOrderId && razorpayPaymentId) {
      const isValid = BillingService.verifyPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );
      if (!isValid) {
        const err: any = new Error('Invalid payment signature.');
        err.code = 'INVALID_SIGNATURE';
        err.status = 400;
        throw err;
      }
    }

    // 3. Fetch client and therapist details
    const { data: clientUser } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', booking.user_id)
      .maybeSingle();

    const { data: therapistAccount } = await supabase
      .from('therapist_accounts')
      .select('id, full_name, email, per_session_fee, commission_rate')
      .eq('id', booking.therapist_account_id)
      .single();

    // 4. Create Clinical Appointment
    const { data: newAppt, error: apptErr } = await supabase
      .from('therapist_clinical_appointments')
      .insert({
        therapist_account_id: booking.therapist_account_id,
        user_id: booking.user_id,
        relationship_id: booking.relationship_id,
        booking_id: booking.id,
        scheduled_start: booking.slot_start,
        scheduled_end: booking.slot_end,
        status: 'confirmed',
        session_type: booking.session_type || 'video',
        modality: booking.modality || 'telehealth',
        payment_id: razorpayPaymentId,
        client_notes: booking.metadata?.client_notes || null,
      })
      .select('*')
      .single();

    if (apptErr || !newAppt) {
      console.error('[SessionBookingService] Failed to create clinical appointment:', apptErr);
      throw new Error('Failed to create appointment after payment.');
    }

    // 5. Create Google Calendar event with Google Meet
    let calendarEventResult = {
      eventId: null as string | null,
      meetUrl: null as string | null,
      conferenceId: null as string | null,
      syncStatus: 'not_connected' as 'synced' | 'failed' | 'not_connected',
    };

    try {
      calendarEventResult = await GoogleCalendarService.createEventWithMeet({
        therapistAccountId: booking.therapist_account_id,
        userId: booking.user_id,
        appointmentId: newAppt.id,
        summary: `Ingress Within: Session with ${clientUser?.full_name || 'Client'}`,
        description: `Ingress Within confidential therapy session. Ref: ${booking.booking_reference}`,
        startTime: booking.slot_start,
        endTime: booking.slot_end,
        attendees: [therapistAccount?.email, clientUser?.email].filter(Boolean) as string[],
      });
    } catch (calErr) {
      console.warn('[SessionBookingService] Calendar sync failed gracefully:', calErr);
      calendarEventResult.syncStatus = 'failed';
    }

    // Determine real Google Meet status - NEVER fabricate a URL
    const meetUrl = calendarEventResult.meetUrl || null;
    const meetStatus = meetUrl
      ? 'created'
      : calendarEventResult.syncStatus === 'not_connected'
      ? 'not_connected'
      : 'failed';

    // Update appointment with calendar & meet details
    await supabase
      .from('therapist_clinical_appointments')
      .update({
        google_calendar_event_id: calendarEventResult.eventId,
        google_meet_url: meetUrl,
        google_meet_conference_id: calendarEventResult.conferenceId,
        google_meet_status: meetStatus,
        calendar_sync_status: calendarEventResult.syncStatus,
        meeting_link: meetUrl,
      })
      .eq('id', newAppt.id);

    // 6. Update booking status
    const { data: updatedBooking } = await supabase
      .from('therapy_session_bookings')
      .update({
        appointment_id: newAppt.id,
        booking_status: 'confirmed',
        payment_status: 'paid',
        razorpay_payment_id: razorpayPaymentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)
      .select('*')
      .single();

    // 7. Register therapist earnings (enforcing single earning per appointment)
    try {
      const gross = Number(therapistAccount?.per_session_fee) || 1500;
      const commRate = Number(therapistAccount?.commission_rate) || 15;

      await TherapistPayoutService.recordEarningForAppointment({
        therapistAccountId: booking.therapist_account_id,
        appointmentId: newAppt.id,
        grossAmount: gross,
        commissionRate: commRate,
        initialStatus: 'collected',
      });
    } catch (earnErr) {
      console.warn('[SessionBookingService] Failed to record earnings (may already exist):', earnErr);
    }

    // 8. Dispatch confirmation emails
    try {
      await EmailService.notifySessionConfirmed({
        bookingId: booking.id,
        appointmentId: newAppt.id,
        bookingReference: booking.booking_reference,
        scheduledStart: booking.slot_start,
        scheduledEnd: booking.slot_end,
        clientEmail: clientUser?.email || 'client@ingresswithin.com',
        therapistEmail: therapistAccount?.email || 'therapist@ingresswithin.com',
        clientName: clientUser?.full_name || 'Valued Client',
        therapistName: therapistAccount?.full_name || 'Therapist',
        googleMeetUrl: meetUrl || undefined,
        clientId: clientUser?.id,
        therapistId: therapistAccount?.id,
      });
    } catch (mailErr) {
      console.warn('[SessionBookingService] Email notification dispatch failed gracefully:', mailErr);
    }

    return {
      success: true,
      booking: updatedBooking,
      appointment: {
        ...newAppt,
        meeting_link: meetUrl,
        google_meet_url: meetUrl,
        google_meet_status: meetStatus,
        calendar_sync_status: calendarEventResult.syncStatus,
      },
    };
  }

  /**
   * Reschedules an appointment.
   * STRICT POLICY: Must be requested at least 24 hours prior to scheduled_start.
   */
  static async rescheduleSession(params: {
    appointmentId: string;
    newStart: string;
    newEnd: string;
    requestedBy: 'client' | 'therapist';
    userId?: string;
    therapistAccountId?: string;
    reason?: string;
  }) {
    const { appointmentId, newStart, newEnd, requestedBy } = params;

    // 1. Fetch appointment
    const { data: appt, error } = await supabase
      .from('therapist_clinical_appointments')
      .select('*')
      .eq('id', appointmentId)
      .maybeSingle();

    if (error || !appt) {
      const err: any = new Error('Appointment not found.');
      err.code = 'SESSION_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    // Ownership check
    if (requestedBy === 'client' && params.userId && appt.user_id !== params.userId) {
      const err: any = new Error('Unauthorized to reschedule this appointment.');
      err.code = 'UNAUTHORIZED';
      err.status = 403;
      throw err;
    }
    if (requestedBy === 'therapist' && params.therapistAccountId && appt.therapist_account_id !== params.therapistAccountId) {
      const err: any = new Error('Unauthorized to reschedule this appointment.');
      err.code = 'UNAUTHORIZED';
      err.status = 403;
      throw err;
    }

    if (['completed', 'cancelled'].includes(appt.status)) {
      const err: any = new Error(`Cannot reschedule a ${appt.status} session.`);
      err.code = 'SESSION_IMMUTABLE';
      err.status = 400;
      throw err;
    }

    // 2. Enforce > 24 Hours Policy
    const scheduledStart = new Date(appt.scheduled_start).getTime();
    const now = Date.now();
    const hoursRemaining = (scheduledStart - now) / (1000 * 60 * 60);

    if (hoursRemaining < 24) {
      const err: any = new Error(
        'POLICY_VIOLATION: Sessions can only be rescheduled at least 24 hours in advance.'
      );
      err.code = 'RESCHEDULE_WINDOW_CLOSED';
      err.status = 400;
      throw err;
    }

    // 3. Check conflict on new time
    const { data: conflict } = await supabase
      .from('therapist_clinical_appointments')
      .select('id')
      .eq('therapist_account_id', appt.therapist_account_id)
      .neq('id', appointmentId)
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .lt('scheduled_start', newEnd)
      .gt('scheduled_end', newStart)
      .maybeSingle();

    if (conflict) {
      const err: any = new Error('New time slot conflicts with another booked session.');
      err.code = 'SESSION_CONFLICT';
      err.status = 409;
      throw err;
    }

    // 4. Insert audit record in therapist_session_reschedules
    await supabase.from('therapist_session_reschedules').insert({
      appointment_id: appointmentId,
      previous_start: appt.scheduled_start,
      previous_end: appt.scheduled_end,
      new_start: newStart,
      new_end: newEnd,
      rescheduled_by: requestedBy,
      reason: params.reason || `Rescheduled by ${requestedBy}`,
    });

    // 5. Update appointment
    const { data: updatedAppt, error: updateErr } = await supabase
      .from('therapist_clinical_appointments')
      .update({
        scheduled_start: newStart,
        scheduled_end: newEnd,
        status: 'rescheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)
      .select('*')
      .single();

    if (updateErr) {
      throw new Error('Failed to update appointment record.');
    }

    // 6. Update Google Calendar event
    if (appt.google_calendar_event_id) {
      await GoogleCalendarService.updateEventTimes(
        appt.therapist_account_id,
        appt.google_calendar_event_id,
        newStart,
        newEnd
      );
    }

    // 7. Update linked booking if present
    if (appt.booking_id) {
      await supabase
        .from('therapy_session_bookings')
        .update({
          slot_start: newStart,
          slot_end: newEnd,
          booking_status: 'rescheduled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', appt.booking_id);
    }

    // 8. Dispatch notification emails
    const { data: clientUser } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', appt.user_id)
      .maybeSingle();

    const { data: therapistAccount } = await supabase
      .from('therapist_accounts')
      .select('email, full_name')
      .eq('id', appt.therapist_account_id)
      .maybeSingle();

    await EmailService.notifySessionRescheduled({
      appointmentId,
      previousStart: appt.scheduled_start,
      newStart,
      clientEmail: clientUser?.email || 'client@ingresswithin.com',
      therapistEmail: therapistAccount?.email || 'therapist@ingresswithin.com',
      clientName: clientUser?.full_name || 'Client',
      therapistName: therapistAccount?.full_name || 'Therapist',
      googleMeetUrl: appt.google_meet_url || appt.meeting_link,
    });

    return updatedAppt;
  }

  /**
   * Cancels an appointment and applies the authoritative refund policy:
   * - >= 48 hours: 100% full refund automatically initiated
   * - 24-48 hours: Administrative review / credit flagged
   * - < 24 hours: Non-refundable
   * - If cancelled by therapist: 100% full refund always!
   */
  static async cancelSession(params: {
    appointmentId: string;
    cancelledBy: 'client' | 'therapist' | 'admin';
    userId?: string;
    therapistAccountId?: string;
    reason?: string;
  }) {
    const { appointmentId, cancelledBy, reason } = params;

    if (this.activeCancellationLocks.has(appointmentId)) {
      const err: any = new Error('Cancellation currently in progress for this appointment.');
      err.code = 'CONCURRENT_OPERATION';
      err.status = 409;
      throw err;
    }
    this.activeCancellationLocks.add(appointmentId);

    try {
      // 1. Fetch appointment
      const { data: appt, error } = await supabase
        .from('therapist_clinical_appointments')
        .select('*')
        .eq('id', appointmentId)
        .maybeSingle();

      if (error || !appt) {
        const err: any = new Error('Appointment not found.');
        err.code = 'SESSION_NOT_FOUND';
        err.status = 404;
        throw err;
      }

      if (appt.status === 'completed') {
        const err: any = new Error('Cannot cancel a completed session.');
        err.code = 'SESSION_IMMUTABLE';
        err.status = 400;
        throw err;
      }

      if (appt.status === 'cancelled') {
        return { success: true, appointment: appt, alreadyCancelled: true };
      }

      // 2. Evaluate Refund Policy
      const scheduledStart = new Date(appt.scheduled_start).getTime();
      const now = Date.now();
      const hoursRemaining = (scheduledStart - now) / (1000 * 60 * 60);

      let refundStatus: 'none' | 'eligible' | 'pending' | 'full' | 'partial' | 'denied' | 'failed' = 'denied';

      if (cancelledBy === 'therapist' || cancelledBy === 'admin') {
        refundStatus = 'eligible';
      } else if (hoursRemaining >= 48) {
        refundStatus = 'eligible';
      } else if (hoursRemaining >= 24) {
        refundStatus = 'pending'; // 24-48 hours review window
      } else {
        refundStatus = 'denied';  // Under 24 hours
      }

      // 3. Execute Razorpay refund if eligible
      let refundId: string | null = appt.refund_id || null;
      let refundAmountPaise = 0;

      if (appt.booking_id) {
        const { data: bkg } = await supabase
          .from('therapy_session_bookings')
          .select('amount_paise')
          .eq('id', appt.booking_id)
          .maybeSingle();

        refundAmountPaise = bkg?.amount_paise || 177000;
      }

      // Idempotency anchor: if already refunded, keep full
      if (appt.refund_status === 'full') {
        refundStatus = 'full';
        refundId = appt.refund_id || null;
      } else if (refundStatus === 'eligible') {
        if (appt.payment_id) {
          const rzp = BillingService.getRazorpayClient();
          if (rzp) {
            try {
              const rzpRefund = await rzp.payments.refund(appt.payment_id, {
                amount: refundAmountPaise > 0 ? refundAmountPaise : undefined,
                notes: {
                  appointment_id: appointmentId,
                  cancelled_by: cancelledBy,
                },
              });
              if (rzpRefund?.id) {
                refundId = rzpRefund.id;
                refundStatus = 'full';
                await AdminAuditService.logAction({
                  action: 'refund_issued',
                  resourceType: 'appointment',
                  resourceId: appointmentId,
                  actorType: cancelledBy === 'admin' ? 'admin' : (cancelledBy === 'therapist' ? 'therapist' : 'client'),
                  actorId: params.userId || params.therapistAccountId || 'system',
                  metadata: {
                    refundId,
                    amountPaise: refundAmountPaise,
                    paymentId: appt.payment_id,
                  },
                });
              } else {
                refundStatus = 'failed';
              }
            } catch (rfErr: any) {
              console.error('[SessionBookingService] Razorpay refund failed:', rfErr);
              refundStatus = 'failed';
              await AdminAuditService.logAction({
                action: 'refund_failed',
                resourceType: 'appointment',
                resourceId: appointmentId,
                actorType: cancelledBy === 'admin' ? 'admin' : (cancelledBy === 'therapist' ? 'therapist' : 'client'),
                actorId: params.userId || params.therapistAccountId || 'system',
                metadata: {
                  error: rfErr?.message || String(rfErr),
                  paymentId: appt.payment_id,
                  amountPaise: refundAmountPaise,
                },
              });
            }
          } else {
            refundStatus = 'failed';
            await AdminAuditService.logAction({
              action: 'refund_failed',
              resourceType: 'appointment',
              resourceId: appointmentId,
              actorType: cancelledBy === 'admin' ? 'admin' : (cancelledBy === 'therapist' ? 'therapist' : 'client'),
              actorId: params.userId || params.therapistAccountId || 'system',
              metadata: {
                error: 'Razorpay gateway client not configured.',
                paymentId: appt.payment_id,
              },
            });
          }
        } else {
          refundStatus = 'none';
        }
      }

      // 4. Update linked booking if present
      if (appt.booking_id) {
        await supabase
          .from('therapy_session_bookings')
          .update({
            booking_status: 'cancelled',
            cancellation_reason: reason || `Cancelled by ${cancelledBy}`,
            payment_status: refundStatus === 'full' ? 'refunded' : (refundStatus === 'failed' ? 'paid' : (refundStatus === 'pending' ? 'pending' : 'paid')),
            refund_status: refundStatus,
            refund_id: refundId,
            refund_amount_paise: refundStatus === 'full' ? refundAmountPaise : 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', appt.booking_id);
      }

      // 5. Update appointment
      const apptUpdate: Record<string, any> = {
        status: 'cancelled',
        cancelled_by: cancelledBy,
        cancellation_reason: reason || `Cancelled by ${cancelledBy}`,
        refund_status: refundStatus,
        updated_at: new Date().toISOString(),
      };
      if (refundId) {
        apptUpdate.refund_id = refundId;
      }

      let { data: updatedAppt, error: cancelUpdErr } = await supabase
        .from('therapist_clinical_appointments')
        .update(apptUpdate)
        .eq('id', appointmentId)
        .select('*')
        .single();

      if (cancelUpdErr && (cancelUpdErr.message?.includes('refund_id') || cancelUpdErr.code === 'PGRST204')) {
        delete apptUpdate.refund_id;
        const fbRes = await supabase
          .from('therapist_clinical_appointments')
          .update(apptUpdate)
          .eq('id', appointmentId)
          .select('*')
          .single();
        updatedAppt = fbRes.data;
      }

      // 6. Delete Google Calendar event
      if (appt.google_calendar_event_id) {
        await GoogleCalendarService.deleteEvent(
          appt.therapist_account_id,
          appt.google_calendar_event_id
        );
      }

      // 7. Adjust earnings ONLY IF refund confirmed
      if (refundStatus === 'full') {
        await TherapistPayoutService.handleAppointmentRefund(appointmentId);
      }

      // 8. Dispatch notification emails
      const { data: clientUser } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', appt.user_id)
        .maybeSingle();

      const { data: therapistAccount } = await supabase
        .from('therapist_accounts')
        .select('email, full_name')
        .eq('id', appt.therapist_account_id)
        .maybeSingle();

      await EmailService.notifySessionCancelled({
        appointmentId,
        scheduledStart: appt.scheduled_start,
        clientEmail: clientUser?.email || 'client@ingresswithin.com',
        therapistEmail: therapistAccount?.email || 'therapist@ingresswithin.com',
        clientName: clientUser?.full_name || 'Client',
        therapistName: therapistAccount?.full_name || 'Therapist',
        reason,
        refundStatus,
      });

      if (refundStatus === 'full' && refundId) {
        await EmailService.notifyRefundInitiated({
          clientEmail: clientUser?.email || 'client@ingresswithin.com',
          clientName: clientUser?.full_name || 'Client',
          amountPaise: refundAmountPaise,
          refundId,
          bookingId: appt.booking_id,
        });
      }

      return {
        success: true,
        refundStatus,
        refundId,
        appointment: updatedAppt,
      };
    } finally {
      this.activeCancellationLocks.delete(appointmentId);
    }
  }

  /**
   * Retries a failed or pending refund for an appointment.
   * Admin-only operation with strict concurrency locking and audit logging.
   */
  static async retryRefund(appointmentId: string, adminActorId: string) {
    if (this.activeRefundLocks.has(appointmentId)) {
      const err: any = new Error('Refund retry currently in progress.');
      err.code = 'CONCURRENT_OPERATION';
      err.status = 409;
      throw err;
    }
    this.activeRefundLocks.add(appointmentId);

    try {
      const { data: appt, error } = await supabase
        .from('therapist_clinical_appointments')
        .select('*')
        .eq('id', appointmentId)
        .maybeSingle();

      if (error || !appt) {
        const err: any = new Error('Appointment not found.');
        err.code = 'SESSION_NOT_FOUND';
        err.status = 404;
        throw err;
      }

      if (appt.refund_status === 'full') {
        return { success: true, refundStatus: 'full', refundId: appt.refund_id || null, alreadyRefunded: true };
      }

      if (!appt.payment_id) {
        const err: any = new Error('No payment ID associated with appointment to refund.');
        err.code = 'PAYMENT_NOT_FOUND';
        err.status = 400;
        throw err;
      }

      let refundAmountPaise = 177000;
      if (appt.booking_id) {
        const { data: bkg } = await supabase
          .from('therapy_session_bookings')
          .select('amount_paise')
          .eq('id', appt.booking_id)
          .maybeSingle();
        if (bkg?.amount_paise) refundAmountPaise = bkg.amount_paise;
      }

      const rzp = BillingService.getRazorpayClient();
      if (!rzp) {
        const err: any = new Error('Razorpay gateway client not configured.');
        err.code = 'GATEWAY_ERROR';
        err.status = 502;
        throw err;
      }

      let refundId: string | null = null;
      try {
        const rzpRefund = await rzp.payments.refund(appt.payment_id, {
          amount: refundAmountPaise > 0 ? refundAmountPaise : undefined,
          notes: {
            appointment_id: appointmentId,
            retry_by: adminActorId,
          },
        });
        if (rzpRefund?.id) {
          refundId = rzpRefund.id;
        } else {
          throw new Error('Razorpay did not return a refund ID');
        }
      } catch (rfErr: any) {
        await AdminAuditService.logAction({
          action: 'refund_failed',
          resourceType: 'appointment',
          resourceId: appointmentId,
          actorType: 'admin',
          actorId: adminActorId,
          metadata: {
            error: rfErr?.message || String(rfErr),
            paymentId: appt.payment_id,
            isRetry: true,
          },
        });
        throw rfErr;
      }

      // Update DB with confirmed refund
      const updateData: Record<string, any> = {
        refund_status: 'full',
        updated_at: new Date().toISOString(),
      };
      if (refundId) {
        updateData.refund_id = refundId;
      }

      const { error: updErr } = await supabase
        .from('therapist_clinical_appointments')
        .update(updateData)
        .eq('id', appointmentId);

      if (updErr && (updErr.message?.includes('refund_id') || updErr.code === 'PGRST204')) {
        delete updateData.refund_id;
        await supabase
          .from('therapist_clinical_appointments')
          .update(updateData)
          .eq('id', appointmentId);
      }

      if (appt.booking_id) {
        await supabase
          .from('therapy_session_bookings')
          .update({
            payment_status: 'refunded',
            refund_status: 'full',
            refund_id: refundId,
            refund_amount_paise: refundAmountPaise,
            updated_at: new Date().toISOString(),
          })
          .eq('id', appt.booking_id);
      }

      // Void therapist earnings now that refund is confirmed
      await TherapistPayoutService.handleAppointmentRefund(appointmentId);

      // Audit log
      await AdminAuditService.logAction({
        action: 'refund_issued',
        resourceType: 'appointment',
        resourceId: appointmentId,
        actorType: 'admin',
        actorId: adminActorId,
        metadata: {
          refundId,
          amountPaise: refundAmountPaise,
          paymentId: appt.payment_id,
          isRetry: true,
        },
      });

      return {
        success: true,
        refundStatus: 'full',
        refundId,
      };
    } finally {
      this.activeRefundLocks.delete(appointmentId);
    }
  }

  /**
   * Handles attendance status / no-show recording.
   * - attended: Session completed normally, therapist paid, first_session_completed set if first session.
   * - client_no_show: Non-refundable, therapist earnings kept, first_session_completed NOT set.
   * - therapist_no_show: 100% full refund to client, therapist earnings voided, first_session_completed NOT set.
   */
  static async recordAttendanceStatus(params: {
    appointmentId: string;
    therapistAccountId: string;
    attendanceStatus: 'attended' | 'client_no_show' | 'therapist_no_show';
    notes?: string;
  }) {
    const { appointmentId, therapistAccountId, attendanceStatus, notes } = params;

    if (this.activeNoShowLocks.has(appointmentId)) {
      const err: any = new Error('Attendance update in progress for this appointment.');
      err.code = 'CONCURRENT_OPERATION';
      err.status = 409;
      throw err;
    }
    this.activeNoShowLocks.add(appointmentId);

    try {
      const { data: appt, error } = await supabase
        .from('therapist_clinical_appointments')
        .select('*')
        .eq('id', appointmentId)
        .eq('therapist_account_id', therapistAccountId)
        .maybeSingle();

      if (error || !appt) {
        const err: any = new Error('Appointment not found or unauthorized.');
        err.code = 'SESSION_NOT_FOUND';
        err.status = 404;
        throw err;
      }

      if (appt.status === 'cancelled') {
        const err: any = new Error('Cannot update attendance for a cancelled session.');
        err.code = 'SESSION_CANCELLED';
        err.status = 400;
        throw err;
      }

      let refundStatus = appt.refund_status || 'none';
      let refundId: string | null = appt.refund_id || null;
      let newStatus = appt.status;

      if (attendanceStatus === 'client_no_show') {
        // Client missed: session counts as consumed, NO refund, therapist keeps earning
        newStatus = 'completed';
        refundStatus = 'denied';
        await TherapistPayoutService.handleAppointmentNoShow(appointmentId, 'client');
        await AdminAuditService.logAction({
          action: 'client_no_show',
          resourceType: 'appointment',
          resourceId: appointmentId,
          actorType: 'therapist',
          actorId: therapistAccountId,
          metadata: { notes },
        });
      } else if (attendanceStatus === 'therapist_no_show') {
        // Clinician missed: 100% full refund to client, therapist earning voided
        newStatus = 'cancelled';
        refundStatus = 'eligible';

        if (appt.payment_id) {
          const rzp = BillingService.getRazorpayClient();
          if (rzp) {
            try {
              const rzpRefund = await rzp.payments.refund(appt.payment_id, {
                notes: {
                  appointment_id: appointmentId,
                  reason: 'therapist_no_show',
                },
              });
              if (rzpRefund?.id) {
                refundId = rzpRefund.id;
                refundStatus = 'full';
              } else {
                refundStatus = 'failed';
              }
            } catch (rErr: any) {
              console.warn('[SessionBookingService] Therapist no-show refund error:', rErr);
              refundStatus = 'failed';
              await AdminAuditService.logAction({
                action: 'refund_failed',
                resourceType: 'appointment',
                resourceId: appointmentId,
                actorType: 'therapist',
                actorId: therapistAccountId,
                metadata: {
                  error: rErr?.message || String(rErr),
                  paymentId: appt.payment_id,
                  reason: 'therapist_no_show',
                },
              });
            }
          } else {
            refundStatus = 'failed';
          }
        } else {
          refundStatus = 'none';
        }

        // Void therapist earnings
        await TherapistPayoutService.handleAppointmentNoShow(appointmentId, 'therapist');

        await AdminAuditService.logAction({
          action: 'therapist_no_show',
          resourceType: 'appointment',
          resourceId: appointmentId,
          actorType: 'therapist',
          actorId: therapistAccountId,
          metadata: {
            refundStatus,
            refundId,
            notes,
          },
        });
      } else if (attendanceStatus === 'attended') {
        newStatus = 'completed';
        await AdminAuditService.logAction({
          action: 'appointment_attended',
          resourceType: 'appointment',
          resourceId: appointmentId,
          actorType: 'therapist',
          actorId: therapistAccountId,
          metadata: { notes },
        });
      }

      const attendUpdate: Record<string, any> = {
        attendance_status: attendanceStatus,
        status: newStatus,
        refund_status: refundStatus,
        client_notes: notes || appt.client_notes,
        updated_at: new Date().toISOString(),
      };
      if (refundId) {
        attendUpdate.refund_id = refundId;
      }

      let { data: updatedAppt, error: attendErr } = await supabase
        .from('therapist_clinical_appointments')
        .update(attendUpdate)
        .eq('id', appointmentId)
        .select('*')
        .single();

      if (attendErr && (attendErr.message?.includes('refund_id') || attendErr.code === 'PGRST204')) {
        delete attendUpdate.refund_id;
        const fbRes = await supabase
          .from('therapist_clinical_appointments')
          .update(attendUpdate)
          .eq('id', appointmentId)
          .select('*')
          .single();
        updatedAppt = fbRes.data;
      }

      // CRITICAL INVARIANT: Mark first_session_completed ONLY IF attendanceStatus === 'attended'
      if (attendanceStatus === 'attended' && appt.relationship_id) {
        await supabase
          .from('therapy_care_relationships')
          .update({ first_session_completed: true })
          .eq('id', appt.relationship_id);
      }

      // Send notifications if no-show
      if (attendanceStatus === 'client_no_show' || attendanceStatus === 'therapist_no_show') {
        const { data: clientUser } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', appt.user_id)
          .maybeSingle();

        const { data: therapistAccount } = await supabase
          .from('therapist_accounts')
          .select('email, full_name')
          .eq('id', appt.therapist_account_id)
          .maybeSingle();

        await EmailService.notifyNoShow({
          appointmentId,
          scheduledStart: appt.scheduled_start,
          clientEmail: clientUser?.email || 'client@ingresswithin.com',
          therapistEmail: therapistAccount?.email || 'therapist@ingresswithin.com',
          clientName: clientUser?.full_name || 'Client',
          therapistName: therapistAccount?.full_name || 'Therapist',
          attendanceStatus,
        });

        if (attendanceStatus === 'therapist_no_show' && refundStatus === 'full' && refundId) {
          await EmailService.notifyRefundInitiated({
            clientEmail: clientUser?.email || 'client@ingresswithin.com',
            clientName: clientUser?.full_name || 'Client',
            amountPaise: 177000,
            refundId,
            bookingId: appt.booking_id,
          });
        }
      }

      return updatedAppt;
    } finally {
      this.activeNoShowLocks.delete(appointmentId);
    }
  }
}
