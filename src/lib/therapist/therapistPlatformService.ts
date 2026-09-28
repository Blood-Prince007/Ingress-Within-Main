import { supabase } from '../db';
import { EmailService } from '../email/emailService';
import { TherapistPayoutService } from './therapistPayoutService';
import { GoogleCalendarService } from '../calendar/googleCalendarService';
import { GoogleAuthService } from '../calendar/googleAuthService';

export class TherapistPlatformService {
  /**
   * =========================================================================
   * 1. ONBOARDING & APPLICATION WORKFLOW
   * =========================================================================
   */

  /**
   * Retrieves the current onboarding draft / application for a therapist.
   */
  static async getOnboardingState(therapistAccountId: string) {
    // 1. Fetch application record if exists
    const { data: app } = await supabase
      .from('therapist_applications')
      .select('*')
      .eq('therapist_account_id', therapistAccountId)
      .maybeSingle();

    // 2. Fetch account & profile
    const { data: account } = await supabase
      .from('therapist_accounts')
      .select('id, phone_number, status, can_practice, application_status, verification_status, rci_registered, rci_number')
      .eq('id', therapistAccountId)
      .single();

    const { data: profile } = await supabase
      .from('therapist_profiles')
      .select('*')
      .eq('therapist_account_id', therapistAccountId)
      .maybeSingle();

    return {
      application: app || {
        step: 1,
        answers: {},
        documents: [],
        submitted_at: null,
        reviewed_at: null,
        reviewer_notes: null,
      },
      account: account || null,
      profile: profile || null,
    };
  }

  /**
   * Saves a draft step in the multi-step onboarding flow.
   */
  static async saveOnboardingDraft(
    therapistAccountId: string,
    step: number,
    answers: Record<string, any>,
    documents: any[] = []
  ) {
    const { data: existingApp } = await supabase
      .from('therapist_applications')
      .select('answers, documents')
      .eq('therapist_account_id', therapistAccountId)
      .maybeSingle();

    const mergedAnswers = {
      ...(existingApp?.answers || {}),
      ...answers,
    };

    const mergedDocuments = documents.length > 0 ? documents : (existingApp?.documents || []);

    const { data, error } = await supabase
      .from('therapist_applications')
      .upsert(
        {
          therapist_account_id: therapistAccountId,
          step: Math.max(1, Math.min(11, step)),
          answers: mergedAnswers,
          documents: mergedDocuments,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'therapist_account_id' }
      )
      .select('*')
      .single();

    if (error) {
      console.error('[TherapistPlatformService] saveOnboardingDraft failed:', error);
      throw new Error('Failed to save onboarding progress.');
    }

    return data;
  }

  /**
   * Formally submits the completed onboarding application for administrative review.
   * STRICT: sets application_status = 'submitted', can_practice remains false.
   */
  static async submitApplication(therapistAccountId: string, answers: Record<string, any>, documents: any[] = []) {
    const existing = await this.getOnboardingState(therapistAccountId);
    const mergedAnswers = {
      ...(existing.application?.answers || {}),
      ...answers,
    };

    const requiredChecks = [
      ['fullName', Boolean(mergedAnswers.fullName)],
      ['credentials', Boolean(mergedAnswers.credentials)],
      ['city', Boolean(mergedAnswers.city)],
      ['bio', Boolean(mergedAnswers.bio)],
      ['specialties', Array.isArray(mergedAnswers.specialties) && mergedAnswers.specialties.length > 0 && mergedAnswers.specialties.length <= 5],
      ['modalities', (Array.isArray(mergedAnswers.modalities) && mergedAnswers.modalities.length > 0) || (Array.isArray(mergedAnswers.customModalities) && mergedAnswers.customModalities.length > 0)],
      ['primaryModalities', Array.isArray(mergedAnswers.primaryModalities) && mergedAnswers.primaryModalities.length > 0 && mergedAnswers.primaryModalities.length <= 5],
      ['vignetteAnswers', Object.keys(mergedAnswers.vignetteAnswers || {}).length === 3],
      ['licenseNumber', Boolean(mergedAnswers.licenseNumber)],
      ['issuingBody', Boolean(mergedAnswers.issuingBody)],
      ['degreeCertificate', Boolean(mergedAnswers.degreeCertificate)],
      ['backgroundCheckConsent', mergedAnswers.backgroundCheckConsent !== undefined && mergedAnswers.backgroundCheckConsent !== null],
      ['higherAcuityInterest', mergedAnswers.higherAcuityInterest !== undefined && mergedAnswers.higherAcuityInterest !== null],
      ['ethicsDeclaration', mergedAnswers.ethicsDeclaration !== undefined && mergedAnswers.ethicsDeclaration !== null],
      ['truthfulnessConfirmed', mergedAnswers.truthfulnessConfirmed !== undefined && mergedAnswers.truthfulnessConfirmed !== null],
    ];
    const missing = requiredChecks.filter(([, ok]) => !ok).map(([key]) => key);
    if (missing.length) {
      const error: any = new Error(`Complete the required onboarding fields before submitting: ${missing.join(', ')}`);
      error.status = 400;
      error.code = 'ONBOARDING_INCOMPLETE';
      throw error;
    }
    if (mergedAnswers.traumaListed === 'Yes' && !mergedAnswers.traumaCertification) {
      const error: any = new Error('Trauma certification is required when requesting a trauma-informed listing.');
      error.status = 400; error.code = 'TRAUMA_CERTIFICATE_REQUIRED'; throw error;
    }

    const now = new Date().toISOString();

    const persistedDocuments = documents.length > 0 ? documents : (Array.isArray((existing.application as any)?.documents) ? (existing.application as any).documents : []);
    const onboardingStage = 'credentialing_in_review';
    const supervisionStatus = mergedAnswers?.supervision?.status || null;
    const backgroundCheckStatus = mergedAnswers?.backgroundCheckConsent ? 'pending' : 'flagged';

    // 1. Persist the complete application as a credentialing-review snapshot.
    const { data: app, error: appError } = await supabase
      .from('therapist_applications')
      .upsert(
        {
          therapist_account_id: therapistAccountId,
          step: 10,
          answers: mergedAnswers,
          documents: persistedDocuments,
          submitted_at: now,
          onboarding_stage: onboardingStage,
          acuity_clearance_level: 'none',
          background_check_status: backgroundCheckStatus,
          supervision_status: supervisionStatus,
          updated_at: now,
        },
        { onConflict: 'therapist_account_id' }
      )
      .select('*')
      .single();

    if (appError) {
      console.error('[TherapistPlatformService] submitApplication app error:', appError);
      throw new Error('Failed to submit application.');
    }

    // 2. Update therapist_accounts status
    await supabase
      .from('therapist_accounts')
      .update({
        application_status: 'submitted',
        can_practice: false,
        verification_status: 'pending',
        rci_registered: String(mergedAnswers.issuingBody || '').trim().toLowerCase().includes('rehabilitation council of india') || String(mergedAnswers.issuingBody || '').trim().toLowerCase() === 'rci',
        rci_number: mergedAnswers.licenseNumber || null,
        updated_at: now,
      })
      .eq('id', therapistAccountId);

    // 3. Update therapist_profiles with basic identity/credential details from application
    const broadSpecialtyTags = Array.isArray(mergedAnswers.broadSpecialtyTags) && mergedAnswers.broadSpecialtyTags.length
      ? mergedAnswers.broadSpecialtyTags.slice(0, 5)
      : (Array.isArray(mergedAnswers.specialties) ? mergedAnswers.specialties.slice(0, 5) : []);
    const modalities = Array.isArray(mergedAnswers.modalities) ? [...mergedAnswers.modalities, ...(Array.isArray(mergedAnswers.customModalities) ? mergedAnswers.customModalities : [])] : [];
    const maxCapacity = Number(mergedAnswers.maxCapacity);
    const currentCapacity = Number(mergedAnswers.currentCapacity);
    const soonestOpeningDays = Number(mergedAnswers.soonestOpeningDays);
    const severityCeiling = Number(mergedAnswers.severityCeiling);

    const profilePayload = {
      therapist_account_id: therapistAccountId,
      phone: existing.account?.phone_number || existing.profile?.phone || mergedAnswers.phone || null,
      full_name: mergedAnswers.fullName || existing.profile?.full_name,
      title: mergedAnswers.credentials || 'Clinical Psychologist',
      bio: mergedAnswers.bio || '',
      qualification: mergedAnswers.credentials || '',
      experience_years: Number(mergedAnswers.yearsOfExperience) || 0,
      specializations: Array.isArray(mergedAnswers.specialties) ? mergedAnswers.specialties : [],
      broad_specialty_tags: broadSpecialtyTags,
      modalities,
      languages: Array.isArray(mergedAnswers.languages) ? mergedAnswers.languages : [],
      session_formats: Array.isArray(mergedAnswers.sessionFormats) ? mergedAnswers.sessionFormats : [],
      profile_image_url: mergedAnswers.photo?.path || existing.profile?.profile_image_url || null,
      city: mergedAnswers.city || null,
      state: mergedAnswers.state || null,
      capacity_current: Number.isFinite(currentCapacity) ? currentCapacity : null,
      capacity_max: Number.isFinite(maxCapacity) ? maxCapacity : null,
      soonest_opening_days: Number.isFinite(soonestOpeningDays) ? soonestOpeningDays : null,
      concern_severity_ceiling: Number.isFinite(severityCeiling) ? severityCeiling : null,
      licensure_state_region: mergedAnswers.state || null,
      gender: mergedAnswers.gender || null,
      age_group_specialization: Array.isArray(mergedAnswers.ageGroups) ? mergedAnswers.ageGroups : [],
      style_axes: {},
      style_axes_review_flags: mergedAnswers.calibration || {},
      capacity_last_updated_at: now,
      data_freshness_flags: {},
      updated_at: now,
    };

    const { error: profileError } = await supabase
      .from('therapist_profiles')
      .upsert(profilePayload, { onConflict: 'therapist_account_id' });

    if (profileError) {
      console.error('[TherapistPlatformService] submitApplication profile error:', profileError);
      throw new Error('Failed to update therapist profile.');
    }

    return {
      success: true,
      application: app,
    };
  }

  /**
   * Internal / Admin Review action.
   * Can only be triggered by authorized administrative caller.
   */
  static async adminReviewTherapist(
    therapistAccountId: string,
    decision: 'approved' | 'rejected',
    reviewerId?: string,
    reviewerNotes?: string
  ) {
    const now = new Date().toISOString();
    const isApproved = decision === 'approved';

    // 1. Update therapist_accounts
    const { error: accountError } = await supabase
      .from('therapist_accounts')
      .update({
        status: isApproved ? 'active' : 'rejected',
        application_status: isApproved ? 'approved' : 'rejected',
        can_practice: isApproved,
        verification_status: isApproved ? 'verified' : 'rejected',
        updated_at: now,
      })
      .eq('id', therapistAccountId);

    if (accountError) {
      throw new Error(`Failed to update therapist account: ${accountError.message}`);
    }

    // 2. Update therapist_applications
    await supabase
      .from('therapist_applications')
      .update({
        reviewed_at: now,
        reviewed_by: reviewerId || null,
        reviewer_notes: reviewerNotes || (isApproved ? 'Approved by clinical administrator' : 'Application declined'),
        updated_at: now,
      })
      .eq('therapist_account_id', therapistAccountId);

    // 3. Create therapist notification
    await supabase
      .from('therapist_notifications')
      .insert({
        therapist_account_id: therapistAccountId,
        type: isApproved ? 'application_approved' : 'application_rejected',
        title: isApproved ? 'Application Approved' : 'Application Status Update',
        message: isApproved
          ? 'Your clinical application has been approved! You now have full access to your therapist workspace.'
          : 'Your clinical application was reviewed. Please contact clinical support for details.',
        link: isApproved ? '/therapist' : '/therapist/application',
      });

    return {
      success: true,
      decision,
      can_practice: isApproved,
    };
  }

