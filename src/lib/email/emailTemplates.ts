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

  // =========================================================================
  // THERAPIST ONBOARDING & VERIFICATION WORKFLOW TEMPLATES
  // =========================================================================

  therapist_application_submitted_admin: (data) => {
    const therapistName = data.therapistName || 'Applicant';
    const email = data.email || 'Not provided';
    const specialization = Array.isArray(data.specialization) 
      ? data.specialization.join(', ') 
      : (data.specialization || 'Clinical Psychology');
    const experience = data.experience !== undefined && data.experience !== null 
      ? `${data.experience} years` 
      : 'Not specified';
    const submittedAt = data.submittedAt ? formatDate(data.submittedAt) : 'Recently';
    const adminReviewUrl = data.adminReviewUrl || 'https://ingresswithin.com/admin/applications';

    return {
      subject: `New Therapist Application — ${therapistName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="border-bottom: 2px solid #132A24; padding-bottom: 16px; margin-bottom: 24px;">
            <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #4E7A66;">Ingress Within Admin Notification</span>
            <h2 style="color: #132A24; margin: 6px 0 0 0; font-size: 22px;">New Therapist Application</h2>
          </div>
          <p style="font-size: 15px; color: #334155;">A new clinician has submitted an onboarding application for credential verification and clinical review.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 6px 0; color: #64748b; width: 140px;">Therapist:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${therapistName}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Email:</td><td style="padding: 6px 0; font-weight: 500; color: #0f172a;">${email}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Specialization:</td><td style="padding: 6px 0; color: #0f172a;">${specialization}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Experience:</td><td style="padding: 6px 0; color: #0f172a;">${experience}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Status:</td><td style="padding: 6px 0;"><span style="background-color: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 12px;">Submitted / Under Review</span></td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Submitted At:</td><td style="padding: 6px 0; color: #475569;">${submittedAt}</td></tr>
            </table>
          </div>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${adminReviewUrl}" target="_blank" style="display: inline-block; background-color: #132A24; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Review Application in Admin Portal
            </a>
          </div>
          <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px;">
            Secure administrative link requires authenticated founder/admin session. Sensitive credentials and clinical notes are gated behind role authorization.
          </p>
        </div>
      `,
      text: `Ingress Within — New Therapist Application\n\nA new therapist has submitted an application for review.\n\nTherapist: ${therapistName}\nEmail: ${email}\nSpecialization: ${specialization}\nExperience: ${experience}\nStatus: Submitted / Under Review\nSubmitted: ${submittedAt}\n\nReview Application in Admin Portal:\n${adminReviewUrl}\n\nIngress Within Clinical Administration`,
    };
  },

  therapist_application_received: (data) => {
    const therapistName = data.therapistName || 'Doctor/Counselor';
    const statusUrl = data.statusUrl || 'https://ingresswithin.com/therapist/application/status';

    return {
      subject: `Your Ingress Within Therapist Application Has Been Received`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="border-bottom: 2px solid #4E7A66; padding-bottom: 16px; margin-bottom: 24px;">
            <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #4E7A66;">Ingress Within Clinician Network</span>
            <h2 style="color: #132A24; margin: 6px 0 0 0; font-size: 22px;">Application Received</h2>
          </div>
          <p style="font-size: 15px; color: #334155;">Hello ${therapistName},</p>
          <p style="font-size: 14px; color: #475569;">Thank you for submitting your application to join the Ingress Within mental healthcare network. We have safely received your profile, clinical preferences, and verification documents.</p>
          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px 20px; margin: 24px 0; border-radius: 6px;">
            <p style="margin: 0; font-weight: 600; color: #166534; font-size: 14px;">Current Status: UNDER REVIEW</p>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #15803d; line-height: 1.5;">
              Our clinical governance team will examine your degree credentials, state licensure, and submitted practice modalities.
            </p>
          </div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; color: #475569;">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #0f172a;">Important Information Regarding Review:</p>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Document submission does not in itself constitute practice verification.</li>
              <li>Your profile will remain private and hidden from prospective clients until clinical verification is finalized.</li>
              <li>You will receive an automated notification as soon as our administrative decision is recorded.</li>
            </ul>
          </div>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${statusUrl}" target="_blank" style="display: inline-block; background-color: #132A24; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
              View Application Status
            </a>
          </div>
          <p style="font-size: 14px; color: #64748b; margin-top: 24px;">Warm regards,<br /><strong>The Ingress Within Clinical Team</strong></p>
          <p style="font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px;">
            Need to update an uploaded document or have questions? Contact us directly at <a href="mailto:contactus@ingresswithin.com" style="color: #4E7A66;">contactus@ingresswithin.com</a>.
          </p>
        </div>
      `,
      text: `Hello ${therapistName},\n\nWe have received your therapist application for Ingress Within.\n\nYour application is currently:\nUNDER REVIEW\n\nOur clinical and administrative review team will review the information, certifications, and credentials you submitted.\n\nPlease note: Uploading documents does not itself mean verification. Your profile remains hidden from clients until credentialing is complete. You will receive another email when your application status changes.\n\nView Application Status:\n${statusUrl}\n\nWarm regards,\nThe Ingress Within Clinical Team\ncontactus@ingresswithin.com`,
    };
  },

  therapist_application_approved: (data) => {
    const therapistName = data.therapistName || 'Doctor/Counselor';
    const dashboardUrl = data.dashboardUrl || 'https://ingresswithin.com/therapist';

    return {
      subject: `Your Ingress Within Therapist Application Has Been Approved`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="border-bottom: 2px solid #16a34a; padding-bottom: 16px; margin-bottom: 24px;">
            <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #16a34a;">Clinical Practice Authorization</span>
            <h2 style="color: #132A24; margin: 6px 0 0 0; font-size: 22px;">Congratulations — Application Approved!</h2>
          </div>
          <p style="font-size: 15px; color: #334155;">Hello ${therapistName},</p>
          <p style="font-size: 14px; color: #475569;">We are delighted to share that your therapist application has been formally approved by the Ingress Within clinical governance and verification team.</p>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; font-weight: 600; color: #166534; font-size: 15px;">Your Therapist Account is Now Verified</p>
            <p style="margin: 8px 0 0 0; font-size: 13px; color: #15803d; line-height: 1.5;">
              Practice authorization has been granted. You are now authorized to provide psychotherapy consultations on the Ingress Within platform in accordance with our clinical standards.
            </p>
          </div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0; font-size: 13px; color: #334155;">
            <p style="margin: 0 0 10px 0; font-weight: 600; color: #0f172a;">Recommended Next Steps in Your Workspace:</p>
            <ol style="margin: 0; padding-left: 20px; line-height: 1.8;">
              <li><strong>Connect Google Calendar</strong> to synchronize availability and automated Google Meet links.</li>
              <li><strong>Configure Practice Hours</strong> and set weekly session buffers.</li>
              <li><strong>Link Payout Details</strong> under Earnings to receive direct session honorariums.</li>
            </ol>
          </div>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${dashboardUrl}" target="_blank" style="display: inline-block; background-color: #132A24; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Open Therapist Dashboard
            </a>
          </div>
          <p style="font-size: 14px; color: #64748b; margin-top: 24px;">Welcome to the network,<br /><strong>The Ingress Within Clinical Team</strong></p>
        </div>
      `,
      text: `Hello ${therapistName},\n\nYour therapist application has been approved by the Ingress Within review team.\n\nYour therapist account is now approved and verified for clinical practice.\n\nYou can now continue setting up your professional profile, connect your Google Calendar for session syncing, and begin accepting client connections.\n\nOpen Therapist Dashboard:\n${dashboardUrl}\n\nWelcome to the network,\nThe Ingress Within Clinical Team`,
    };
  },

  therapist_application_rejected: (data) => {
    const therapistName = data.therapistName || 'Doctor/Counselor';
    const rejectionReason = data.rejectionReason || 'Uploaded documentation was incomplete or could not be verified.';
    const reviewUrl = data.reviewUrl || 'https://ingresswithin.com/therapist/application/status';

    return {
      subject: `Update Regarding Your Ingress Within Therapist Application`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="border-bottom: 2px solid #64748b; padding-bottom: 16px; margin-bottom: 24px;">
            <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #64748b;">Ingress Within Application Status</span>
            <h2 style="color: #132A24; margin: 6px 0 0 0; font-size: 22px;">Application Review Update</h2>
          </div>
          <p style="font-size: 15px; color: #334155;">Hello ${therapistName},</p>
          <p style="font-size: 14px; color: #475569;">Thank you for your patience while our clinical review board evaluated your onboarding application.</p>
          <p style="font-size: 14px; color: #475569;">After careful examination of the credentials and submission provided, your application was not approved for platform practice at this time.</p>
          <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 16px 20px; margin: 24px 0; border-radius: 6px;">
            <p style="margin: 0 0 6px 0; font-weight: 600; color: #9a3412; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Clinical Review Feedback</p>
            <p style="margin: 0; font-size: 14px; color: #7c2d12; line-height: 1.5;">${rejectionReason}</p>
          </div>
          <p style="font-size: 14px; color: #475569;">
            If your application can be updated with supplementary certificates, revised license details, or updated documentation, you may review your submission and resubmit for reconsideration:
          </p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${reviewUrl}" target="_blank" style="display: inline-block; background-color: #132A24; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Review Application & Resubmit
            </a>
          </div>
          <p style="font-size: 14px; color: #64748b; margin-top: 24px;">Respectfully,<br /><strong>The Ingress Within Clinical Review Team</strong></p>
          <p style="font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px;">
            If you have questions regarding this feedback, our clinical support team is available at <a href="mailto:contactus@ingresswithin.com" style="color: #4E7A66;">contactus@ingresswithin.com</a>.
          </p>
        </div>
      `,
      text: `Hello ${therapistName},\n\nWe have completed the clinical review of your Ingress Within therapist application.\n\nYour application was not approved at this time.\n\nFeedback / Reason:\n${rejectionReason}\n\nIf your application can be updated and resubmitted, you can review the requested modifications and resubmit here:\n${reviewUrl}\n\nRespectfully,\nThe Ingress Within Clinical Review Team\ncontactus@ingresswithin.com`,
    };
  },
};

