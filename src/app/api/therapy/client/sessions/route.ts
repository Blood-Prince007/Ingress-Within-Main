import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';
import { supabase } from '../../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    // Fetch client appointments
    const { data: appts, error } = await supabase
      .from('therapist_clinical_appointments')
      .select(`
        id,
        scheduled_start,
        scheduled_end,
        status,
        session_type,
        modality,
        meeting_link,
        google_meet_url,
        google_meet_status,
        calendar_sync_status,
        attendance_status,
        refund_status,
        created_at,
        therapist_account_id
      `)
      .eq('user_id', authUser.userId)
      .order('scheduled_start', { ascending: false });

    if (error) {
      return NextResponse.json({ error: { code: 'FETCH_FAILED', message: error.message } }, { status: 500 });
    }

    // Enhance with therapist details & policy metrics
    const therapistIds = [...new Set((appts || []).map((a) => a.therapist_account_id))];
    let therapistsMap: Record<string, any> = {};

    if (therapistIds.length > 0) {
      const { data: therapists } = await supabase
        .from('therapist_accounts')
        .select('id, full_name, email')
        .in('id', therapistIds);

      therapists?.forEach((t) => {
        therapistsMap[t.id] = t;
      });
    }

    const now = Date.now();
    const formatted = (appts || []).map((appt) => {
      const startTime = new Date(appt.scheduled_start).getTime();
      const hoursRemaining = (startTime - now) / (1000 * 60 * 60);

      const isUpcoming = ['scheduled', 'confirmed', 'rescheduled'].includes(appt.status) && startTime > now;
      const canReschedule = isUpcoming && hoursRemaining >= 24;
      const canCancel = isUpcoming;
      const refundEligible = hoursRemaining >= 48;

      const therapist = therapistsMap[appt.therapist_account_id];

      return {
        id: appt.id,
        scheduledStart: appt.scheduled_start,
        scheduledEnd: appt.scheduled_end,
        status: appt.status,
        sessionType: appt.session_type,
        modality: appt.modality,
        googleMeetUrl: appt.google_meet_url || appt.meeting_link,
        googleMeetStatus: appt.google_meet_status || (appt.google_meet_url ? 'succeeded' : 'none'),
        calendarSyncStatus: appt.calendar_sync_status,
        attendanceStatus: appt.attendance_status,
        refundStatus: appt.refund_status,
        therapist: {
          id: appt.therapist_account_id,
          name: therapist?.full_name || 'Therapist',
        },
        policy: {
          canReschedule,
          canCancel,
          refundEligible,
          hoursUntilSession: Math.round(hoursRemaining * 10) / 10,
        },
      };
    });

    return NextResponse.json({ sessions: formatted });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'CLIENT_SESSIONS_ERROR', message: err.message || 'Failed to retrieve sessions' } },
      { status: 500 }
    );
  }
}
