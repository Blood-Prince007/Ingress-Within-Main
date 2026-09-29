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
}

export interface GoogleCalendarEventResult {
  eventId: string | null;
  meetUrl: string | null;
  conferenceId: string | null;
  syncStatus: 'synced' | 'failed' | 'not_connected';
  error?: string;
}

export class GoogleCalendarService {
  /**
   * Creates an event in the therapist's Google Calendar with an automatically generated Google Meet link.
   * Uses Google Calendar API conferenceData.createRequest with conferenceDataVersion=1.
   * 
   * PRODUCTION INVARIANTS:
   * 1. IDEMPOTENCY: Derived from appointmentId. If google_calendar_event_id already exists, returns existing.
   * 2. NO FABRICATED MEET URLs: google_meet_url is ONLY populated if Google actually returned a valid video entrypoint.
   * 3. FAILURE ISOLATION: Google Calendar unavailability or error never rolls back or throws out of clinical operations.
   */
  static async createEventWithMeet(options: CreateEventOptions): Promise<GoogleCalendarEventResult> {
    try {
      // 1. Idempotency Check: Verify if appointment already has an active calendar event
      if (options.appointmentId) {
        const { data: appt } = await supabase
          .from('therapist_clinical_appointments')
          .select('google_calendar_event_id, google_meet_url, google_meet_conference_id, calendar_sync_status')
          .eq('id', options.appointmentId)
          .maybeSingle();

        if (appt?.google_calendar_event_id && appt.calendar_sync_status === 'synced') {
          return {
            eventId: appt.google_calendar_event_id,
            meetUrl: appt.google_meet_url,
            conferenceId: appt.google_meet_conference_id,
            syncStatus: 'synced',
          };
        }
      }

      // 2. Get valid access token for therapist
      const accessToken = await GoogleAuthService.getValidAccessToken('therapist', options.therapistAccountId);

      if (!accessToken) {
        return {
          eventId: null,
          meetUrl: null,
          conferenceId: null,
          syncStatus: 'not_connected',
        };
      }

      // 3. Prepare deterministic conference request ID derived from appointment ID
      const sanitizedApptId = options.appointmentId.replace(/[^a-zA-Z0-9]/g, '');
      const requestId = `ingress_${sanitizedApptId.slice(0, 32)}`;

      const eventPayload = {
        summary: options.summary || 'Ingress Within Therapy Session',
        description: options.description || 'Confidential clinical therapy session scheduled via Ingress Within.',
        start: { dateTime: options.startTime },
        end: { dateTime: options.endTime },
        attendees: options.attendees.filter(Boolean).map((email) => ({ email })),
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      };

      // 4. Google Calendar API events.insert with conferenceDataVersion=1
      const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1';
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
          error: `HTTP_${status}`,
        };
      }

      const event = await res.json();

      // 5. Extract Google Meet video link — STRICT NO FABRICATION
      let meetUrl: string | null = null;
      let conferenceId: string | null = null;

      if (event.conferenceData) {
        conferenceId = event.conferenceData.conferenceId || null;
        const videoEntryPoint = event.conferenceData.entryPoints?.find(
          (ep: any) => ep.entryPointType === 'video'
        );
        if (videoEntryPoint?.uri) {
          meetUrl = videoEntryPoint.uri;
        } else if (event.hangoutLink) {
          meetUrl = event.hangoutLink;
        }
      }

      return {
        eventId: event.id || null,
        meetUrl,
        conferenceId,
        syncStatus: 'synced',
      };
    } catch (err: any) {
      console.error('[GoogleCalendarService] Safe failure during event creation:', err.message || 'unknown');
      return {
        eventId: null,
        meetUrl: null,
        conferenceId: null,
        syncStatus: 'failed',
        error: err.code || 'CALENDAR_SERVICE_EXCEPTION',
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
