/**
 * Canonical email event definitions for Ingress Within platform.
 */
export const EmailEvents = {
  // Existing therapy care & session lifecycle
  THERAPIST_ACCEPTED_CLIENT: 'therapy.therapist_accepted_client',
  FIRST_SESSION_COORDINATION_REQUIRED: 'therapy.first_session_coordination_required',
  PAYMENT_REQUESTED: 'therapy.payment_requested',
  PAYMENT_SUCCESS: 'therapy.payment_success',
  SESSION_CONFIRMED: 'therapy.session_confirmed',
  SESSION_RESCHEDULED: 'therapy.session_rescheduled',
  SESSION_CANCELLED: 'therapy.session_cancelled',
  REFUND_INITIATED: 'therapy.refund_initiated',
  CLIENT_NO_SHOW: 'therapy.client_no_show',
  THERAPIST_NO_SHOW: 'therapy.therapist_no_show',
  GOOGLE_CALENDAR_CONNECTED: 'calendar.google_connected',

  // Therapist Onboarding & Verification lifecycle
  THERAPIST_APPLICATION_SUBMITTED_ADMIN: 'therapist.application_submitted_admin',
  THERAPIST_APPLICATION_RECEIVED: 'therapist.application_received',
  THERAPIST_APPLICATION_APPROVED: 'therapist.application_approved',
  THERAPIST_APPLICATION_REJECTED: 'therapist.application_rejected',
} as const;

export type EmailEventType = typeof EmailEvents[keyof typeof EmailEvents];
