import { GoogleAuthService } from './googleAuthService';
import { supabase } from '../db';

export interface CreateEventOptions {
  therapistAccountId: string;
  userId?: string;
  appointmentId: string;
  summary: string;
  description: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  attendees: string[]; // Email addresses
  createMeetConference?: boolean;
}

export interface GoogleCalendarEventResult {
  eventId: string | null;
  meetUrl: string | null;
  conferenceId: string | null;
  syncStatus: 'synced' | 'pending' | 'failed' | 'not_connected';
  meetStatus: 'created' | 'generating' | 'failed' | 'not_connected' | 'none';
  error?: string;
}

export interface SyncAppointmentResult {
  success: boolean;
  appointmentId: string;
  eventId: string | null;
  googleMeetUrl: string | null;
  googleMeetConferenceId: string | null;
  googleMeetStatus: 'created' | 'generating' | 'failed' | 'not_connected' | 'none';
  calendarSyncStatus: 'synced' | 'pending' | 'failed' | 'not_connected';
  error?: string;
}

/**
 * Validates that a URL is a real, canonical Google Meet URL.
 * Strictly forbids custom subdomains, localhost, or non-Google domains.
 */
export function isValidGoogleMeetUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.includes('ingresswithin.com') || trimmed.includes('localhost')) {
    return false;
  }
  // Standard format: https://meet.google.com/abc-defg-hij (with optional query parameters)
  return /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(\?.*)?$/i.test(trimmed);
}

export class GoogleCalendarService {
  /**
   * Helper delay for polling
   */
  private static async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Extracts Google Meet video URL and conference ID from a Google Calendar event object.
   */
  private static extractMeetDetails(event: any): { meetUrl: string | null; conferenceId: string | null } {
    let meetUrl: string | null = null;
    let conferenceId: string | null = null;

    if (event?.conferenceData) {
      conferenceId = event.conferenceData.conferenceId || null;
      const videoEntryPoint = event.conferenceData.entryPoints?.find(
        (ep: any) => ep.entryPointType === 'video'
      );
      if (videoEntryPoint?.uri && isValidGoogleMeetUrl(videoEntryPoint.uri)) {
        meetUrl = videoEntryPoint.uri;
      }
    }

    if (!meetUrl && event?.hangoutLink && isValidGoogleMeetUrl(event.hangoutLink)) {
      meetUrl = event.hangoutLink;
    }

    return { meetUrl, conferenceId };
  }

