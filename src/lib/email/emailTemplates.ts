import { EmailRenderedContent } from './emailTypes';

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return isoString;
  }
}

/**
 * Strict privacy boundary:
 * Emails contain ONLY operational data (date, time, meet links, policies).
 * Client health evaluations and clinical notes are strictly segregated.
 */
export const EmailTemplates: Record<string, (data: Record<string, any>) => EmailRenderedContent> = {
  therapist_accepted_client: (data) => {
    const clientName = data.clientName || 'Valued Client';
    const therapistName = data.therapistName || 'Your Therapist';
    return {
      subject: `Ingress Within: ${therapistName} has accepted your care connection`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #0f172a; margin-bottom: 16px;">Care Connection Accepted</h2>
          <p>Hello ${clientName},</p>
          <p>We are pleased to inform you that <strong>${therapistName}</strong> has accepted your care connection request.</p>
          <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-weight: 500;">Next Step: First Session Coordination</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #475569;">
              Our clinical coordination team will connect with you shortly to finalize your first session time and provide your booking link.
            </p>
          </div>
          <p style="font-size: 14px; color: #64748b;">Warm regards,<br />The Ingress Within Care Team</p>
        </div>
      `,
      text: `Hello ${clientName},\n\nWe are pleased to inform you that ${therapistName} has accepted your care connection request.\n\nNext Step: Our clinical coordination team will connect with you shortly to finalize your first session time.\n\nWarm regards,\nThe Ingress Within Care Team`,
    };
  },

  first_session_coordination_team: (data) => {
    const therapistName = data.therapistName || 'Therapist';
    const clientEmail = data.clientEmail || 'Client';
    const matchId = data.matchId || '';
    return {
      subject: `[ACTION REQUIRED] First Session Coordination: Match #${matchId}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #0f172a; margin-bottom: 16px;">First Session Coordination Required</h2>
          <p>A new care connection was accepted and requires operational scheduling coordination.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Match ID</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${matchId}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Therapist</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${therapistName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Client Contact</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${clientEmail}</td></tr>
          </table>
          <p style="font-size: 14px; color: #475569;">Please verify availability and dispatch the initial session payment order.</p>
        </div>
      `,
      text: `First Session Coordination Required\n\nMatch ID: ${matchId}\nTherapist: ${therapistName}\nClient: ${clientEmail}\n\nPlease verify availability and dispatch the initial session payment order.`,
    };
  },

  session_confirmed: (data) => {
    const recipientName = data.recipientName || 'there';
    const otherPartyName = data.otherPartyName || 'Therapist';
    const formattedStart = formatDate(data.scheduledStart);
    const googleMeetUrl = data.googleMeetUrl || '';
    const bookingRef = data.bookingReference || '';

    return {
      subject: `Confirmed: Therapy Session with ${otherPartyName} (${formattedStart})`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #0f172a; margin-bottom: 16px;">Session Confirmed</h2>
          <p>Hello ${recipientName},</p>
          <p>Your therapy session with <strong>${otherPartyName}</strong> has been successfully booked and confirmed.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">Booking Reference: <strong>${bookingRef}</strong></p>
            <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #0f172a;">Time: ${formattedStart}</p>
            ${googleMeetUrl ? `
              <div style="margin-top: 16px;">
                <a href="${googleMeetUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">
                  Join with Google Meet
                </a>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">Direct Link: ${googleMeetUrl}</p>
              </div>
            ` : `
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #64748b;">Meeting link will synchronize to your calendar prior to the session.</p>
            `}
          </div>
          <h4 style="margin: 20px 0 8px 0; color: #334155;">Policy Guidelines</h4>
          <ul style="margin: 0 0 20px 0; padding-left: 20px; font-size: 13px; color: #475569;">
            <li><strong>Rescheduling:</strong> Permitted up to 24 hours before session start at no additional cost.</li>
            <li><strong>Cancellations:</strong> Cancellations made at least 48 hours prior receive a 100% refund. Cancellations made within 24 hours are non-refundable.</li>
          </ul>
          <p style="font-size: 14px; color: #64748b;">Warm regards,<br />The Ingress Within Care Team</p>
        </div>
      `,
      text: `Hello ${recipientName},\n\nYour therapy session with ${otherPartyName} is confirmed for ${formattedStart}.\n\nBooking Reference: ${bookingRef}\nMeeting Link: ${googleMeetUrl || 'Will sync to your calendar'}\n\nRescheduling: Permitted up to 24h before start.\nCancellations: 48h prior for full refund.\n\nWarm regards,\nThe Ingress Within Care Team`,
    };
  },

  session_rescheduled: (data) => {
    const recipientName = data.recipientName || 'there';
    const otherPartyName = data.otherPartyName || 'Therapist';
    const oldStart = formatDate(data.previousStart);
    const newStart = formatDate(data.newStart);
    const googleMeetUrl = data.googleMeetUrl || '';

    return {
      subject: `Rescheduled: Therapy Session with ${otherPartyName} (New Time: ${newStart})`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #0f172a; margin-bottom: 16px;">Session Rescheduled</h2>
          <p>Hello ${recipientName},</p>
          <p>Your session with <strong>${otherPartyName}</strong> has been rescheduled.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 6px 0; font-size: 13px; color: #94a3b8; text-decoration: line-through;">Previous Time: ${oldStart}</p>
            <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #16a34a;">New Time: ${newStart}</p>
            ${googleMeetUrl ? `
              <div style="margin-top: 12px;">
                <a href="${googleMeetUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">
                  Join with Google Meet
                </a>
              </div>
            ` : ''}
          </div>
          <p style="font-size: 13px; color: #64748b;">Your Google Calendar event has been automatically updated.</p>
          <p style="font-size: 14px; color: #64748b;">Warm regards,<br />The Ingress Within Care Team</p>
        </div>
      `,
      text: `Hello ${recipientName},\n\nYour session with ${otherPartyName} has been rescheduled from ${oldStart} to ${newStart}.\nMeeting Link: ${googleMeetUrl}\n\nWarm regards,\nThe Ingress Within Care Team`,
    };
  },

  session_cancelled: (data) => {
    const recipientName = data.recipientName || 'there';
    const otherPartyName = data.otherPartyName || 'Therapist';
    const scheduledStart = formatDate(data.scheduledStart);
    const reason = data.reason || 'Requested by user';
    const refundStatus = data.refundStatus || 'none';

    return {
      subject: `Cancelled: Therapy Session on ${scheduledStart}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #991b1b; margin-bottom: 16px;">Session Cancelled</h2>
          <p>Hello ${recipientName},</p>
          <p>The therapy session with <strong>${otherPartyName}</strong> scheduled for <strong>${scheduledStart}</strong> has been cancelled.</p>
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>Reason:</strong> ${reason}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #991b1b;">
              <strong>Refund Status:</strong> ${
                refundStatus === 'full'
                  ? 'A 100% full refund has been initiated to your original payment method.'
                  : refundStatus === 'eligible'
                  ? 'Your cancellation qualifies for a full refund and is processing.'
                  : refundStatus === 'failed'
                  ? 'Your refund is pending resolution by our care team and will be disbursed shortly.'
                  : refundStatus === 'denied'
                  ? 'Non-refundable (cancellation occurred within 24 hours of session).'
                  : 'Pending administrative review under platform cancellation guidelines.'
              }
            </p>
          </div>
          <p style="font-size: 14px; color: #64748b;">If you have any questions, please contact our support team at care@ingresswithin.com.</p>
        </div>
      `,
      text: `Hello ${recipientName},\n\nThe therapy session with ${otherPartyName} on ${scheduledStart} has been cancelled.\nReason: ${reason}\nRefund Status: ${refundStatus}\n\nWarm regards,\nThe Ingress Within Care Team`,
    };
  },

  refund_initiated: (data) => {
    const recipientName = data.recipientName || 'Valued Client';
    const amountInr = (data.amountPaise ? (data.amountPaise / 100).toFixed(2) : data.amountInr) || '0.00';
    const refundId = data.refundId || '';

    return {
      subject: `Refund Confirmation: INR ${amountInr} initiated`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #0f172a; margin-bottom: 16px;">Refund Processed</h2>
          <p>Hello ${recipientName},</p>
          <p>We have processed a full refund of <strong>INR ${amountInr}</strong> for your session.</p>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #166534;">Refund Reference: <strong>${refundId}</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 13px; color: #166534;">Funds typically reflect in your bank account or original payment method within 5–7 business days.</p>
          </div>
          <p style="font-size: 14px; color: #64748b;">Warm regards,<br />The Ingress Within Care Team</p>
        </div>
      `,
      text: `Hello ${recipientName},\n\nWe have processed a full refund of INR ${amountInr} for your session.\nRefund Reference: ${refundId}\n\nFunds typically reflect within 5-7 business days.\n\nWarm regards,\nThe Ingress Within Care Team`,
    };
  },

  no_show_recorded: (data) => {
    const recipientName = data.recipientName || 'there';
    const attendanceStatus = data.attendanceStatus || '';
    const scheduledStart = formatDate(data.scheduledStart);

    const isClientNoShow = attendanceStatus === 'client_no_show';

    return {
      subject: `Notice: Missed Appointment on ${scheduledStart}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #991b1b; margin-bottom: 16px;">Missed Appointment Notice</h2>
          <p>Hello ${recipientName},</p>
          <p>Our records indicate that the session scheduled for <strong>${scheduledStart}</strong> was recorded as unattended (${attendanceStatus}).</p>
          <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              ${isClientNoShow 
                ? 'Under our clinical scheduling terms, client unattended appointments are non-refundable to respect the clinician reserved time.'
                : 'A full refund has been initiated to your account due to therapist absence.'
              }
            </p>
          </div>
          <p style="font-size: 14px; color: #64748b;">Please reach out to support@ingresswithin.com if you believe this was recorded in error.</p>
        </div>
      `,
      text: `Hello ${recipientName},\n\nThe session scheduled for ${scheduledStart} was recorded as unattended (${attendanceStatus}).\n\nReach out to support@ingresswithin.com if you have any questions.\n\nWarm regards,\nThe Ingress Within Care Team`,
    };
  },
};