  /**
   * =========================================================================
   * 2. TODAY DASHBOARD & OPERATIONAL OVERVIEW
   * =========================================================================
   */

  /**
   * Retrieves today's real operational metrics and schedule for an authorized therapist.
   */
  static async getTodayOverview(therapistAccountId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

    // 1. Today's sessions
    const { data: todaySessions } = await supabase
      .from('therapist_clinical_appointments')
      .select(`
        id,
        user_id,
        scheduled_start,
        scheduled_end,
        status,
        session_type,
        meeting_link,
        client_notes,
        users (
          id,
          name
        )
      `)
      .eq('therapist_account_id', therapistAccountId)
      .gte('scheduled_start', startOfToday)
      .lte('scheduled_start', endOfToday)
      .order('scheduled_start', { ascending: true });

    // 2. Next upcoming session
    const { data: upcomingSessions } = await supabase
      .from('therapist_clinical_appointments')
      .select(`
        id,
        user_id,
        scheduled_start,
        scheduled_end,
        status,
        session_type,
        meeting_link,
        users (
          id,
          name
        )
      `)
      .eq('therapist_account_id', therapistAccountId)
      .in('status', ['scheduled', 'confirmed'])
      .gte('scheduled_start', now.toISOString())
      .order('scheduled_start', { ascending: true })
      .limit(1);

    // 3. Pending matching requests assigned to this therapist
    const allAssignedRequests = await this.getAssignedRequests(therapistAccountId);
    const pendingRequests = allAssignedRequests
      .filter((r) => r.matchStatus === 'candidate' || r.matchStatus === 'shortlisted' || r.matchStatus === 'proposed')
      .map((r) => ({
        id: r.id,
        clientId: r.userId,
        clientDisplayName: r.clientDisplayName,
        matchStatus: r.matchStatus,
        fitScore: r.matchScore || 85,
        urgencyLevel: r.triageLevel || 'standard',
        preferredFormat: r.contactPreferences?.preferred_format || 'telehealth',
        presentingSummary: r.presentingReason || 'Seeking professional therapeutic support.',
        createdAt: r.createdAt,
      }));

    // 4. Active therapy care relationships
    const { data: rawActiveClients } = await supabase
      .from('therapy_care_relationships')
      .select(`
        id,
        user_id,
        status,
        total_sessions_completed,
        started_at,
        last_session_at,
        users (
          id,
          name
        )
      `)
      .eq('therapist_account_id', therapistAccountId)
      .eq('status', 'active')
      .order('last_session_at', { ascending: false, nullsFirst: false });

    const activeClients = (rawActiveClients || []).map((rel: any) => ({
      id: rel.id,
      clientId: rel.user_id,
      clientDisplayName: rel.users?.name || `Client #${rel.user_id.substring(0, 6)}`,
      status: rel.status,
      totalSessionsCompleted: rel.total_sessions_completed || 0,
      startedAt: rel.started_at,
      lastSessionAt: rel.last_session_at,
    }));

    // 5. Notes Due: Completed sessions without finalized SOAP note
    const { data: rawCompletedSessions } = await supabase
      .from('therapist_clinical_appointments')
      .select(`
        id,
        user_id,
        scheduled_start,
        scheduled_end,
        session_type,
        attendance_status,
        users (
          id,
          name
        )
      `)
      .eq('therapist_account_id', therapistAccountId)
      .eq('status', 'completed')
      .order('scheduled_end', { ascending: false });

    // No-shows must not appear in notesDue on the therapist Today view, nor require normal SOAP notes
    const attendedSessions = (rawCompletedSessions || []).filter(
      (s: any) => s.attendance_status !== 'client_no_show' && s.attendance_status !== 'therapist_no_show'
    );
    const completedIds = attendedSessions.map((s: any) => s.id);
    let notesDue: any[] = [];

    if (completedIds.length > 0) {
      const { data: notes } = await supabase
        .from('therapist_soap_notes')
        .select('appointment_id, is_draft')
        .in('appointment_id', completedIds);

      const finalizedSet = new Set(
        (notes || []).filter((n) => !n.is_draft).map((n) => n.appointment_id)
      );

      notesDue = attendedSessions
        .filter((s: any) => !finalizedSet.has(s.id))
        .map((s: any) => ({
          id: s.id,
          appointmentId: s.id,
          clientId: s.user_id,
          clientDisplayName: s.users?.name || `Client #${s.user_id.substring(0, 6)}`,
          scheduledStart: s.scheduled_start,
          scheduledEnd: s.scheduled_end,
          sessionType: s.session_type,
        }));
    }

    // 6. Unread notifications
    const { data: rawNotifications } = await supabase
      .from('therapist_notifications')
      .select('*')
      .eq('therapist_account_id', therapistAccountId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);

    const notifications = (rawNotifications || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type || 'info',
      createdAt: n.created_at,
      isRead: Boolean(n.is_read),
    }));

    // Next upcoming session
    const nextSession = upcomingSessions && upcomingSessions.length > 0 ? {
      id: upcomingSessions[0].id,
      clientId: upcomingSessions[0].user_id,
      clientDisplayName: (upcomingSessions[0] as any).users?.name || `Client #${upcomingSessions[0].user_id.substring(0, 6)}`,
      scheduledStart: upcomingSessions[0].scheduled_start,
      scheduledEnd: upcomingSessions[0].scheduled_end,
      status: upcomingSessions[0].status,
      sessionType: upcomingSessions[0].session_type,
      meetingLink: upcomingSessions[0].meeting_link,
    } : null;

    return {
      todaySessions: (todaySessions || []).map((session: any) => ({
        id: session.id,
        clientId: session.user_id,
        clientDisplayName: session.users?.name || `Client #${session.user_id.substring(0, 6)}`,
        scheduledStart: session.scheduled_start,
        scheduledEnd: session.scheduled_end,
        status: session.status,
        sessionType: session.session_type,
        meetingLink: session.meeting_link,
      })),
      nextSession,
      upcomingSession: nextSession, // Backward compatibility
      pendingRequests,
      activeClients,
      notesDue,
      notifications,
      metrics: {
        todaySessionsCount: (todaySessions || []).length,
        pendingRequestsCount: pendingRequests.length,
        activeClientsCount: activeClients.length,
        outstandingSoapNotesCount: notesDue.length,
        unreadNotificationsCount: notifications.length,
      }
    };
  }

  /**
   * =========================================================================
   * 3. REQUESTS MANAGEMENT (Matching Workflow)
   * =========================================================================
   */

  /**
   * Lists matching requests assigned to this therapist.
   * Exposes clinically safe triage/intake fields, strictly preserving client journal privacy.
   */
  static async getAssignedRequests(therapistAccountId: string) {
    if (!therapistAccountId) return [];

    try {
      const { data: matches, error } = await supabase
        .from('therapy_matches')
        .select('*')
        .eq('therapist_account_id', therapistAccountId)
        .order('created_at', { ascending: false });

      if (error || !matches || matches.length === 0) {
        return [];
      }

      const sessionIds = Array.from(new Set(matches.map((m: any) => m.therapy_session_id).filter(Boolean)));
      const userIds = Array.from(new Set(matches.map((m: any) => m.user_id).filter(Boolean)));

      const [intakesRes, sessionsRes, usersRes] = await Promise.all([
        sessionIds.length > 0
          ? supabase.from('therapy_intakes').select('*').in('therapy_session_id', sessionIds)
          : { data: [] },
        sessionIds.length > 0
          ? supabase.from('therapy_sessions').select('*').in('id', sessionIds)
          : { data: [] },
        userIds.length > 0
          ? supabase.from('users').select('id, name').in('id', userIds)
          : { data: [] },
      ]);

      const intakesBySessionId = new Map(
        (intakesRes.data || []).map((i: any) => [i.therapy_session_id, i])
      );
      const sessionsById = new Map(
        (sessionsRes.data || []).map((s: any) => [s.id, s])
      );
      const usersById = new Map(
        (usersRes.data || []).map((u: any) => [u.id, u])
      );

      return matches.map((m: any) => {
        const intake = intakesBySessionId.get(m.therapy_session_id);
        const session = sessionsById.get(m.therapy_session_id);
        const user = usersById.get(m.user_id);

        const clientDisplayName =
          intake?.full_name ||
          user?.name ||
          `Client #${(m.user_id || '').substring(0, 6).toUpperCase()}`;

        return {
          id: m.id,
          therapySessionId: m.therapy_session_id,
          userId: m.user_id,
          clientDisplayName,
          age: intake?.age || null,
          gender: intake?.gender || null,
          city: intake?.city || null,
          occupation: intake?.occupation || null,
          presentingReason: intake?.presenting_reason || 'General therapeutic consultation',
          concerns: intake?.concerns || [],
          affectedLifeAreas: intake?.affected_life_areas || [],
          ownWords: intake?.own_words || null,
          contactPreferences: intake?.contact_preferences || {},
          matchStatus: m.match_status,
          matchRank: m.match_rank || 1,
          matchScore: m.match_score ? Number(m.match_score) : 85,
          matchReasons: m.match_reasons || [],
          matchingMetadata: m.matching_metadata || {},
          journeyType: session?.journey_type || 'guided',
          triageLevel: session?.triage_level || 'standard',
          createdAt: m.created_at,
          updatedAt: m.updated_at,
        };
      });
    } catch (e) {
      return [];
    }
  }

  /**
   * Retrieves a single matching request by ID with strict therapist ownership verification.
   * Throws 404 if not found, 403 if assigned to another therapist.
   */
  static async getRequestById(therapistAccountId: string, matchId: string) {
    if (!therapistAccountId || !matchId) {
      const err: any = new Error('Therapist ID and Match ID are required.');
      err.code = 'INVALID_PARAMETERS';
      err.status = 400;
      throw err;
    }

    const { data: match, error: fetchErr } = await supabase
      .from('therapy_matches')
      .select('*')
      .eq('id', matchId)
      .maybeSingle();

    if (!match) {
      const err: any = new Error('Request not found.');
      err.code = 'REQUEST_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    if (match.therapist_account_id !== therapistAccountId) {
      const err: any = new Error('Request is not assigned to your practice.');
      err.code = 'REQUEST_FORBIDDEN';
      err.status = 403;
      throw err;
    }

    // Safely retrieve intake and session context
    const [intakeRes, sessionRes, userRes] = await Promise.all([
      match.therapy_session_id
        ? supabase.from('therapy_intakes').select('*').eq('therapy_session_id', match.therapy_session_id).maybeSingle()
        : { data: null },
      match.therapy_session_id
        ? supabase.from('therapy_sessions').select('*').eq('id', match.therapy_session_id).maybeSingle()
        : { data: null },
      match.user_id
        ? supabase.from('users').select('id, name').eq('id', match.user_id).maybeSingle()
        : { data: null },
    ]);

    const intake = intakeRes.data;
    const session = sessionRes.data;
    const user = userRes.data;

    const clientDisplayName =
      intake?.full_name ||
      user?.name ||
      `Client #${(match.user_id || '').substring(0, 6).toUpperCase()}`;

    return {
      id: match.id,
      therapySessionId: match.therapy_session_id,
      userId: match.user_id,
      clientDisplayName,
      age: intake?.age || null,
      gender: intake?.gender || null,
      city: intake?.city || null,
      occupation: intake?.occupation || null,
      presentingReason: intake?.presenting_reason || 'General therapeutic consultation',
      concerns: intake?.concerns || [],
      affectedLifeAreas: intake?.affected_life_areas || [],
      ownWords: intake?.own_words || null,
      contactPreferences: intake?.contact_preferences || {},
      matchStatus: match.match_status,
      matchRank: match.match_rank || 1,
      matchScore: match.match_score ? Number(match.match_score) : 85,
      matchReasons: match.match_reasons || [],
      matchingMetadata: match.matching_metadata || {},
      journeyType: session?.journey_type || 'guided',
      triageLevel: session?.triage_level || 'standard',
      createdAt: match.created_at,
      updatedAt: match.updated_at,
    };
  }

  /**
   * Action on request: accept or decline.
   * Concurrency-safe, idempotent, with transactional rollback compensation.
   */
  static async handleRequestAction(
    therapistAccountId: string,
    matchId: string,
    action: 'accept' | 'decline',
    reason?: string
  ) {
    if (!therapistAccountId || !matchId) {
      const err: any = new Error('Therapist ID and Match ID are required.');
      err.code = 'INVALID_PARAMETERS';
      err.status = 400;
      throw err;
    }

    if (action !== 'accept' && action !== 'decline') {
      const err: any = new Error(`Invalid action: ${action}. Action must be 'accept' or 'decline'.`);
      err.code = 'INVALID_ACTION';
      err.status = 400;
      throw err;
    }

    // 1. Verify match existence and therapist ownership
    const { data: match, error: fetchErr } = await supabase
      .from('therapy_matches')
      .select('*')
      .eq('id', matchId)
      .maybeSingle();

    if (!match) {
      const err: any = new Error('Request not found.');
      err.code = 'REQUEST_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    if (match.therapist_account_id !== therapistAccountId) {
      const err: any = new Error('Request is not assigned to your practice.');
      err.code = 'REQUEST_FORBIDDEN';
      err.status = 403;
      throw err;
    }

    // 2. Handle ACCEPT Action via True PostgreSQL Database Transaction
    if (action === 'accept') {
      // Primary transactional mechanism: PostgreSQL atomic transaction function accept_therapy_match
      const { data: rpcResult, error: rpcError } = await supabase.rpc('accept_therapy_match', {
        p_therapist_account_id: therapistAccountId,
        p_match_id: matchId,
      });

      if (!rpcError && rpcResult) {
        // Dispath first-session operational coordination emails
        try {
          const { data: clientUser } = await supabase
            .from('users')
            .select('id, email, full_name')
            .eq('id', match.user_id)
            .maybeSingle();

          const { data: therapistAccount } = await supabase
            .from('therapist_accounts')
            .select('id, full_name')
            .eq('id', therapistAccountId)
            .maybeSingle();

          if (clientUser && therapistAccount) {
            await EmailService.notifyTherapistAccepted({
              matchId,
              therapistId: therapistAccountId,
              therapistName: therapistAccount.full_name || 'Therapist',
              clientId: clientUser.id,
              clientEmail: clientUser.email || 'client@ingresswithin.com',
              clientName: clientUser.full_name,
            });
          }
        } catch (emailErr) {
          console.warn('[TherapistPlatformService] Email notification on accept failed gracefully:', emailErr);
        }

        return {
          success: true,
          action: 'accept',
          matchId: rpcResult.match_id || matchId,
          matchStatus: rpcResult.match_status || 'selected',
          alreadyAccepted: Boolean(rpcResult.already_accepted),
          relationship: rpcResult.relationship || null,
          message: rpcResult.message || 'Client request accepted successfully.',
        };
      }

      if (rpcError) {
        const errorMsg = rpcError.message || '';
        if (errorMsg.includes('REQUEST_NOT_FOUND')) {
          const err: any = new Error('Request not found.');
          err.code = 'REQUEST_NOT_FOUND';
          err.status = 404;
          throw err;
        }
        if (errorMsg.includes('REQUEST_FORBIDDEN')) {
          const err: any = new Error('Request is not assigned to your practice.');
          err.code = 'REQUEST_FORBIDDEN';
          err.status = 403;
          throw err;
        }
        if (errorMsg.includes('REQUEST_ALREADY_DECLINED')) {
          const err: any = new Error('This request has already been declined and cannot be accepted.');
          err.code = 'REQUEST_ALREADY_DECLINED';
          err.status = 409;
          throw err;
        }
        if (errorMsg.includes('REQUEST_UNAVAILABLE')) {
          const err: any = new Error('This request is no longer available.');
          err.code = 'REQUEST_UNAVAILABLE';
          err.status = 409;
          throw err;
        }
        if (errorMsg.includes('INVALID_REQUEST_STATUS')) {
          const err: any = new Error('Request cannot be accepted from its current status.');
          err.code = 'INVALID_REQUEST_STATUS';
          err.status = 409;
          throw err;
        }

        console.error('[TherapistPlatformService] Database transaction error in accept_therapy_match:', rpcError);
        const err: any = new Error(rpcError.message || 'Database transaction failed during match acceptance.');
        err.code = 'TRANSACTION_FAILED';
        err.status = 500;
        throw err;
      }
    }

    // 3. Handle DECLINE Action via True PostgreSQL Database Transaction
    if (action === 'decline') {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('decline_therapy_match', {
        p_therapist_account_id: therapistAccountId,
        p_match_id: matchId,
        p_reason: reason ? String(reason).trim() : null,
      });

      if (!rpcError && rpcResult) {
        return {
          success: true,
          action: 'decline',
          matchId: rpcResult.match_id || matchId,
          matchStatus: rpcResult.match_status || 'rejected',
          alreadyDeclined: Boolean(rpcResult.already_declined),
          message: rpcResult.message || 'Client request declined successfully.',
        };
      }

      if (rpcError) {
        const errorMsg = rpcError.message || '';
        if (errorMsg.includes('REQUEST_NOT_FOUND')) {
          const err: any = new Error('Request not found.');
          err.code = 'REQUEST_NOT_FOUND';
          err.status = 404;
          throw err;
        }
        if (errorMsg.includes('REQUEST_FORBIDDEN')) {
          const err: any = new Error('Request is not assigned to your practice.');
          err.code = 'REQUEST_FORBIDDEN';
          err.status = 403;
          throw err;
        }

        console.error('[TherapistPlatformService] Database transaction error in decline_therapy_match:', rpcError);
        const err: any = new Error(rpcError.message || 'Database transaction failed during match decline.');
        err.code = 'TRANSACTION_FAILED';
        err.status = 500;
        throw err;
      }
    }

    const err: any = new Error(`Invalid action: ${action}`);
    err.code = 'INVALID_ACTION';
    err.status = 400;
    throw err;
  }

  /**
   * =========================================================================
   * 4. CLIENTS & CLINICAL PROFILES (Tenancy Isolated & Privacy Preserved)
   * =========================================================================
   */

  /**
   * Lists clients clinically connected to the authenticated therapist.
   */
  static async getAuthorizedClients(therapistAccountId: string, search?: string) {
    try {
      const { data: relationships, error } = await supabase
        .from('therapy_care_relationships')
        .select(`
          id,
          user_id,
          status,
          care_stage,
          started_at,
          users (
            id,
            name,
            phone_number
          )
        `)
        .eq('therapist_account_id', therapistAccountId)
        .order('started_at', { ascending: false });

      if (error || !relationships) {
        if (error) console.error('[TherapistPlatformService] getAuthorizedClients error:', error);
        return [];
      }

      // Enrich with appointment count
      const clientIds = relationships.map((r) => r.user_id);
      let sessionCounts: Record<string, number> = {};

      if (clientIds.length > 0) {
        const { data: appts } = await supabase
          .from('therapist_clinical_appointments')
          .select('user_id')
          .eq('therapist_account_id', therapistAccountId)
          .in('user_id', clientIds);

        (appts || []).forEach((a) => {
          sessionCounts[a.user_id] = (sessionCounts[a.user_id] || 0) + 1;
        });
      }

      let clients = relationships.map((r: any) => ({
        relationshipId: r.id,
        clientId: r.user_id,
        name: r.users?.name || `Client #${r.user_id.substring(0, 6)}`,
        phone: r.users?.phone_number ? `+91••••••${r.users.phone_number.slice(-4)}` : 'Confidential',
        status: r.status,
        careStage: r.care_stage,
        startedAt: r.started_at,
        totalSessions: sessionCounts[r.user_id] || 0,
      }));

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        clients = clients.filter((c) => c.name.toLowerCase().includes(q));
      }

      return clients;
    } catch (e) {
      console.error('[TherapistPlatformService] getAuthorizedClients exception:', e);
      return [];
    }
  }

  /**
   * Fetches single client clinical profile.
   * PRIVACY GUARANTEE: Does NOT query or return private journals/reflections.
   */
  static async getClientClinicalProfile(therapistAccountId: string, clientId: string) {
    // 1. Verify clinical tenancy
    const { data: relationship, error: relError } = await supabase
      .from('therapy_care_relationships')
      .select('*')
      .eq('therapist_account_id', therapistAccountId)
      .eq('user_id', clientId)
      .maybeSingle();

    if (relError || !relationship) {
      const err: any = new Error('Client not found or not in your clinical care roster.');
      err.status = 404;
      err.code = 'CLIENT_NOT_AUTHORIZED';
      throw err;
    }

    // 2. Fetch user profile
    const { data: user } = await supabase
      .from('users')
      .select('id, name, created_at')
      .eq('id', clientId)
      .single();

    // 3. Fetch authorized intake information
    const { data: intake } = await supabase
      .from('therapy_intakes')
      .select(`
        full_name,
        age,
        gender,
        occupation,
        city,
        living_situation,
        presenting_reason,
        concerns,
        affected_life_areas,
        mental_health_history,
        coping_and_support,
        expectations
      `)
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 4. Fetch triage / safety summary (if evaluated)
    const { data: safety } = await supabase
      .from('therapy_safety_assessments')
      .select('safety_status, triage_level, evaluated_at')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 5. Fetch appointments history between this therapist and client
    const { data: appointments } = await supabase
      .from('therapist_clinical_appointments')
      .select(`
        id,
        scheduled_start,
        scheduled_end,
        status,
        session_type,
        meeting_link,
        client_notes,
        created_at
      `)
      .eq('therapist_account_id', therapistAccountId)
      .eq('user_id', clientId)
      .order('scheduled_start', { ascending: false });

    // 6. Fetch SOAP notes for these appointments
    const appointmentIds = (appointments || []).map((a) => a.id);
    let soapNotes: any[] = [];
    if (appointmentIds.length > 0) {
      const { data: notes } = await supabase
        .from('therapist_soap_notes')
        .select('*')
        .in('appointment_id', appointmentIds)
        .eq('therapist_account_id', therapistAccountId)
        .order('created_at', { ascending: false });
      soapNotes = notes || [];
    }

    return {
      relationship: {
        id: relationship.id,
        status: relationship.status,
        careStage: relationship.care_stage,
        startedAt: relationship.started_at,
        endedAt: relationship.ended_at,
      },
      client: {
        id: clientId,
        name: user?.name || intake?.full_name || `Client #${clientId.substring(0, 6)}`,
        age: intake?.age || null,
        gender: intake?.gender || null,
        occupation: intake?.occupation || null,
        city: intake?.city || null,
      },
      clinicalIntake: intake ? {
        presentingReason: intake.presenting_reason,
        concerns: intake.concerns,
        affectedLifeAreas: intake.affected_life_areas,
        mentalHealthHistory: intake.mental_health_history,
        copingAndSupport: intake.coping_and_support,
        expectations: intake.expectations,
      } : null,
      safetyAssessment: safety ? {
        safetyStatus: safety.safety_status,
        triageLevel: safety.triage_level,
        evaluatedAt: safety.evaluated_at,
      } : null,
      appointments: appointments || [],
      soapNotes,
    };
  }

  /**
   * Updates care stage for a client.
   */
  static async updateCareStage(
    therapistAccountId: string,
    clientId: string,
    careStage: 'intake' | 'active_care' | 'maintenance' | 'completed',
    status?: 'active' | 'paused' | 'transferred' | 'completed' | 'terminated',
    reason?: string
  ) {
    const result = await this.transitionCareStage(therapistAccountId, clientId, careStage, reason);
    if (status && status !== result.relationship.status) {
      const updatePayload: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === 'completed' || status === 'terminated') {
        updatePayload.ended_at = new Date().toISOString();
      }
      const { data: updatedWithStatus } = await supabase
        .from('therapy_care_relationships')
        .update(updatePayload)
        .eq('id', result.relationship.id)
        .select('*')
        .single();
      if (updatedWithStatus) {
        return updatedWithStatus;
      }
    }
    return result.relationship;
  }

  /**
   * Retrieves longitudinal Care Journey data for an authorized client.
   * Privacy Boundary: strictly excludes personal journals, reflections,
   * self-work modules, and internal client entries.
   */
  static async getCareJourney(therapistAccountId: string, clientId: string) {
    // 1. Locate therapist's care relationship with client and enforce strict tenancy
    const { data: rel, error: relErr } = await supabase
      .from('therapy_care_relationships')
      .select('id, therapist_account_id, user_id, status, care_stage, started_at, ended_at, metadata, created_at, updated_at')
      .eq('therapist_account_id', therapistAccountId)
      .eq('user_id', clientId)
      .maybeSingle();

    if (relErr || !rel) {
      const err: any = new Error('Client care relationship not found or unauthorized.');
      err.status = 404;
      err.code = 'CLIENT_NOT_AUTHORIZED';
      throw err;
    }

    // 2. Fetch client display name (safe basic identity)
    const { data: user } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', clientId)
      .maybeSingle();

    // 3. Fetch stage transition history
    const { data: histRows } = await supabase
      .from('therapy_care_stage_history')
      .select('id, previous_stage, new_stage, changed_at, reason')
      .eq('relationship_id', rel.id)
      .eq('therapist_account_id', therapistAccountId)
      .order('changed_at', { ascending: false });

    // 4. Fetch authorized intake information (clinical presenting context only)
    const { data: intake } = await supabase
      .from('therapy_intakes')
      .select('presenting_reason, concerns')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 5. Fetch authorized safety assessment summary
    const { data: safety } = await supabase
      .from('therapy_safety_assessments')
      .select('safety_status, triage_level, evaluated_at')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 6. Fetch canonical appointments for this relationship
    const { data: appointments } = await supabase
      .from('therapist_clinical_appointments')
      .select('id, scheduled_start, scheduled_end, status, attendance_status, session_type, modality, meeting_link, created_at')
      .eq('therapist_account_id', therapistAccountId)
      .eq('user_id', clientId)
      .order('scheduled_start', { ascending: false });

    const appts = appointments || [];
    const now = new Date();

    const totalSessions = appts.length;
    const completedSessions = appts.filter(
      (a) => a.status === 'completed' && a.attendance_status !== 'client_no_show' && a.attendance_status !== 'therapist_no_show'
    ).length;
    const upcomingSessions = appts.filter(
      (a) => ['scheduled', 'confirmed', 'in_progress'].includes(a.status) && new Date(a.scheduled_start) >= now
    ).length;
    const cancelledSessions = appts.filter((a) => a.status === 'cancelled').length;

    // Latest session (most recent completed or past session)
    const pastOrCompleted = appts
      .filter((a) => a.status === 'completed' || new Date(a.scheduled_start) <= now)
      .sort((a, b) => new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime());
    const latestAppt = pastOrCompleted[0] || null;

    // Next upcoming session
    const upcomingList = appts
      .filter((a) => ['scheduled', 'confirmed'].includes(a.status) && new Date(a.scheduled_start) >= now)
      .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime());
    const nextAppt = upcomingList[0] || null;

    // 7. Fetch SOAP note metadata for these appointments
    const appointmentIds = appts.map((a) => a.id);
    let latestSoapDto: any = null;
    if (appointmentIds.length > 0) {
      const { data: notes } = await supabase
        .from('therapist_soap_notes')
        .select('id, appointment_id, is_draft, finalized_at, created_at, updated_at')
        .in('appointment_id', appointmentIds)
        .eq('therapist_account_id', therapistAccountId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (notes && notes.length > 0) {
        const n = notes[0];
        const linkedAppt = appts.find((a) => a.id === n.appointment_id);
        latestSoapDto = {
          id: n.id,
          appointmentId: n.appointment_id,
          sessionId: n.appointment_id,
          status: n.is_draft ? 'draft' : 'finalized',
          isDraft: n.is_draft,
          finalizedAt: n.finalized_at || null,
          updatedAt: n.updated_at,
          sessionDate: linkedAppt ? linkedAppt.scheduled_start : null,
        };
      }
    }

    const stageHistory = (histRows || []).map((h) => ({
      id: h.id,
      previousStage: h.previous_stage,
      newStage: h.new_stage,
      changedAt: h.changed_at,
      reason: h.reason || null,
    }));

    return {
      client: {
        id: clientId,
        displayName: user?.name || `Client #${clientId.substring(0, 6)}`,
      },
      relationship: {
        id: rel.id,
        status: rel.status,
        careStage: rel.care_stage,
        startedAt: rel.started_at,
        endedAt: rel.ended_at || null,
      },
      stageHistory,
      intake: intake ? {
        presentingReason: intake.presenting_reason || null,
        concerns: intake.concerns || [],
      } : null,
      safetySummary: safety ? {
        safetyStatus: safety.safety_status || null,
        triageLevel: safety.triage_level || null,
        evaluatedAt: safety.evaluated_at || null,
      } : null,
      sessions: {
        total: totalSessions,
        completed: completedSessions,
        upcoming: upcomingSessions,
        cancelled: cancelledSessions,
      },
      latestSession: latestAppt ? {
        id: latestAppt.id,
        scheduledStart: latestAppt.scheduled_start,
        scheduledEnd: latestAppt.scheduled_end,
        status: latestAppt.status,
        sessionType: latestAppt.session_type,
        meetingLink: latestAppt.meeting_link,
      } : null,
      nextSession: nextAppt ? {
        id: nextAppt.id,
        scheduledStart: nextAppt.scheduled_start,
        scheduledEnd: nextAppt.scheduled_end,
        status: nextAppt.status,
        sessionType: nextAppt.session_type,
        meetingLink: nextAppt.meeting_link,
      } : null,
      latestSoapNote: latestSoapDto,
    };
  }

  /**
   * Atomic, transactional Care Stage Transition.
   * Enforces canonical state machine:
   *   intake -> active_care | completed
   *   active_care -> maintenance | completed
   *   maintenance -> active_care | completed
   *   completed -> terminal state (no transitions allowed)
   * Prevents duplicate history entries through idempotency checks.
   */
  static async transitionCareStage(
    therapistAccountId: string,
    clientId: string,
    newStage: string,
    reason?: string
  ): Promise<{
    success: boolean;
    idempotent?: boolean;
    relationship: any;
    transition: any;
  }> {
    const validStages = ['intake', 'active_care', 'maintenance', 'completed'];
    if (!newStage || !validStages.includes(newStage)) {
      const err: any = new Error('Valid care_stage is required (intake, active_care, maintenance, completed).');
      err.status = 400;
      err.code = 'INVALID_CARE_STAGE';
      throw err;
    }

    // 1. Try atomic PostgreSQL RPC first
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc(
        'therapist_transition_care_stage_atomic',
        {
          p_therapist_account_id: therapistAccountId,
          p_user_id: clientId,
          p_new_stage: newStage,
          p_reason: reason || null,
        }
      );

      if (!rpcErr && rpcData) {
        return rpcData;
      }

      if (rpcErr && rpcErr.message && !rpcErr.message.includes('function') && !rpcErr.message.includes('does not exist')) {
        const msg = rpcErr.message;
        const err: any = new Error(msg);
        if (msg.includes('INVALID_CARE_STAGE_TRANSITION')) {
          err.status = 400;
          err.code = 'INVALID_CARE_STAGE_TRANSITION';
        } else if (msg.includes('INVALID_CARE_STAGE')) {
          err.status = 400;
          err.code = 'INVALID_CARE_STAGE';
        } else if (msg.includes('CLIENT_NOT_AUTHORIZED')) {
          err.status = 404;
          err.code = 'CLIENT_NOT_AUTHORIZED';
        } else if (msg.includes('RELATIONSHIP_TERMINATED')) {
          err.status = 409;
          err.code = 'RELATIONSHIP_TERMINATED';
        } else {
          err.status = 400;
          err.code = 'CARE_STAGE_TRANSITION_ERROR';
        }
        throw err;
      }
    } catch (e: any) {
      if (
        (e.code && e.code.startsWith('INVALID_')) ||
        e.code === 'CLIENT_NOT_AUTHORIZED' ||
        e.code === 'RELATIONSHIP_TERMINATED'
      ) {
        throw e;
      }
    }

    // 2. Application-level fallback state machine with ACID integrity
    const { data: rel, error: relErr } = await supabase
      .from('therapy_care_relationships')
      .select('id, therapist_account_id, user_id, status, care_stage, started_at, ended_at')
      .eq('therapist_account_id', therapistAccountId)
      .eq('user_id', clientId)
      .maybeSingle();

    if (relErr || !rel) {
      const err: any = new Error('Client care relationship not found or unauthorized.');
      err.status = 404;
      err.code = 'CLIENT_NOT_AUTHORIZED';
      throw err;
    }

    if (rel.status === 'completed' || rel.status === 'terminated') {
      const err: any = new Error('Relationship has ended. Stage cannot be modified.');
      err.status = 409;
      err.code = 'RELATIONSHIP_TERMINATED';
      throw err;
    }

    // Idempotency: if already in requested stage, return existing state without duplicate history
    if (rel.care_stage === newStage) {
      return {
        success: true,
        idempotent: true,
        relationship: rel,
        transition: null,
      };
    }

    // State machine progression validation
    const current = rel.care_stage;
    if (current === 'intake' && !['active_care', 'completed'].includes(newStage)) {
      const err: any = new Error(`Cannot transition care stage from '${current}' to '${newStage}'.`);
      err.status = 400;
      err.code = 'INVALID_CARE_STAGE_TRANSITION';
      throw err;
    } else if (current === 'active_care' && !['maintenance', 'completed'].includes(newStage)) {
      const err: any = new Error(`Cannot transition care stage from '${current}' to '${newStage}'.`);
      err.status = 400;
      err.code = 'INVALID_CARE_STAGE_TRANSITION';
      throw err;
    } else if (current === 'maintenance' && !['active_care', 'completed'].includes(newStage)) {
      const err: any = new Error(`Cannot transition care stage from '${current}' to '${newStage}'.`);
      err.status = 400;
      err.code = 'INVALID_CARE_STAGE_TRANSITION';
      throw err;
    } else if (current === 'completed') {
      const err: any = new Error('Care is already completed. Stage transitions out of completed are prohibited.');
      err.status = 400;
      err.code = 'INVALID_CARE_STAGE_TRANSITION';
      throw err;
    }

    const updatePayload: Record<string, any> = {
      care_stage: newStage,
      updated_at: new Date().toISOString(),
    };
    if (newStage === 'completed') {
      updatePayload.ended_at = new Date().toISOString();
    }

    const { data: updatedRel, error: updateErr } = await supabase
      .from('therapy_care_relationships')
      .update(updatePayload)
      .eq('id', rel.id)
      .select('*')
      .single();

    if (updateErr) {
      throw new Error(`Failed to update care relationship: ${updateErr.message}`);
    }

    const { data: histRow } = await supabase
      .from('therapy_care_stage_history')
      .insert({
        relationship_id: rel.id,
        therapist_account_id: therapistAccountId,
        user_id: clientId,
        previous_stage: current,
        new_stage: newStage,
        changed_by: therapistAccountId,
        reason: reason || null,
      })
      .select('*')
      .single();

    return {
      success: true,
      idempotent: false,
      relationship: updatedRel,
      transition: histRow || null,
    };
  }

  /**
   * =========================================================================
   * 5. SESSIONS, BOOKING & CONFLICT PREVENTION
   * =========================================================================
   */

  /**
   * Comprehensive conflict check: validates timestamps, client authorization,
   * working hours, busy blocks, and therapist/client overlaps.
   */
  static async validateSessionConflict(
    therapistAccountId: string,
    userId: string,
    scheduledStartIso: string,
    scheduledEndIso: string,
    excludeAppointmentId?: string
  ): Promise<{ hasConflict: boolean; reason?: string; code?: string }> {
    const start = new Date(scheduledStartIso);
    const end = new Date(scheduledEndIso);

    // 1. Validate timestamps
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return {
        hasConflict: true,
        reason: 'Invalid session start or end time. End time must be after start time.',
        code: 'INVALID_TIME_RANGE',
      };
    }

    // 2. Client authorization: Client must have an active/current care relationship with therapist
    if (userId) {
      const { data: rel } = await supabase
        .from('therapy_care_relationships')
        .select('id, status, care_stage')
        .eq('therapist_account_id', therapistAccountId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (!rel) {
        return {
          hasConflict: true,
          reason: 'Client does not have an active care relationship with this therapist.',
          code: 'CLIENT_NOT_AUTHORIZED',
        };
      }

      if (rel.care_stage === 'completed' || rel.status === 'completed' || rel.status === 'terminated') {
        return {
          hasConflict: true,
          reason: 'Client care relationship is completed or terminated. New sessions cannot be scheduled.',
          code: 'RELATIONSHIP_TERMINATED',
        };
      }
    }

    // 3. Working Hours & Availability Blocks Validation
    const kolkataDay = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
    }).format(start).toLowerCase(); // 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'

    const kolkataDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(start); // 'YYYY-MM-DD'

    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const kolkataDayIdx = dayNames.indexOf(kolkataDay);

    const startFmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(start);
    const endFmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(end);

    const { data: availBlocks } = await supabase
      .from('therapist_availability_blocks')
      .select('*')
      .eq('therapist_account_id', therapistAccountId);

    const blockedBlocks = (availBlocks || []).filter((b: any) => b.is_blocked);
    const nonBlockedBlocks = (availBlocks || []).filter((b: any) => !b.is_blocked);

    // 3a. Check blocked availability windows (busy blackout blocks)
    for (const block of blockedBlocks) {
      if (block.specific_date === kolkataDateStr || (block.is_recurring && block.day_of_week === kolkataDayIdx)) {
        const bStart = block.start_time.substring(0, 5);
        const bEnd = block.end_time.substring(0, 5);
        if (startFmt < bEnd && endFmt > bStart) {
          return {
            hasConflict: true,
            reason: 'Time falls within a blocked availability window.',
            code: 'BLOCKED_WINDOW',
          };
        }
      }
    }

    // 3b. Working hours enforcement
    if (nonBlockedBlocks.length > 0) {
      let withinOpenBlock = false;
      const dayBlocks = nonBlockedBlocks.filter(
        (b: any) => b.specific_date === kolkataDateStr || (b.is_recurring && b.day_of_week === kolkataDayIdx)
      );
      if (dayBlocks.length > 0) {
        for (const block of dayBlocks) {
          const bStart = block.start_time.substring(0, 5);
          const bEnd = block.end_time.substring(0, 5);
          if (startFmt >= bStart && endFmt <= bEnd) {
            withinOpenBlock = true;
            break;
          }
        }
        if (!withinOpenBlock) {
          return {
            hasConflict: true,
            reason: 'Requested session time is outside configured working hours.',
            code: 'OUTSIDE_WORKING_HOURS',
          };
        }
      }
    } else {
      // Fallback: check therapist_profiles availability_hours
      const { data: profile } = await supabase
        .from('therapist_profiles')
        .select('availability_hours')
        .eq('therapist_account_id', therapistAccountId)
        .maybeSingle();

      const hours = profile?.availability_hours;
      // Default clinical practice window across all 7 days is 07:00-23:00 if not explicitly defined
      const ranges = (hours && typeof hours === 'object' && Array.isArray(hours[kolkataDay]) && hours[kolkataDay].length > 0)
        ? hours[kolkataDay]
        : ['07:00-23:00'];

      let withinProfileHours = false;
      for (const range of ranges) {
        const [rStart, rEnd] = range.split('-');
        if (rStart && rEnd) {
          if (startFmt >= rStart.trim() && endFmt <= rEnd.trim()) {
            withinProfileHours = true;
            break;
          }
        }
      }
      if (!withinProfileHours) {
        return {
          hasConflict: true,
          reason: 'Requested session time is outside configured working hours.',
          code: 'OUTSIDE_WORKING_HOURS',
        };
      }
    }

    // 4. Overlapping sessions for this therapist
    let thQuery = supabase
      .from('therapist_clinical_appointments')
      .select('id, scheduled_start, scheduled_end, status')
      .eq('therapist_account_id', therapistAccountId)
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .lt('scheduled_start', scheduledEndIso)
      .gt('scheduled_end', scheduledStartIso);

    if (excludeAppointmentId) {
      thQuery = thQuery.neq('id', excludeAppointmentId);
    }

    const { data: overlappingAppts } = await thQuery;
    if (overlappingAppts && overlappingAppts.length > 0) {
      return {
        hasConflict: true,
        reason: 'Time conflicts with an existing booked session.',
        code: 'SESSION_CONFLICT',
      };
    }

    // 5. Overlapping sessions for this client
    if (userId) {
      let clQuery = supabase
        .from('therapist_clinical_appointments')
        .select('id, scheduled_start, scheduled_end, status')
        .eq('user_id', userId)
        .in('status', ['scheduled', 'confirmed', 'in_progress'])
        .lt('scheduled_start', scheduledEndIso)
        .gt('scheduled_end', scheduledStartIso);

      if (excludeAppointmentId) {
        clQuery = clQuery.neq('id', excludeAppointmentId);
      }

      const { data: clientOverlaps } = await clQuery;
      if (clientOverlaps && clientOverlaps.length > 0) {
        return {
          hasConflict: true,
          reason: 'Client has an overlapping scheduled session.',
          code: 'CLIENT_CONFLICT',
        };
      }
    }

    return { hasConflict: false };
  }

  /**
   * Backward-compatible alias for checkAppointmentConflict.
   */
  static async checkAppointmentConflict(
    therapistAccountId: string,
    scheduledStartIso: string,
    scheduledEndIso: string,
    excludeAppointmentId?: string
  ): Promise<{ hasConflict: boolean; reason?: string; code?: string }> {
    return this.validateSessionConflict(
      therapistAccountId,
      '',
      scheduledStartIso,
      scheduledEndIso,
      excludeAppointmentId
    );
  }

  /**
   * Retrieves list of appointments.
   */
  static async getAppointments(
    therapistAccountId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      clientId?: string;
      status?: string;
    } = {}
  ) {
    let query = supabase
      .from('therapist_clinical_appointments')
      .select(`
        id,
        user_id,
        relationship_id,
        scheduled_start,
        scheduled_end,
        status,
        session_type,
        meeting_link,
        google_calendar_event_id,
        google_meet_url,
        calendar_sync_status,
        attendance_status,
        refund_status,
        client_notes,
        cancelled_by,
        cancellation_reason,
        created_at,
        updated_at,
        users (
          id,
          name
        )
      `)
      .eq('therapist_account_id', therapistAccountId);

    if (filters.startDate) query = query.gte('scheduled_start', filters.startDate);
    if (filters.endDate) query = query.lte('scheduled_end', filters.endDate);
    if (filters.clientId) query = query.eq('user_id', filters.clientId);
    if (filters.status) query = query.eq('status', filters.status);

    query = query.order('scheduled_start', { ascending: true });

    let { data, error } = await query;
    if (error && error.code === '42703') {
      // Graceful fallback if migration 008 columns are not yet deployed in remote DB
      let fallbackQuery = supabase
        .from('therapist_clinical_appointments')
        .select(`
          id,
          user_id,
          relationship_id,
          scheduled_start,
          scheduled_end,
          status,
          session_type,
          meeting_link,
          client_notes,
          cancelled_by,
          cancellation_reason,
          created_at,
          updated_at,
          users (
            id,
            name
          )
        `)
        .eq('therapist_account_id', therapistAccountId);

      if (filters.startDate) fallbackQuery = fallbackQuery.gte('scheduled_start', filters.startDate);
      if (filters.endDate) fallbackQuery = fallbackQuery.lte('scheduled_end', filters.endDate);
      if (filters.clientId) fallbackQuery = fallbackQuery.eq('user_id', filters.clientId);
      if (filters.status) fallbackQuery = fallbackQuery.eq('status', filters.status);
      fallbackQuery = fallbackQuery.order('scheduled_start', { ascending: true });

      const fallbackRes = await fallbackQuery;
      data = fallbackRes.data as any;
      error = fallbackRes.error;
    }

    if (error) {
      console.error('[TherapistPlatformService] getAppointments error:', error);
      return [];
    }

    return (data || []).map((appt: any) => {
      const userObj = Array.isArray(appt.users) ? appt.users[0] : appt.users;
      const clientName = userObj?.name || `Client #${appt.user_id.substring(0, 6)}`;
      const durationMinutes = Math.round(
        (new Date(appt.scheduled_end).getTime() - new Date(appt.scheduled_start).getTime()) / 60000
      );

      const modalityMapped =
        appt.modality ||
        (appt.session_type === 'in_person' ? 'in_person' : appt.session_type === 'audio' ? 'phone' : 'telehealth');

      const finalMeetingLink = appt.google_meet_url || appt.meeting_link;

      return {
        id: appt.id,
        startsAt: appt.scheduled_start,
        endsAt: appt.scheduled_end,
        durationMinutes: durationMinutes > 0 ? durationMinutes : 50,
        status: appt.status,
        sessionType: appt.session_type,
        modality: modalityMapped,
        client: {
          id: appt.user_id,
          displayName: clientName,
        },
        careStage: appt.care_stage || 'active_care',
        meetingLink: finalMeetingLink,
        googleMeetUrl: finalMeetingLink,
        googleCalendarEventId: appt.google_calendar_event_id,
        calendarSyncStatus: appt.calendar_sync_status || 'not_connected',
        attendanceStatus: appt.attendance_status || 'scheduled',
        refundStatus: appt.refund_status || 'none',
        clientNotes: appt.client_notes,
        cancelledBy: appt.cancelled_by,
        cancellationReason: appt.cancellation_reason,
        createdAt: appt.created_at,
        updatedAt: appt.updated_at,
        // Backwards compatibility properties:
        user_id: appt.user_id,
        scheduled_start: appt.scheduled_start,
        scheduled_end: appt.scheduled_end,
        session_type: appt.session_type,
        clientDisplayName: clientName,
        relationship_id: appt.relationship_id,
      };
    });
  }

  /**
   * Retrieves single appointment detail with safe client identity and reschedule history.
   */
  static async getAppointmentById(therapistAccountId: string, appointmentId: string) {
    const { data: appt, error } = await supabase
      .from('therapist_clinical_appointments')
      .select(`
        id,
        therapist_account_id,
        user_id,
        relationship_id,
        scheduled_start,
        scheduled_end,
        status,
        session_type,
        meeting_link,
        client_notes,
        cancelled_by,
        cancellation_reason,
        created_at,
        updated_at,
        users (
          id,
          name
        )
      `)
      .eq('id', appointmentId)
      .maybeSingle();

    if (error || !appt || appt.therapist_account_id !== therapistAccountId) {
      const err: any = new Error('Session not found or unauthorized.');
      err.status = 404;
      err.code = 'SESSION_NOT_FOUND';
      throw err;
    }

    // Care relationship lookup
    let relationship: any = null;
    if (appt.user_id) {
      const { data: rel } = await supabase
        .from('therapy_care_relationships')
        .select('*')
        .eq('therapist_account_id', therapistAccountId)
        .eq('user_id', appt.user_id)
        .maybeSingle();
      relationship = rel;
    }

    // Reschedule audit history
    const { data: reschedules } = await supabase
      .from('therapist_session_reschedules')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false });

    const userObj = Array.isArray(appt.users) ? appt.users[0] : appt.users;
    const clientName = userObj?.name || `Client #${appt.user_id.substring(0, 6)}`;
    const durationMinutes = Math.round(
      (new Date(appt.scheduled_end).getTime() - new Date(appt.scheduled_start).getTime()) / 60000
    );

    const modalityMapped =
      (appt as any).modality ||
      (appt.session_type === 'in_person' ? 'in_person' : appt.session_type === 'audio' ? 'phone' : 'telehealth');

    return {
      id: appt.id,
      startsAt: appt.scheduled_start,
      endsAt: appt.scheduled_end,
      durationMinutes: durationMinutes > 0 ? durationMinutes : 50,
      status: appt.status,
      sessionType: appt.session_type,
      modality: modalityMapped,
      meetingLink: appt.meeting_link,
      clientNotes: appt.client_notes,
      cancelledBy: appt.cancelled_by,
      cancellationReason: appt.cancellation_reason,
      client: {
        id: appt.user_id,
        displayName: clientName,
      },
      careRelationship: relationship ? {
        id: relationship.id,
        status: relationship.status,
        careStage: relationship.care_stage,
        startedAt: relationship.started_at,
        endedAt: relationship.ended_at,
      } : null,
      careStage: relationship?.care_stage || (appt as any).care_stage || 'active_care',
      rescheduleHistory: (reschedules || []).map((r: any) => ({
        id: r.id,
        previousStart: r.previous_start,
        previousEnd: r.previous_end,
        newStart: r.new_start,
        newEnd: r.new_end,
        rescheduledBy: r.rescheduled_by,
        reason: r.reason,
        createdAt: r.created_at,
      })),
      createdAt: appt.created_at,
      updatedAt: appt.updated_at,
      // Backwards compatibility properties:
      user_id: appt.user_id,
      scheduled_start: appt.scheduled_start,
      scheduled_end: appt.scheduled_end,
      session_type: appt.session_type,
      clientDisplayName: clientName,
    };
  }

  /**
   * Creates a new clinical appointment with concurrency & conflict checking.
   */
  static async createAppointment(
    therapistAccountId: string,
    data: {
      userId?: string;
      clientId?: string;
      scheduledStart?: string;
      startsAt?: string;
      scheduledEnd?: string;
      endsAt?: string;
      sessionType?: 'video' | 'audio' | 'in_person';
      modality?: 'telehealth' | 'in_person' | 'chat' | 'phone';
      meetingLink?: string;
      clientNotes?: string;
    }
  ) {
    const targetUserId = data.clientId || data.userId;
    const targetStart = data.startsAt || data.scheduledStart;
    const targetEnd = data.endsAt || data.scheduledEnd;
    const targetModality = data.modality || 'telehealth';
    const targetSessionType =
      data.sessionType ||
      (targetModality === 'in_person' ? 'in_person' : targetModality === 'phone' ? 'audio' : 'video');

    if (!targetUserId || !targetStart || !targetEnd) {
      const err: any = new Error('clientId, startsAt, and endsAt are required.');
      err.status = 400;
      err.code = 'INVALID_INPUT';
      throw err;
    }

    // 1. Conflict and tenancy validation
    const conflict = await this.validateSessionConflict(
      therapistAccountId,
      targetUserId,
      targetStart,
      targetEnd
    );

    if (conflict.hasConflict) {
      const err: any = new Error(conflict.reason || 'Schedule conflict detected.');
      err.status = conflict.code === 'CLIENT_NOT_AUTHORIZED'
        ? 403
        : (conflict.code === 'INVALID_TIME_RANGE' ? 400 : 409);
      err.code = conflict.code || 'SESSION_CONFLICT';
      throw err;
    }

    // 2. Fetch care relationship details
    const { data: rel } = await supabase
      .from('therapy_care_relationships')
      .select('id, care_stage')
      .eq('therapist_account_id', therapistAccountId)
      .eq('user_id', targetUserId)
      .eq('status', 'active')
      .maybeSingle();

    if (!rel) {
      const err: any = new Error('Client does not have an active care relationship with this therapist.');
      err.status = 403;
      err.code = 'CLIENT_NOT_AUTHORIZED';
      throw err;
    }

    if (rel.care_stage === 'completed') {
      const err: any = new Error('Client care relationship is completed. New sessions cannot be scheduled.');
      err.status = 409;
      err.code = 'RELATIONSHIP_TERMINATED';
      throw err;
    }

    const meetingLink = data.meetingLink || null;

    // 3. Try atomic RPC with transaction advisory locks
    try {
      const { data: rpcAppt, error: rpcErr } = await supabase.rpc('schedule_therapist_appointment', {
        p_therapist_account_id: therapistAccountId,
        p_user_id: targetUserId,
        p_scheduled_start: targetStart,
        p_scheduled_end: targetEnd,
        p_session_type: targetSessionType,
        p_modality: targetModality,
        p_meeting_link: meetingLink,
        p_client_notes: data.clientNotes || null,
      });

      if (!rpcErr && rpcAppt) {
        return {
          ...rpcAppt,
          clientDisplayName: `Client #${targetUserId.substring(0, 6)}`,
          careStage: rel.care_stage || 'intake',
          modality: targetModality,
        };
      }
    } catch (rpcCatch) {}

    // 4. Standard insert fallback
    const { data: newAppt, error } = await supabase
      .from('therapist_clinical_appointments')
      .insert({
        therapist_account_id: therapistAccountId,
        user_id: targetUserId,
        relationship_id: rel.id,
        scheduled_start: targetStart,
        scheduled_end: targetEnd,
        status: 'scheduled',
        session_type: targetSessionType,
        meeting_link: meetingLink,
        client_notes: data.clientNotes || null,
      })
      .select('*')
      .single();

    if (error) {
      console.error('[TherapistPlatformService] createAppointment error:', error);
      throw new Error('Failed to schedule session.');
    }

    return {
      ...newAppt,
      clientDisplayName: `Client #${targetUserId.substring(0, 6)}`,
      careStage: rel.care_stage || 'intake',
      modality: targetModality,
    };
  }

  /**
   * Reschedules an appointment. Preserves history in therapist_session_reschedules!
   */
  static async rescheduleAppointment(
    therapistAccountId: string,
    appointmentId: string,
    newStartIso: string,
    newEndIso: string,
    reason?: string
  ) {
    // 1. Verify ownership and get previous start/end
    const { data: appt, error: fetchErr } = await supabase
      .from('therapist_clinical_appointments')
      .select('*')
      .eq('id', appointmentId)
      .maybeSingle();

    if (fetchErr || !appt || appt.therapist_account_id !== therapistAccountId) {
      const err: any = new Error('Appointment not found or unauthorized.');
      err.status = 404;
      err.code = 'SESSION_NOT_FOUND';
      throw err;
    }

    if (appt.status === 'completed' || appt.status === 'cancelled') {
      const err: any = new Error('Cannot reschedule a completed or cancelled session.');
      err.status = 400;
      err.code = 'SESSION_IMMUTABLE';
      throw err;
    }

    // 2. Conflict check on new slot
    const conflict = await this.validateSessionConflict(
      therapistAccountId,
      appt.user_id,
      newStartIso,
      newEndIso,
      appointmentId
    );

    if (conflict.hasConflict) {
      const err: any = new Error(conflict.reason || 'Schedule conflict detected.');
      err.status = conflict.code === 'INVALID_TIME_RANGE' ? 400 : 409;
      err.code = conflict.code || 'SESSION_CONFLICT';
      throw err;
    }

    // 3. Try atomic RPC
    try {
      const { data: rpcUpdated, error: rpcErr } = await supabase.rpc('reschedule_therapist_appointment', {
        p_therapist_account_id: therapistAccountId,
        p_appointment_id: appointmentId,
        p_new_start: newStartIso,
        p_new_end: newEndIso,
        p_reason: reason || 'Therapist requested reschedule',
      });
      if (!rpcErr && rpcUpdated) {
        return rpcUpdated;
      }
    } catch (rpcCatch) {}

    // 4. Fallback: Insert audit record in therapist_session_reschedules
    await supabase.from('therapist_session_reschedules').insert({
      appointment_id: appointmentId,
      previous_start: appt.scheduled_start,
      previous_end: appt.scheduled_end,
      new_start: newStartIso,
      new_end: newEndIso,
      rescheduled_by: 'therapist',
      reason: reason || 'Therapist requested reschedule',
    });

    // 5. Update appointment
    const { data: updated, error: updateErr } = await supabase
      .from('therapist_clinical_appointments')
      .update({
        scheduled_start: newStartIso,
        scheduled_end: newEndIso,
        status: 'rescheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)
      .select('*')
      .single();

    if (updateErr) {
      throw new Error('Failed to update appointment.');
    }

    // 6. Update Google Calendar event if exists
    if (appt.google_calendar_event_id) {
      await GoogleCalendarService.updateEventTimes(
        therapistAccountId,
        appt.google_calendar_event_id,
        newStartIso,
        newEndIso
      );
    }

    // 7. Update linked booking if exists
    if (appt.booking_id) {
      await supabase
        .from('therapy_session_bookings')
        .update({
          slot_start: newStartIso,
          slot_end: newEndIso,
          booking_status: 'rescheduled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', appt.booking_id);
    }

    // 8. Dispatch notification emails
    try {
      const { data: clientUser } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', appt.user_id)
        .maybeSingle();

      const { data: therapistAccount } = await supabase
        .from('therapist_accounts')
        .select('email, full_name')
        .eq('id', therapistAccountId)
        .maybeSingle();

      await EmailService.notifySessionRescheduled({
        appointmentId,
        previousStart: appt.scheduled_start,
        newStart: newStartIso,
        clientEmail: clientUser?.email || 'client@ingresswithin.com',
        therapistEmail: therapistAccount?.email || 'therapist@ingresswithin.com',
        clientName: clientUser?.full_name || 'Client',
        therapistName: therapistAccount?.full_name || 'Therapist',
        googleMeetUrl: appt.google_meet_url || appt.meeting_link,
      });
    } catch (mailErr) {
      console.warn('[TherapistPlatformService] Email notification error:', mailErr);
    }

    return updated;
  }

  /**
   * Non-destructive appointment cancellation.
   */
  static async cancelAppointment(
    therapistAccountId: string,
    appointmentId: string,
    reason?: string
  ) {
    const { data: appt, error: fetchErr } = await supabase
      .from('therapist_clinical_appointments')
      .select('*')
      .eq('id', appointmentId)
      .maybeSingle();

    if (fetchErr || !appt || appt.therapist_account_id !== therapistAccountId) {
      const err: any = new Error('Appointment not found or unauthorized.');
      err.status = 404;
      err.code = 'SESSION_NOT_FOUND';
      throw err;
    }

    if (appt.status === 'completed') {
      const err: any = new Error('Cannot cancel a completed session.');
      err.status = 400;
      err.code = 'SESSION_IMMUTABLE';
      throw err;
    }

    if (appt.status === 'cancelled') {
      return appt;
    }

    const { data: updated, error } = await supabase
      .from('therapist_clinical_appointments')
      .update({
        status: 'cancelled',
        cancelled_by: 'therapist',
        cancellation_reason: reason || 'Cancelled by therapist',
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)
      .select('*')
      .single();

    if (error) {
      throw new Error('Failed to cancel appointment.');
    }

    return updated;
  }

  /**
   * Starts a scheduled session, transitioning it to 'in_progress'.
   * Enforces strict ownership, active care relationship, and state eligibility.
   */
  static async startAppointment(
    therapistAccountId: string,
    appointmentId: string
  ) {
    // 1. Verify appointment ownership
    const { data: appt, error: apptErr } = await supabase
      .from('therapist_clinical_appointments')
      .select('id, user_id, status, therapist_account_id')
      .eq('id', appointmentId)
      .eq('therapist_account_id', therapistAccountId)
      .maybeSingle();

    if (apptErr || !appt) {
      const err: any = new Error('Session not found or unauthorized.');
      err.status = 404;
      err.code = 'SESSION_NOT_FOUND';
      throw err;
    }

    if (appt.status === 'cancelled') {
      const err: any = new Error('Cannot start a cancelled session.');
      err.status = 400;
      err.code = 'SESSION_CANCELLED';
      throw err;
    }

    if (appt.status === 'completed') {
      const err: any = new Error('Cannot start a completed session.');
      err.status = 400;
      err.code = 'SESSION_COMPLETED';
      throw err;
    }

    // Idempotent: if already in_progress, return existing
    if (appt.status === 'in_progress') {
      return appt;
    }

    // 2. Verify active care relationship
    const { data: rel } = await supabase
      .from('therapy_care_relationships')
      .select('id, status')
      .eq('therapist_account_id', therapistAccountId)
      .eq('user_id', appt.user_id)
      .eq('status', 'active')
      .maybeSingle();

    if (!rel) {
      const err: any = new Error('Client does not have an active care relationship with this therapist.');
      err.status = 403;
      err.code = 'CLIENT_NOT_AUTHORIZED';
      throw err;
    }

    // 3. Atomically transition to in_progress
    const now = new Date().toISOString();
    const { data: updated, error: updateErr } = await supabase
      .from('therapist_clinical_appointments')
      .update({
        status: 'in_progress',
        updated_at: now,
      })
      .eq('id', appointmentId)
      .eq('therapist_account_id', therapistAccountId)
      .select('*')
      .single();

    if (updateErr || !updated) {
      console.error('[TherapistPlatformService] startAppointment error:', updateErr);
      throw new Error('Failed to start session.');
    }

    return updated;
  }

  /**
   * Marks session complete and transactionally registers collected earnings.
   */
  static async completeAppointment(
    therapistAccountId: string,
    appointmentId: string
  ) {
    // 1. Verify appointment ownership and current state
    const { data: appt, error: apptErr } = await supabase
      .from('therapist_clinical_appointments')
      .select('id, user_id, status, therapist_account_id')
      .eq('id', appointmentId)
      .eq('therapist_account_id', therapistAccountId)
      .maybeSingle();

    if (apptErr || !appt) {
      const err: any = new Error('Session not found or unauthorized.');
      err.status = 404;
      err.code = 'SESSION_NOT_FOUND';
      throw err;
    }

    if (appt.status === 'cancelled') {
      const err: any = new Error('Cannot complete a cancelled session.');
      err.status = 400;
      err.code = 'SESSION_CANCELLED';
      throw err;
    }

    // Idempotent: if already completed, return it
    if (appt.status === 'completed') {
      return appt;
    }

    // 2. Update appointment status
    const { data: updatedAppt, error: updateErr } = await supabase
      .from('therapist_clinical_appointments')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)
      .eq('therapist_account_id', therapistAccountId)
      .select('*')
      .single();

    if (updateErr || !updatedAppt) {
      console.error('[TherapistPlatformService] completeAppointment error:', updateErr);
      throw new Error('Failed to mark session complete.');
    }

    // 3. Fetch therapist fee structure
    const { data: account } = await supabase
      .from('therapist_accounts')
      .select('per_session_fee, commission_rate')
      .eq('id', therapistAccountId)
      .single();

    const gross = Number(account?.per_session_fee) || 1500;
    const commRate = Number(account?.commission_rate) || 15;
    const platformFee = Math.round((gross * (commRate / 100)) * 100) / 100;
    const net = Math.round((gross - platformFee) * 100) / 100;

    // 4. Register collected earning if not already registered (enforcing single earning per appointment)
    await TherapistPayoutService.recordEarningForAppointment({
      therapistAccountId,
      appointmentId,
      grossAmount: gross,
      commissionRate: commRate,
      initialStatus: 'collected',
    });

    // 5. Update first_session_completed in care relationship
    if (appt.user_id) {
      await supabase
        .from('therapy_care_relationships')
        .update({ first_session_completed: true })
        .eq('therapist_account_id', therapistAccountId)
        .eq('user_id', appt.user_id);
    }

    return updatedAppt;
  }

  /**
   * =========================================================================
   * 6. SOAP NOTES (Isolated Clinical Documentation)
   * =========================================================================
   */

  /**
   * Formats raw database SOAP note record into standardized DTO.
   */
  static formatSoapDto(note: any) {
    if (!note) return null;
    const isDraft = Boolean(note.is_draft);
    return {
      id: note.id,
      appointmentId: note.appointment_id,
      sessionId: note.appointment_id,
      therapistAccountId: note.therapist_account_id,
      clientId: note.user_id,
      userId: note.user_id,
      subjective: note.subjective || '',
      objective: note.objective || '',
      assessment: note.assessment || '',
      plan: note.plan || '',
      isDraft,
      status: isDraft ? 'draft' : 'finalized',
      finalizedAt: note.finalized_at || null,
      finalizedBy: isDraft ? null : note.therapist_account_id,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    };
  }

  /**
   * Retrieves SOAP note for an appointment with strict ownership verification.
   */
  static async getSoapNote(therapistAccountId: string, appointmentId: string) {
    // 1. Verify appointment ownership
    const { data: appt, error: apptErr } = await supabase
      .from('therapist_clinical_appointments')
      .select('id, user_id, therapist_account_id')
      .eq('id', appointmentId)
      .eq('therapist_account_id', therapistAccountId)
      .maybeSingle();

    if (apptErr || !appt) {
      const err: any = new Error('Session not found or unauthorized.');
      err.status = 404;
      err.code = 'SESSION_NOT_FOUND';
      throw err;
    }

    const { data: note, error } = await supabase
      .from('therapist_soap_notes')
      .select('*')
      .eq('appointment_id', appointmentId)
      .eq('therapist_account_id', therapistAccountId)
      .maybeSingle();

    if (error) {
      console.error('[TherapistPlatformService] getSoapNote error:', error);
      throw new Error('Failed to retrieve SOAP note.');
    }

    if (!note) {
      return null;
    }

    return this.formatSoapDto(note);
  }

  /**
   * Saves or updates a draft SOAP note.
   * Prevents overwriting finalized notes (immutable clinical records).
   */
  static async saveSoapNote(
    therapistAccountId: string,
    appointmentId: string,
    data: {
      subjective?: string;
      objective?: string;
      assessment?: string;
      plan?: string;
      isDraft?: boolean;
    }
  ) {
    // 1. Verify appointment ownership and get user_id
    const { data: appt, error: apptErr } = await supabase
      .from('therapist_clinical_appointments')
      .select('id, user_id, status, attendance_status, therapist_account_id')
      .eq('id', appointmentId)
      .eq('therapist_account_id', therapistAccountId)
      .maybeSingle();

    if (apptErr || !appt) {
      const err: any = new Error('Session not found or unauthorized.');
      err.status = 404;
      err.code = 'SESSION_NOT_FOUND';
      throw err;
    }

    if (appt.status === 'cancelled') {
      const err: any = new Error('Cannot add or edit clinical SOAP notes for a cancelled session.');
      err.status = 400;
      err.code = 'SESSION_CANCELLED';
      throw err;
    }

    if (appt.attendance_status === 'client_no_show' || appt.attendance_status === 'therapist_no_show') {
      const err: any = new Error('Cannot create or edit clinical SOAP notes for a session marked as no-show.');
      err.status = 400;
      err.code = 'SESSION_NO_SHOW';
      throw err;
    }

    // 2. Verify active care relationship
    const { data: rel } = await supabase
      .from('therapy_care_relationships')
      .select('id, status')
      .eq('therapist_account_id', therapistAccountId)
      .eq('user_id', appt.user_id)
      .eq('status', 'active')
      .maybeSingle();

    if (!rel) {
      const err: any = new Error('Client does not have an active care relationship with this therapist.');
      err.status = 403;
      err.code = 'CLIENT_NOT_AUTHORIZED';
      throw err;
    }

    // 3. Check existing note immutability
    const { data: existingNote } = await supabase
      .from('therapist_soap_notes')
      .select('*')
      .eq('appointment_id', appointmentId)
      .eq('therapist_account_id', therapistAccountId)
      .maybeSingle();

    if (existingNote && !existingNote.is_draft && existingNote.finalized_at) {
      const err: any = new Error('Finalized clinical records are immutable and cannot be overwritten.');
      err.status = 409;
      err.code = 'SOAP_NOTE_FINALIZED';
      throw err;
    }

    // 4. Validate payload sizes
    const MAX_SECTION_LENGTH = 10000;
    const subjective = typeof data.subjective === 'string' ? data.subjective : (existingNote?.subjective || '');
    const objective = typeof data.objective === 'string' ? data.objective : (existingNote?.objective || '');
    const assessment = typeof data.assessment === 'string' ? data.assessment : (existingNote?.assessment || '');
    const plan = typeof data.plan === 'string' ? data.plan : (existingNote?.plan || '');

    if (
      subjective.length > MAX_SECTION_LENGTH ||
      objective.length > MAX_SECTION_LENGTH ||
      assessment.length > MAX_SECTION_LENGTH ||
      plan.length > MAX_SECTION_LENGTH
    ) {
      const err: any = new Error(`SOAP note sections cannot exceed ${MAX_SECTION_LENGTH} characters.`);
      err.status = 400;
      err.code = 'PAYLOAD_TOO_LARGE';
      throw err;
    }

    const isDraft = data.isDraft ?? true;

    // If attempting to finalize via saveSoapNote, validate required content
    if (!isDraft) {
      if (!subjective.trim() || !objective.trim() || !assessment.trim() || !plan.trim()) {
        const err: any = new Error('All SOAP sections (Subjective, Objective, Assessment, Plan) must contain meaningful clinical content before finalization.');
        err.status = 400;
        err.code = 'VALIDATION_FAILED';
        throw err;
      }
    }

    const now = new Date().toISOString();

    // 5. Upsert SOAP note
    const { data: note, error } = await supabase
      .from('therapist_soap_notes')
      .upsert(
        {
          appointment_id: appointmentId,
          therapist_account_id: therapistAccountId,
          user_id: appt.user_id,
          subjective,
          objective,
          assessment,
          plan,
          is_draft: isDraft,
          finalized_at: isDraft ? null : now,
          updated_at: now,
        },
        { onConflict: 'appointment_id' }
      )
      .select('*')
      .single();

    if (error) {
      console.error('[TherapistPlatformService] saveSoapNote error:', error);
      throw new Error('Failed to save clinical note.');
    }

    return this.formatSoapDto(note);
  }

  /**
   * Finalizes a SOAP note, making it an immutable clinical record.
   * Validates that all 4 sections contain non-whitespace clinical content.
   */
  static async finalizeSoapNote(
    therapistAccountId: string,
    appointmentId: string,
    data?: {
      subjective?: string;
      objective?: string;
      assessment?: string;
      plan?: string;
    }
  ) {
    // 1. Verify appointment ownership
    const { data: appt, error: apptErr } = await supabase
      .from('therapist_clinical_appointments')
      .select('id, user_id, status, attendance_status, therapist_account_id')
      .eq('id', appointmentId)
      .eq('therapist_account_id', therapistAccountId)
      .maybeSingle();

    if (apptErr || !appt) {
      const err: any = new Error('Session not found or unauthorized.');
      err.status = 404;
      err.code = 'SESSION_NOT_FOUND';
      throw err;
    }

    if (appt.status === 'cancelled') {
      const err: any = new Error('Cannot finalize clinical notes for a cancelled session.');
      err.status = 400;
      err.code = 'SESSION_CANCELLED';
      throw err;
    }

    if (appt.attendance_status === 'client_no_show' || appt.attendance_status === 'therapist_no_show') {
      const err: any = new Error('Cannot finalize clinical notes for a session marked as no-show.');
      err.status = 400;
      err.code = 'SESSION_NO_SHOW';
      throw err;
    }

    // 2. Verify active care relationship
    const { data: rel } = await supabase
      .from('therapy_care_relationships')
      .select('id, status')
      .eq('therapist_account_id', therapistAccountId)
      .eq('user_id', appt.user_id)
      .eq('status', 'active')
      .maybeSingle();

    if (!rel) {
      const err: any = new Error('Client does not have an active care relationship with this therapist.');
      err.status = 403;
      err.code = 'CLIENT_NOT_AUTHORIZED';
      throw err;
    }

    // 3. Fetch existing note if any
    const { data: existing } = await supabase
      .from('therapist_soap_notes')
      .select('*')
      .eq('appointment_id', appointmentId)
      .eq('therapist_account_id', therapistAccountId)
      .maybeSingle();

    // Idempotency: If already finalized, return existing note
    if (existing && !existing.is_draft && existing.finalized_at) {
      return this.formatSoapDto(existing);
    }

    const sub = (data?.subjective !== undefined ? data.subjective : (existing?.subjective || ''));
    const obj = (data?.objective !== undefined ? data.objective : (existing?.objective || ''));
    const ass = (data?.assessment !== undefined ? data.assessment : (existing?.assessment || ''));
    const pln = (data?.plan !== undefined ? data.plan : (existing?.plan || ''));

    // Check required fields - must not be empty or whitespace only
    if (!sub.trim() || !obj.trim() || !ass.trim() || !pln.trim()) {
      const err: any = new Error('All SOAP sections (Subjective, Objective, Assessment, Plan) must contain meaningful clinical content before finalization.');
      err.status = 400;
      err.code = 'VALIDATION_FAILED';
      throw err;
    }

    const MAX_SECTION_LENGTH = 10000;
    if (
      sub.length > MAX_SECTION_LENGTH ||
      obj.length > MAX_SECTION_LENGTH ||
      ass.length > MAX_SECTION_LENGTH ||
      pln.length > MAX_SECTION_LENGTH
    ) {
      const err: any = new Error(`SOAP note sections cannot exceed ${MAX_SECTION_LENGTH} characters.`);
      err.status = 400;
      err.code = 'PAYLOAD_TOO_LARGE';
      throw err;
    }

    const now = new Date().toISOString();

    const { data: note, error } = await supabase
      .from('therapist_soap_notes')
      .upsert(
        {
          appointment_id: appointmentId,
          therapist_account_id: therapistAccountId,
          user_id: appt.user_id,
          subjective: sub,
          objective: obj,
          assessment: ass,
          plan: pln,
          is_draft: false,
          finalized_at: now,
          updated_at: now,
        },
        { onConflict: 'appointment_id' }
      )
      .select('*')
      .single();

    if (error) {
      console.error('[TherapistPlatformService] finalizeSoapNote error:', error);
      throw new Error('Failed to finalize clinical note.');
    }

    return this.formatSoapDto(note);
  }

  /**
   * =========================================================================
   * 7. CALENDAR & AVAILABILITY
   * =========================================================================
   */

  /**
   * Fetches calendar events (appointments + availability blocks) for a view window.
   */
  static async getCalendarEvents(
    therapistAccountId: string,
    startDateIso: string,
    endDateIso: string
  ) {
    // 1. Appointments
    const appointments = await this.getAppointments(therapistAccountId, {
      startDate: startDateIso,
      endDate: endDateIso,
    });

    // 2. Availability blocks
    const { data: blocks } = await supabase
      .from('therapist_availability_blocks')
      .select('*')
      .eq('therapist_account_id', therapistAccountId);

    // 3. Google Calendar busy slots
    const externalBusy = await GoogleCalendarService.getBusySlots(
      therapistAccountId,
      startDateIso,
      endDateIso
    );

    // 4. Google Calendar connection status
    const googleCalendarStatus = await GoogleAuthService.getConnectionStatus(
      'therapist',
      therapistAccountId
    );

    return {
      sessions: appointments,
      appointments,
      availabilityBlocks: blocks || [],
      externalBusy,
      googleCalendarStatus,
    };
  }

  /**
   * Saves availability working hours blocks.
   */
  static async saveAvailabilityBlocks(
    therapistAccountId: string,
    blocks: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isRecurring?: boolean;
      specificDate?: string;
      isBlocked?: boolean;
    }>
  ) {
    // Delete existing recurring blocks
    await supabase
      .from('therapist_availability_blocks')
      .delete()
      .eq('therapist_account_id', therapistAccountId)
      .eq('is_recurring', true);

    if (blocks.length === 0) return [];

    const payload = blocks.map((b) => ({
      therapist_account_id: therapistAccountId,
      day_of_week: b.dayOfWeek,
      start_time: b.startTime,
      end_time: b.endTime,
      is_recurring: b.isRecurring ?? true,
      specific_date: b.specificDate || null,
      is_blocked: b.isBlocked ?? false,
    }));

    const { data, error } = await supabase
      .from('therapist_availability_blocks')
      .insert(payload)
      .select('*');

    if (error) {
      console.error('[TherapistPlatformService] saveAvailabilityBlocks error:', error);
      throw new Error('Failed to save availability.');
    }

    return data;
  }

  /**
   * =========================================================================
   * 8. EARNINGS & PAYOUTS (Real Payment Ledger)
   * =========================================================================
   */

  /**
   * Fetches real earnings summary strictly calculated from financial ledger and payout batches.
   */
  static async getEarningsSummary(therapistAccountId: string) {
    const { data: earnings, error } = await supabase
      .from('therapist_earnings')
      .select(`
        id,
        appointment_id,
        gross_amount,
        platform_fee,
        net_earnings,
        payment_status,
        collected_at,
        payout_batch_id,
        payout_date,
        created_at,
        therapist_clinical_appointments (
          id,
          scheduled_start,
          user_id,
          users (
            name
          )
        )
      `)
      .eq('therapist_account_id', therapistAccountId)
      .order('collected_at', { ascending: false });

    if (error && error.code !== 'PGRST205' && error.code !== '42P01') {
      console.error('[TherapistPlatformService] getEarningsSummary error:', error);
      throw new Error('Failed to calculate earnings.');
    }

    const batches = await TherapistPayoutService.getPayoutBatchesForTherapist(therapistAccountId);
    const batchMap = new Map(batches.map((b) => [b.id, b]));

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    let currentPeriodCollected = 0;
    let totalCollected = 0;
    let pendingPayout = 0;
    let paidOut = 0;

    const transactions = (earnings || []).map((e: any) => {
      const net = Number(e.net_earnings) || 0;
      const gross = Number(e.gross_amount) || 0;
      const fee = Number(e.platform_fee) || 0;
      const status = e.payment_status;

      const isCollected = status === 'collected';
      const isPaid = status === 'paid';

      if (isCollected || isPaid) {
        totalCollected += net;
        if (e.collected_at && e.collected_at >= startOfCurrentMonth && isCollected) {
          currentPeriodCollected += net;
        }
      }

      if (isCollected) {
        // Pending payout if not yet paid (either unbatched or in pending/processing batch)
        const batch = e.payout_batch_id ? batchMap.get(e.payout_batch_id) : null;
        if (!batch || batch.status === 'pending' || batch.status === 'processing') {
          pendingPayout += net;
        }
      }

      if (isPaid) {
        paidOut += net;
      }

      const appt = Array.isArray(e.therapist_clinical_appointments)
        ? e.therapist_clinical_appointments[0]
        : e.therapist_clinical_appointments;

      return {
        id: e.id,
        appointmentId: e.appointment_id,
        date: e.collected_at || e.created_at,
        gross,
        grossAmount: gross,
        platformFee: fee,
        net,
        netAmount: net,
        status,
        financialStatus: status,
        payoutBatch: e.payout_batch_id,
        payoutBatchId: e.payout_batch_id,
        payoutDate: e.payout_date,
        clientLabel: appt?.users?.name || `Client #${appt?.user_id?.substring(0, 6) || '---'}`,
        sessionDate: appt?.scheduled_start || e.collected_at,
      };
    });

    const payouts = batches.map((b) => ({
      id: b.id,
      batchId: b.id,
      period: `${new Date(b.period_start).toLocaleDateString('en-IN')} - ${new Date(b.period_end).toLocaleDateString('en-IN')}`,
      periodStart: b.period_start,
      periodEnd: b.period_end,
      amount: b.total_net,
      status: b.status,
      paidDate: b.paid_at,
      bankReference: b.bank_reference,
      failureReason: b.failure_reason,
      reversalReason: b.reversal_reason,
      createdAt: b.created_at,
    }));

    return {
      summary: {
        currentPeriodCollected: Math.round(currentPeriodCollected * 100) / 100,
        totalCollected: Math.round(totalCollected * 100) / 100,
        pendingPayout: Math.round(pendingPayout * 100) / 100,
        paidOut: Math.round(paidOut * 100) / 100,
        paidOutTotal: Math.round(paidOut * 100) / 100,
        currency: 'INR',
      },
      transactions,
      payouts,
    };
  }

  /**
   * =========================================================================
   * 9. PROFILE MANAGEMENT (Strict Allowlist Enforcement)
   * =========================================================================
   */

  /**
   * Updates therapist profile with STRICT field allowlisting.
   * Mass assignment shield: rejects can_practice, application_status, commission_rate, etc.
   */
  static async updateProfile(therapistAccountId: string, payload: Record<string, any>) {
    // 1. Strict Allowlist
    const ALLOWED_PROFILE_KEYS = new Set([
      'full_name',
      'title',
      'bio',
      'qualification',
      'experience_years',
      'specializations',
      'languages',
      'session_formats',
      'availability_hours',
      'profile_image_url',
      'city',
      'state',
    ]);

    const sanitizedUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    for (const [key, value] of Object.entries(payload)) {
      if (ALLOWED_PROFILE_KEYS.has(key)) {
        sanitizedUpdates[key] = value;
      }
    }

    const { data: updated, error } = await supabase
      .from('therapist_profiles')
      .update(sanitizedUpdates)
      .eq('therapist_account_id', therapistAccountId)
      .select('*')
      .single();

    if (error) {
      console.error('[TherapistPlatformService] updateProfile error:', error);
      throw new Error('Failed to update profile.');
    }

    return updated;
  }

  /**
   * =========================================================================
   * 10. NOTIFICATIONS
   * =========================================================================
   */

  /**
   * Lists notifications.
   */
  static async getNotifications(therapistAccountId: string) {
    const { data, error } = await supabase
      .from('therapist_notifications')
      .select('*')
      .eq('therapist_account_id', therapistAccountId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[TherapistPlatformService] getNotifications error:', error);
      throw new Error('Failed to retrieve notifications.');
    }

    return data || [];
  }

  /**
   * Marks a notification as read.
   */
  static async markNotificationRead(therapistAccountId: string, notificationId: string) {
    await supabase
      .from('therapist_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('therapist_account_id', therapistAccountId);

    return { success: true };
  }
}