  /**
   * Polls an existing Google Calendar event for asynchronous Google Meet conference completion.
   */
  private static async pollConferenceCreation(
    accessToken: string,
    eventId: string,
    maxAttempts: number = 3
  ): Promise<{ meetUrl: string | null; conferenceId: string | null; isPending: boolean }> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.sleep(attempt * 600); // 600ms, 1200ms, 1800ms
      try {
        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}?conferenceDataVersion=1`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.ok) {
          const event = await res.json();
          const { meetUrl, conferenceId } = this.extractMeetDetails(event);
          if (meetUrl) {
            return { meetUrl, conferenceId, isPending: false };
          }

          const status = event.conferenceData?.createRequest?.status?.statusCode;
          if (status && status !== 'pending' && status !== 'inProgress') {
            // Conference creation failed on Google's end
            return { meetUrl: null, conferenceId, isPending: false };
          }
        }
      } catch (pollErr) {
        console.warn(`[GoogleCalendarService] Conference poll attempt ${attempt} failed:`, pollErr);
      }
    }

    return { meetUrl: null, conferenceId: null, isPending: true };
  }

  /**
   * Creates an event in the therapist's Google Calendar with an automatically generated Google Meet link.
   * Uses Google Calendar API conferenceData.createRequest with conferenceDataVersion=1.
   * 
   * PRODUCTION INVARIANTS:
   * 1. IDEMPOTENCY: Derived from appointmentId. If google_calendar_event_id already exists, inspects/polls existing event.
   * 2. NO FABRICATED MEET URLs: google_meet_url is ONLY populated if Google returned a valid video entrypoint.
   * 3. ASYNC CONFLICT/PENDING RESOLUTION: Polls boundedly if conference status is pending.
   * 4. FAILURE ISOLATION: Google Calendar unavailability or error never rolls back clinical operations.
   */
  static async createEventWithMeet(options: CreateEventOptions): Promise<GoogleCalendarEventResult> {
    try {
      // 1. Get valid access token for therapist
      const accessToken = await GoogleAuthService.getValidAccessToken('therapist', options.therapistAccountId);

      if (!accessToken) {
        return {
          eventId: null,
          meetUrl: null,
          conferenceId: null,
          syncStatus: 'not_connected',
          meetStatus: 'not_connected',
        };
      }

      // 2. Idempotency Check: Verify if appointment already has an active calendar event
      if (options.appointmentId) {
        const { data: appt } = await supabase
          .from('therapist_clinical_appointments')
          .select('google_calendar_event_id, google_meet_url, google_meet_conference_id, calendar_sync_status, google_meet_status')
          .eq('id', options.appointmentId)
          .maybeSingle();

        if (appt?.google_calendar_event_id) {
          // If already synced and has valid meet URL, return existing
          if (appt.google_meet_url && isValidGoogleMeetUrl(appt.google_meet_url)) {
            return {
              eventId: appt.google_calendar_event_id,
              meetUrl: appt.google_meet_url,
              conferenceId: appt.google_meet_conference_id,
              syncStatus: 'synced',
              meetStatus: 'created',
            };
          }

          // Otherwise poll Google to check if Meet has finished generating
          const pollResult = await this.pollConferenceCreation(accessToken, appt.google_calendar_event_id, 2);
          if (pollResult.meetUrl) {
            return {
              eventId: appt.google_calendar_event_id,
              meetUrl: pollResult.meetUrl,
              conferenceId: pollResult.conferenceId,
              syncStatus: 'synced',
              meetStatus: 'created',
            };
          } else if (pollResult.isPending) {
            return {
              eventId: appt.google_calendar_event_id,
              meetUrl: null,
              conferenceId: pollResult.conferenceId,
              syncStatus: 'pending',
              meetStatus: 'generating',
            };
          }
        }
      }

      const createMeet = options.createMeetConference !== false;

      // 3. Prepare event payload (attaching conferenceData only if createMeet is true)
      const eventPayload: any = {
        summary: options.summary || 'Ingress Within Therapy Session',
        description: options.description || 'Confidential clinical therapy session scheduled via Ingress Within.',
        start: { dateTime: options.startTime },
        end: { dateTime: options.endTime },
        attendees: options.attendees.filter(Boolean).map((email) => ({ email })),
      };

      if (createMeet) {
        const sanitizedApptId = options.appointmentId.replace(/[^a-zA-Z0-9]/g, '');
        const requestId = `ingress_${sanitizedApptId.slice(0, 32)}`;
        eventPayload.conferenceData = {
          createRequest: {
            requestId,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        };
      }

      // 4. Google Calendar API events.insert
      const url = createMeet
        ? 'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1'
        : 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      });

      if (!res.ok) {
        const status = res.status;
        console.warn(`[GoogleCalendarService] Failed to insert event: HTTP ${status}`);
        return {
          eventId: null,
          meetUrl: null,
          conferenceId: null,
          syncStatus: 'failed',
          meetStatus: createMeet ? 'failed' : 'none',
          error: `HTTP_${status}`,
        };
      }

      const event = await res.json();
      let { meetUrl, conferenceId } = this.extractMeetDetails(event);

      // 5. If conference creation is still pending for telehealth, poll boundedly
      if (createMeet && !meetUrl && event.id) {
        const pollResult = await this.pollConferenceCreation(accessToken, event.id, 3);
        if (pollResult.meetUrl) {
          meetUrl = pollResult.meetUrl;
          conferenceId = pollResult.conferenceId || conferenceId;
        } else if (pollResult.isPending) {
          return {
            eventId: event.id,
            meetUrl: null,
            conferenceId,
            syncStatus: 'pending',
            meetStatus: 'generating',
          };
        }
      }

      const isMeetReady = Boolean(meetUrl);

      return {
        eventId: event.id || null,
        meetUrl,
        conferenceId,
        syncStatus: 'synced',
        meetStatus: createMeet ? (isMeetReady ? 'created' : 'failed') : 'none',
      };
    } catch (err: any) {
      console.error('[GoogleCalendarService] Safe failure during event creation:', err.message || 'unknown');
      return {
        eventId: null,
        meetUrl: null,
        conferenceId: null,
        syncStatus: 'failed',
        meetStatus: 'failed',
        error: err.code || 'CALENDAR_SERVICE_EXCEPTION',
      };
    }
  }

  /**
   * Canonical orchestration method to sync an Ingress Within clinical appointment to Google Calendar.
   * Called by BOTH client booking (SessionBookingService) and manual therapist scheduling (TherapistPlatformService).
   * 
   * Handles:
   * - Connection lookup & token validation
   * - Calendar event creation / retrieval
   * - Google Meet conference attachment & polling
   * - Database persistence into therapist_clinical_appointments
   * - Safe error isolation
   */
  static async syncAppointmentToGoogle(
    appointmentId: string,
    options: { summary?: string; description?: string; createMeetConference?: boolean } = {}
  ): Promise<SyncAppointmentResult> {
    try {
      if (!appointmentId) {
        return {
          success: false,
          appointmentId: '',
          eventId: null,
          googleMeetUrl: null,
          googleMeetConferenceId: null,
          googleMeetStatus: 'failed',
          calendarSyncStatus: 'failed',
          error: 'MISSING_APPOINTMENT_ID',
        };
      }

      // 1. Fetch appointment details
      const { data: appt, error: apptErr } = await supabase
        .from('therapist_clinical_appointments')
        .select('*')
        .eq('id', appointmentId)
        .maybeSingle();

      if (apptErr || !appt) {
        return {
          success: false,
          appointmentId,
          eventId: null,
          googleMeetUrl: null,
          googleMeetConferenceId: null,
          googleMeetStatus: 'failed',
          calendarSyncStatus: 'failed',
          error: 'APPOINTMENT_NOT_FOUND',
        };
      }

      if (appt.status === 'cancelled') {
        return {
          success: false,
          appointmentId,
          eventId: appt.google_calendar_event_id || null,
          googleMeetUrl: null,
          googleMeetConferenceId: null,
          googleMeetStatus: 'none',
          calendarSyncStatus: 'not_connected',
          error: 'APPOINTMENT_CANCELLED',
        };
      }

      // 2. Fetch therapist and client identity
      const { data: therapistAccount } = await supabase
        .from('therapist_accounts')
        .select('email, full_name')
        .eq('id', appt.therapist_account_id)
        .maybeSingle();

      const { data: clientUser } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', appt.user_id)
        .maybeSingle();

      const clientName = clientUser?.full_name || 'Client';
      const therapistName = therapistAccount?.full_name || 'Therapist';

      const isTelehealth = appt.modality !== 'in_person' && appt.session_type !== 'in_person';
      const shouldCreateMeet = options.createMeetConference ?? isTelehealth;

      const summary = options.summary || `Ingress Within Therapy Session: ${clientName} & ${therapistName}`;
      const description = options.description || (isTelehealth
        ? `Confidential clinical telehealth session scheduled via Ingress Within.\nClient: ${clientName}\nTherapist: ${therapistName}`
        : `Confidential clinical in-person therapy session scheduled via Ingress Within.\nClient: ${clientName}\nTherapist: ${therapistName}`);

      const attendees = [therapistAccount?.email, clientUser?.email].filter(Boolean) as string[];

      // 3. Create or reconcile event in Google Calendar
      const eventResult = await this.createEventWithMeet({
        therapistAccountId: appt.therapist_account_id,
        userId: appt.user_id,
        appointmentId: appt.id,
        summary,
        description,
        startTime: appt.scheduled_start,
        endTime: appt.scheduled_end,
        attendees,
        createMeetConference: shouldCreateMeet,
      });

      // 4. Update appointment in database with real results
      const finalMeetUrl = eventResult.meetUrl;
      const finalSyncStatus = eventResult.syncStatus;
      const finalMeetStatus = eventResult.meetStatus;

      await supabase
        .from('therapist_clinical_appointments')
        .update({
          google_calendar_event_id: eventResult.eventId || appt.google_calendar_event_id || null,
          google_meet_url: finalMeetUrl,
          google_meet_conference_id: eventResult.conferenceId || appt.google_meet_conference_id || null,
          google_meet_status: finalMeetStatus,
          calendar_sync_status: finalSyncStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appt.id);

      return {
        success: finalSyncStatus === 'synced',
        appointmentId: appt.id,
        eventId: eventResult.eventId || appt.google_calendar_event_id || null,
        googleMeetUrl: finalMeetUrl,
        googleMeetConferenceId: eventResult.conferenceId || appt.google_meet_conference_id || null,
        googleMeetStatus: finalMeetStatus,
        calendarSyncStatus: finalSyncStatus,
      };
    } catch (err: any) {
      console.error('[GoogleCalendarService] Safe sync failure:', err.message || 'unknown');
      return {
        success: false,
        appointmentId,
        eventId: null,
        googleMeetUrl: null,
        googleMeetConferenceId: null,
        googleMeetStatus: 'failed',
        calendarSyncStatus: 'failed',
        error: err.code || 'SYNC_EXCEPTION',
      };
    }
  }

  /**
   * Reschedules an existing Google Calendar event.
   * Preserves Google Meet conference and all other metadata. Only updates start/end timestamps.
   */
  static async updateEventTimes(
    therapistAccountId: string,
    eventId: string,
    newStartTime: string,
    newEndTime: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const accessToken = await GoogleAuthService.getValidAccessToken('therapist', therapistAccountId);
      if (!accessToken || !eventId) {
        return { success: false, error: 'NOT_CONNECTED_OR_MISSING_EVENT' };
      }

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: { dateTime: newStartTime },
          end: { dateTime: newEndTime },
        }),
      });

      if (!res.ok) {
        console.warn(`[GoogleCalendarService] Failed to reschedule event: HTTP ${res.status}`);
        return { success: false, error: `HTTP_${res.status}` };
      }

      return { success: true };
    } catch (err: any) {
      console.error('[GoogleCalendarService] Safe failure updating event times:', err.message || 'unknown');
      return { success: false, error: err.code || 'UPDATE_EXCEPTION' };
    }
  }

  /**
   * Deletes an event from Google Calendar on cancellation.
   * Treats HTTP 404 (Not Found) as idempotent success (event already gone).
   */
  static async deleteEvent(
    therapistAccountId: string,
    eventId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const accessToken = await GoogleAuthService.getValidAccessToken('therapist', therapistAccountId);
      if (!accessToken || !eventId) {
        return { success: true }; // Nothing to delete
      }

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok && res.status !== 404) {
        console.warn(`[GoogleCalendarService] Failed to delete event: HTTP ${res.status}`);
        return { success: false, error: `HTTP_${res.status}` };
      }

      return { success: true };
    } catch (err: any) {
      console.error('[GoogleCalendarService] Safe failure deleting event:', err.message || 'unknown');
      return { success: false, error: err.code || 'DELETE_EXCEPTION' };
    }
  }

  /**
   * Queries Google Calendar FreeBusy API to inspect availability.
   * 
   * STRICT PRIVACY BOUNDARY:
   * Only returns an array of { start: string, end: string }.
   * NEVER returns event titles, descriptions, attendees, organizer, location, or Google event IDs.
   */
  static async getBusySlots(
    accountTypeOrId: 'therapist' | 'user' | string,
    idOrTimeMin: string,
    timeMinOrMax: string,
    timeMaxOptional?: string
  ): Promise<Array<{ start: string; end: string }>> {
    let accountType: 'therapist' | 'user' = 'therapist';
    let accountId = '';
    let timeMin = '';
    let timeMax = '';

    if (accountTypeOrId === 'therapist' || accountTypeOrId === 'user') {
      accountType = accountTypeOrId;
      accountId = idOrTimeMin;
      timeMin = timeMinOrMax;
      timeMax = timeMaxOptional || '';
    } else {
      accountType = 'therapist';
      accountId = accountTypeOrId;
      timeMin = idOrTimeMin;
      timeMax = timeMinOrMax;
    }

    try {
      const accessToken = await GoogleAuthService.getValidAccessToken(accountType, accountId);
      if (!accessToken) {
        return [];
      }

      const url = 'https://www.googleapis.com/calendar/v3/freeBusy';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          items: [{ id: 'primary' }],
        }),
      });

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      const primaryBusy = data.calendars?.primary?.busy || [];

      // Sanitization: Exclusively map start and end. Strip all potential external metadata!
      return primaryBusy.map((b: any) => ({
        start: String(b.start),
        end: String(b.end),
      }));
    } catch (err: any) {
      console.warn('[GoogleCalendarService] FreeBusy query exception:', err.message || 'unknown');
      return [];
    }
  }
}

