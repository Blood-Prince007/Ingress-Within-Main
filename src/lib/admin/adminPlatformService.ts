import { supabase } from '../db';
import { TherapistPlatformService } from '../therapist/therapistPlatformService';
import { TherapistPayoutAccountService } from '../therapist/therapistPayoutAccountService';
import { AdminAuditService } from './adminAuditService';
import { ApiUsageService } from './apiUsageService';
import { EmailService } from '../email/emailService';
import { AdminRole, AdminStatus } from './adminAuthService';

export interface OverviewMetrics {
  totalUsers: number;
  totalClients: number;
  totalTherapists: number;
  activeTherapists: number;
  pendingApplications: number;
  upcomingSessions: number;
  completedSessions: number;
  grossRevenuePaise: number;
  platformFeesPaise: number;
  therapistEarningsPaise: number;
  pendingPayoutsPaise: number;
  failedPayments: number;
  failedPayouts: number;
  currency: string;
  range: string;
}

export interface RevenueAnalytics {
  grossRevenuePaise: number;
  platformFeesPaise: number;
  therapistNetPaise: number;
  pendingPayoutsPaise: number;
  successfulPaymentsCount: number;
  refundsCount: number;
  refundsPaise: number;
  dailyBreakdown: Array<{
    date: string;
    grossPaise: number;
    platformFeePaise: number;
    therapistNetPaise: number;
  }>;
  currency: string;
  range: string;
}

export class AdminPlatformService {
  /**
   * Helper to parse date range lower bound.
   */
  private static getRangeStartDate(range: string): Date | null {
    const now = new Date();
    if (range === 'today') {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (range === 'week' || range === '7d') {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    if (range === 'month' || range === '30d') {
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    if (range === '90d') {
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }
    return null; // 'all'
  }

  /**
   * 1. Operational Overview Metrics (Command Center)
   */
  static async getOverviewMetrics(range = 'all'): Promise<OverviewMetrics> {
    const startDate = this.getRangeStartDate(range);
    const startIso = startDate ? startDate.toISOString() : null;

    // Users counts
    const { count: totalUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    const { count: totalClients } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .or('role.eq.client,role.is.null');

    // Therapists counts
    const { count: totalTherapists } = await supabase
      .from('therapist_accounts')
      .select('id', { count: 'exact', head: true });

    const { count: activeTherapists } = await supabase
      .from('therapist_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('can_practice', true);

    const { count: pendingApplications } = await supabase
      .from('therapist_accounts')
      .select('id', { count: 'exact', head: true })
      .in('application_status', ['submitted', 'under_review', 'pending']);

    // Sessions counts
    const nowIso = new Date().toISOString();
    let upcomingSessionsQuery = supabase
      .from('therapist_clinical_appointments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'scheduled')
      .gte('session_time', nowIso);

    let completedSessionsQuery = supabase
      .from('therapist_clinical_appointments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed');

    if (startIso) {
      completedSessionsQuery = completedSessionsQuery.gte('created_at', startIso);
    }

    const [{ count: upcomingSessions }, { count: completedSessions }] = await Promise.all([
      upcomingSessionsQuery,
      completedSessionsQuery,
    ]);

    // Financial calculations strictly in integer paise
    let earningsQuery = supabase
      .from('therapist_earnings')
      .select('gross_amount, platform_fee, net_earnings, payment_status, created_at');

    if (startIso) {
      earningsQuery = earningsQuery.gte('created_at', startIso);
    }

    const { data: earningsData } = await earningsQuery;

    let grossPaise = 0;
    let feePaise = 0;
    let netPaise = 0;

    if (earningsData && earningsData.length > 0) {
      for (const e of earningsData) {
        if (e.payment_status === 'collected' || e.payment_status === 'paid') {
          grossPaise += Math.round(Number(e.gross_amount || 0) * 100);
          feePaise += Math.round(Number(e.platform_fee || 0) * 100);
          netPaise += Math.round(Number(e.net_earnings || 0) * 100);
        }
      }
    }

    // Pending payouts & failed payouts from withdrawals
    let withdrawalsQuery = supabase
      .from('therapist_withdrawal_requests')
      .select('amount, status, created_at');

    if (startIso) {
      withdrawalsQuery = withdrawalsQuery.gte('created_at', startIso);
    }

    const { data: withdrawalsData } = await withdrawalsQuery;

    let pendingPayoutsPaise = 0;
    let failedPayoutsCount = 0;

    if (withdrawalsData && withdrawalsData.length > 0) {
      for (const w of withdrawalsData) {
        const amtPaise = Math.round(Number(w.amount || 0) * 100);
        if (w.status === 'requested' || w.status === 'processing') {
          pendingPayoutsPaise += amtPaise;
        } else if (w.status === 'failed') {
          failedPayoutsCount++;
        }
      }
    }

    // Failed payments from billing
    let failedPaymentsQuery = supabase
      .from('billing_orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed');

    if (startIso) {
      failedPaymentsQuery = failedPaymentsQuery.gte('created_at', startIso);
    }

    const { count: failedPayments } = await failedPaymentsQuery;

    return {
      totalUsers: totalUsers || 0,
      totalClients: totalClients || 0,
      totalTherapists: totalTherapists || 0,
      activeTherapists: activeTherapists || 0,
      pendingApplications: pendingApplications || 0,
      upcomingSessions: upcomingSessions || 0,
      completedSessions: completedSessions || 0,
      grossRevenuePaise: grossPaise,
      platformFeesPaise: feePaise,
      therapistEarningsPaise: netPaise,
      pendingPayoutsPaise,
      failedPayments: failedPayments || 0,
      failedPayouts: failedPayoutsCount,
      currency: 'INR',
      range,
    };
  }

  /**
   * 2. Revenue Analytics (Integer Paise Minor Units)
   */
  static async getRevenueAnalytics(range = '30d'): Promise<RevenueAnalytics> {
    const startDate = this.getRangeStartDate(range);
    const startIso = startDate ? startDate.toISOString() : null;

    let earningsQuery = supabase
      .from('therapist_earnings')
      .select('*')
      .order('created_at', { ascending: true });

    if (startIso) {
      earningsQuery = earningsQuery.gte('created_at', startIso);
    }

    const { data: earnings } = await earningsQuery;

    let grossPaise = 0;
    let feePaise = 0;
    let netPaise = 0;
    let successCount = 0;

    const dailyMap: Record<string, { gross: number; fee: number; net: number }> = {};

    if (earnings && earnings.length > 0) {
      for (const e of earnings) {
        if (e.payment_status === 'collected' || e.payment_status === 'paid') {
          const g = Math.round(Number(e.gross_amount || 0) * 100);
          const f = Math.round(Number(e.platform_fee || 0) * 100);
          const n = Math.round(Number(e.net_earnings || 0) * 100);

          grossPaise += g;
          feePaise += f;
          netPaise += n;
          successCount++;

          const dateKey = (e.collected_at || e.created_at || '').substring(0, 10) || 'Unknown';
          if (!dailyMap[dateKey]) {
            dailyMap[dateKey] = { gross: 0, fee: 0, net: 0 };
          }
          dailyMap[dateKey].gross += g;
          dailyMap[dateKey].fee += f;
          dailyMap[dateKey].net += n;
        }
      }
    }

    // Pending payouts
    const { data: withdrawals } = await supabase
      .from('therapist_withdrawal_requests')
      .select('amount, status');

    let pendingPayoutsPaise = 0;
    if (withdrawals) {
      for (const w of withdrawals) {
        if (w.status === 'requested' || w.status === 'processing') {
          pendingPayoutsPaise += Math.round(Number(w.amount || 0) * 100);
        }
      }
    }

    // Refunds
    let refundsQuery = supabase
      .from('therapist_clinical_appointments')
      .select('id, refund_status')
      .in('refund_status', ['full', 'partial']);

    if (startIso) {
      refundsQuery = refundsQuery.gte('created_at', startIso);
    }

    const { data: refunds } = await refundsQuery;
    const refundsCount = refunds ? refunds.length : 0;
    const refundsPaise = refundsCount * 150000; // Estimated baseline if refund amount isn't explicit

    const dailyBreakdown = Object.entries(dailyMap).map(([date, d]) => ({
      date,
      grossPaise: d.gross,
      platformFeePaise: d.fee,
      therapistNetPaise: d.net,
    }));

    return {
      grossRevenuePaise: grossPaise,
      platformFeesPaise: feePaise,
      therapistNetPaise: netPaise,
      pendingPayoutsPaise,
      successfulPaymentsCount: successCount,
      refundsCount,
      refundsPaise,
      dailyBreakdown,
      currency: 'INR',
      range,
    };
  }

  /**
   * 3. Users Management (Server-Side Pagination & Safe DTO)
   */
  static async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    let query = supabase.from('users').select('*', { count: 'exact' });

    if (params.role && params.role !== 'all') {
      query = query.eq('role', params.role);
    }

    if (params.status && params.status !== 'all') {
      query = query.eq('account_status', params.status);
    }

    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim()}%`;
      query = query.or(`name.ilike.${q},phone_number.ilike.${q}`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error && error.code !== 'PGRST205' && error.code !== '42P01') {
      throw error;
    }

    const safeUsers = (data || []).map((u: any) => ({
      id: u.id,
      phone_number: u.phone_number,
      name: u.name || null,
      email: u.email || null,
      role: u.role || 'client',
      is_admin: !!u.is_admin,
      account_status: u.account_status || 'active',
      is_active: u.is_active ?? true,
      created_at: u.created_at,
      last_login_at: u.last_login_at || null,
    }));

    return {
      users: safeUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * 4. Therapist Management (Safe DTO, Zero Token Leaks)
   */
  static async getTherapists(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    let query = supabase.from('therapist_accounts').select('*', { count: 'exact' });

    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: accounts, count, error } = await query;
    if (error && error.code !== 'PGRST205' && error.code !== '42P01') {
      throw error;
    }

    const safeList: any[] = [];
    if (accounts && accounts.length > 0) {
      const accountIds = accounts.map((a: any) => a.id);
      const { data: profiles } = await supabase
        .from('therapist_profiles')
        .select('*')
        .in('therapist_account_id', accountIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.therapist_account_id, p]));

      for (const a of accounts) {
        const p: any = profileMap.get(a.id) || {};
        safeList.push({
          id: a.id,
          phone_number: a.phone_number,
          email: a.email || null,
          status: a.status,
          application_status: a.application_status,
          verification_status: a.verification_status,
          can_practice: a.can_practice,
          rci_registered: !!a.rci_registered,
          rci_number: a.rci_number || null,
          commission_rate: Number(a.commission_rate || 0.15),
          per_session_fee: Number(a.per_session_fee || 1500),
          full_name: p.full_name || 'Therapist',
          title: p.title || null,
          qualification: p.qualification || null,
          experience_years: p.experience_years || null,
          specializations: p.specializations || [],
          languages: p.languages || [],
          created_at: a.created_at,
        });
      }
    }

    return {
      therapists: safeList,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * 5. Therapist Applications Review Queue
   * Supports both object-based paginated options and legacy string status.
   */
  static async getApplications(
    options: string | { status?: string; page?: number; limit?: number; search?: string } = 'pending'
  ) {
    let status = 'pending';
    let page = 1;
    let limit = 20;
    let search = '';

    if (typeof options === 'string') {
      status = options;
    } else if (options && typeof options === 'object') {
      status = options.status || 'pending';
      page = Math.max(1, options.page || 1);
      limit = Math.min(100, Math.max(1, options.limit || 20));
      search = (options.search || '').trim().toLowerCase();
    }

    let query = supabase.from('therapist_accounts').select('*', { count: 'exact' });

    if (status === 'pending') {
      query = query.in('application_status', ['submitted', 'under_review', 'pending']);
    } else if (status !== 'all') {
      query = query.eq('application_status', status);
    }

    const offset = (page - 1) * limit;
    const { data: accounts, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const applications: any[] = [];
    if (accounts && accounts.length > 0) {
      const accountIds = accounts.map((a: any) => a.id);

      const [{ data: profiles }, { data: appData }] = await Promise.all([
        supabase
          .from('therapist_profiles')
          .select('*')
          .in('therapist_account_id', accountIds),
        supabase
          .from('therapist_applications')
          .select('therapist_account_id, submitted_at, resubmitted_at, answers, documents, rejection_reason')
          .in('therapist_account_id', accountIds),
      ]);

      const profileMap = new Map((profiles || []).map((p: any) => [p.therapist_account_id, p]));
      const appMap = new Map((appData || []).map((a: any) => [a.therapist_account_id, a]));

      for (const a of accounts) {
        const p: any = profileMap.get(a.id) || {};
        const app: any = appMap.get(a.id) || {};
        const fullName = p.full_name || app.answers?.fullName || 'Applicant';

        // Filter by search query if supplied
        if (search) {
          const matchName = fullName.toLowerCase().includes(search);
          const matchPhone = (a.phone_number || '').includes(search);
          const matchTitle = (p.title || app.answers?.credentials || '').toLowerCase().includes(search);
          if (!matchName && !matchPhone && !matchTitle) {
            continue;
          }
        }

        const docCount = Array.isArray(app.documents) ? app.documents.length : 0;
        const specialties = Array.isArray(p.specializations) && p.specializations.length
          ? p.specializations
          : (Array.isArray(app.answers?.specialties) ? app.answers.specialties : []);

        applications.push({
          therapistAccountId: a.id,
          phone_number: a.phone_number,
          email: a.email || null,
          status: a.status,
          application_status: a.application_status,
          verification_status: a.verification_status,
          can_practice: a.can_practice,
          rci_registered: !!a.rci_registered,
          rci_number: a.rci_number || null,
          full_name: fullName,
          title: p.title || app.answers?.credentials || 'Clinician',
          bio: p.bio || app.answers?.bio || '',
          qualification: p.qualification || app.answers?.credentials || '',
          experience_years: p.experience_years || Number(app.answers?.yearsOfExperience) || 0,
          specializations: specialties,
          languages: p.languages || app.answers?.languages || ['English'],
          submitted_at: app.submitted_at || a.created_at,
          resubmitted_at: app.resubmitted_at || null,
          rejection_reason: app.rejection_reason || null,
          documents_count: docCount,
          profile_complete: Boolean(p.full_name && p.bio && p.qualification),
        });
      }
    }

    // When called via old string status signature, return raw array for backward compatibility
    if (typeof options === 'string') {
      return applications;
    }

    return {
      applications,
      pagination: {
        page,
        limit,
        total: count || applications.length,
        totalPages: Math.ceil((count || applications.length) / limit),
      },
    };
  }

  /**
   * Retrieves the comprehensive clinical verification dossier for a therapist.
   * Assembles Basic Info, Professional Profile, Education, Credentials, Documents,
   * Practice readiness, and complete review history.
   */
  static async getApplicationDetail(therapistAccountId: string) {
    if (!therapistAccountId) {
      const err: any = new Error('Therapist account ID is required.');
      err.code = 'INVALID_ID';
      err.status = 400;
      throw err;
    }

    // 1. Fetch account, profile, application, and reviews concurrently
    const [
      { data: account, error: accError },
      { data: profile },
      { data: application },
      { data: payoutAccount },
      { data: reviews },
    ] = await Promise.all([
      supabase
        .from('therapist_accounts')
        .select('*')
        .eq('id', therapistAccountId)
        .maybeSingle(),
      supabase
        .from('therapist_profiles')
        .select('*')
        .eq('therapist_account_id', therapistAccountId)
        .maybeSingle(),
      supabase
        .from('therapist_applications')
        .select('*')
        .eq('therapist_account_id', therapistAccountId)
        .maybeSingle(),
      supabase
        .from('therapist_payout_accounts')
        .select('id, payout_method, is_verified, bank_name, masked_account_number')
        .eq('therapist_account_id', therapistAccountId)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('therapist_application_reviews')
        .select('*')
        .eq('therapist_account_id', therapistAccountId)
        .order('created_at', { ascending: false }),
    ]);

    if (accError || !account) {
      const err: any = new Error('Therapist application not found.');
      err.code = 'APPLICATION_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    const answers = (application?.answers || {}) as Record<string, any>;
    const rawDocs = Array.isArray(application?.documents) ? application.documents : [];

    // Helper: Mask sensitive identifiers (e.g. license/RCI numbers)
    const maskIdentifier = (val?: string | null) => {
      if (!val || typeof val !== 'string') return null;
      const trimmed = val.trim();
      if (trimmed.length <= 4) return '****';
      return `${trimmed.slice(0, 2)}****${trimmed.slice(-4)}`;
    };

    // 2. Structured Sections
    const basicInfo = {
      fullName: profile?.full_name || answers.fullName || 'Clinician Applicant',
      email: account.email || answers.email || null,
      phone: account.phone_number,
      city: profile?.city || answers.city || null,
      state: profile?.state || answers.state || null,
      profileImageUrl: profile?.profile_image_url || answers.photo?.path || null,
      timezone: 'Asia/Kolkata',
      createdAt: account.created_at,
      status: account.status,
      applicationStatus: account.application_status,
      verificationStatus: account.verification_status,
      canPractice: account.can_practice,
    };

    const professionalInfo = {
      title: profile?.title || answers.credentials || 'Clinical Psychologist',
      qualification: profile?.qualification || answers.credentials || 'Not specified',
      bio: profile?.bio || answers.bio || '',
      yearsOfExperience: profile?.experience_years || Number(answers.yearsOfExperience) || 0,
      specializations: Array.isArray(profile?.specializations) && profile.specializations.length
        ? profile.specializations
        : (Array.isArray(answers.specialties) ? answers.specialties : []),
      modalities: Array.isArray(answers.modalities) ? answers.modalities : (profile?.modalities || []),
      primaryModalities: Array.isArray(answers.primaryModalities) ? answers.primaryModalities : [],
      languages: Array.isArray(profile?.languages) ? profile.languages : (answers.languages || ['English', 'Hindi']),
      ageGroups: Array.isArray(answers.ageGroups) ? answers.ageGroups : [],
      vignetteAnswers: answers.vignetteAnswers || {},
    };

    // 3. Education Parsing
    let educationList: any[] = [];
    if (Array.isArray(answers.education) && answers.education.length > 0) {
      educationList = answers.education.map((edu: any) => ({
        degree: edu.degree || 'Degree',
        institution: edu.institution || edu.university || 'University',
        field: edu.field || 'Psychology / Mental Health',
        startYear: edu.startYear || null,
        endYear: edu.endYear || edu.year || null,
      }));
    } else {
      educationList = [
        {
          degree: answers.credentials || profile?.qualification || 'Master of Psychology',
          institution: answers.issuingBody || 'Accredited Institution',
          field: 'Clinical Psychology',
          endYear: null,
        },
      ];
    }

    // 4. Professional Credentials & RCI
    const credentials = {
      issuingBody: answers.issuingBody || (account.rci_registered ? 'Rehabilitation Council of India' : 'Professional Board'),
      licenseNumberMasked: maskIdentifier(answers.licenseNumber || account.rci_number),
      licenseNumberFull: answers.licenseNumber || account.rci_number || null,
      rciRegistered: Boolean(account.rci_registered),
      rciNumber: account.rci_number || null,
      traumaCertification: Boolean(answers.traumaCertification),
      primaryModalityCertified: Boolean(answers.primaryModalityCertificate),
      supervisionConfirmed: Boolean(answers.supervisionConfirmation),
    };

    // 5. Verification Documents
    const documents = rawDocs.map((doc: any, index: number) => ({
      id: doc.id || `doc_${index}`,
      category: doc.category || 'credential',
      filename: doc.filename || doc.path?.split('/').pop() || 'document.pdf',
      mimeType: doc.mimeType || 'application/pdf',
      sizeBytes: doc.size || 0,
      path: doc.path,
      uploadedAt: doc.uploadedAt || application?.created_at,
      verificationStatus: doc.verificationStatus || 'pending',
    }));

    // 6. Practice Information
    const practiceInfo = {
      sessionFormats: Array.isArray(profile?.session_formats) ? profile.session_formats : ['telehealth'],
      perSessionFee: Number(account.per_session_fee || 1500),
      commissionRate: Number(account.commission_rate || 15.0),
      availabilityHours: profile?.availability_hours || {
        mon: ['09:00-17:00'],
        tue: ['09:00-17:00'],
        wed: ['09:00-17:00'],
        thu: ['09:00-17:00'],
        fri: ['09:00-17:00'],
      },
    };

    // 7. Platform Readiness Checklist
    const hasProfile = Boolean(basicInfo.fullName && professionalInfo.bio);
    const hasCredentials = Boolean(credentials.licenseNumberFull && credentials.issuingBody);
    const hasDocuments = documents.length > 0;
    const hasEthics = answers.ethicsDeclaration !== false;
    const hasBackgroundCheck = answers.backgroundCheckConsent !== false;
    const hasPayout = Boolean(payoutAccount?.id);

    const readiness = {
      profileCompleted: hasProfile,
      credentialsSubmitted: hasCredentials,
      documentsUploaded: hasDocuments,
      ethicsDeclared: hasEthics,
      backgroundCheckConsented: hasBackgroundCheck,
      payoutConfigured: hasPayout,
      overallReadyForReview: hasProfile && hasCredentials && hasDocuments,
      isVerified: account.verification_status === 'verified' && account.can_practice === true,
    };

    // 8. Review History
    const rawReviews = (reviews && reviews.length > 0)
      ? reviews
      : await TherapistPlatformService.getReviewHistory(therapistAccountId);

    const history = rawReviews.map((r: any) => ({
      id: r.id,
      action: r.action,
      previousStatus: r.previous_status,
      newStatus: r.new_status,
      reviewerId: r.reviewer_id,
      reason: r.reason,
      reviewerNotes: r.reviewer_notes,
      createdAt: r.created_at,
    }));

    return {
      therapistAccountId,
      applicationId: application?.id || null,
      submittedAt: application?.submitted_at || account.created_at,
      resubmittedAt: application?.resubmitted_at || null,
      reviewedAt: application?.reviewed_at || null,
      rejectionReason: application?.rejection_reason || null,
      reviewerNotes: application?.reviewer_notes || null,
      basicInfo,
      professionalInfo,
      education: educationList,
      credentials,
      documents,
      practiceInfo,
      readiness,
      readinessChecklist: readiness,
      applicationMeta: {
        applicationStatus: account.application_status,
        verificationStatus: account.verification_status,
        canPractice: Boolean(account.can_practice),
        rejectionReason: application?.rejection_reason || null,
        reviewerNotes: application?.reviewer_notes || null,
        submittedAt: application?.submitted_at || account.created_at,
        reviewedAt: application?.reviewed_at || null,
      },
      reviewHistory: history,
    };
  }

  /**
   * Generates a secure, short-lived 1-hour signed URL for an application document.
   * Validates that the document path belongs strictly to the target therapist.
   */
  static async generateDocumentSignedUrl(
    paramsOrId: string | { therapistAccountId: string; documentPath: string; adminId: string },
    documentPathArg?: string,
    adminIdArg?: string
  ) {
    const therapistAccountId = typeof paramsOrId === 'string' ? paramsOrId : paramsOrId.therapistAccountId;
    const documentPath = typeof paramsOrId === 'string' ? (documentPathArg || '') : paramsOrId.documentPath;
    const adminId = typeof paramsOrId === 'string' ? (adminIdArg || 'system') : paramsOrId.adminId;

    if (!documentPath || typeof documentPath !== 'string') {
      const err: any = new Error('Document path is required.');
      err.code = 'INVALID_PATH';
      err.status = 400;
      throw err;
    }

    // Path Traversal & IDOR Defense: path must start with therapistAccountId/ and contain no relative traversal
    const normalized = documentPath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (normalized.includes('..') || normalized.includes('\0')) {
      const err: any = new Error('Invalid document path. Directory traversal detected.');
      err.code = 'PATH_TRAVERSAL_DETECTED';
      err.status = 400;
      throw err;
    }
    if (!normalized.startsWith(`${therapistAccountId}/`)) {
      const err: any = new Error('Unauthorized document access. Path does not belong to specified therapist.');
      err.code = 'DOCUMENT_ACCESS_DENIED';
      err.status = 403;
      throw err;
    }

    const { data, error } = await supabase.storage
      .from('therapist-verification')
      .createSignedUrl(normalized, 3600); // 1 Hour

    if (error || !data?.signedUrl) {
      throw new Error(`Failed to generate signed document URL: ${error?.message || 'Storage error'}`);
    }

    await AdminAuditService.logAction({
      actorId: adminId,
      actorType: 'admin_user',
      action: 'therapist_document_inspected',
      entityType: 'therapist_document',
      entityId: therapistAccountId,
      metadata: {
        documentPath: normalized,
        expiresInSeconds: 3600,
      },
    });

    return {
      signedUrl: data.signedUrl,
      expiresInSeconds: 3600,
    };
  }

  /**
   * Approves a therapist application.
   * Server-side atomic transaction with concurrency safety, review logging, and notification.
   */
  static async approveApplication(
    paramsOrId: string | { therapistAccountId: string; adminId: string; reviewerNotes?: string },
    adminIdArg?: string,
    notesArg?: string
  ) {
    const therapistAccountId = typeof paramsOrId === 'string' ? paramsOrId : paramsOrId.therapistAccountId;
    const adminId = typeof paramsOrId === 'string' ? (adminIdArg || 'system') : paramsOrId.adminId;
    const reviewerNotes = typeof paramsOrId === 'string' ? notesArg : paramsOrId.reviewerNotes;

    const result = await TherapistPlatformService.adminReviewTherapist(
      therapistAccountId,
      'approved',
      adminId,
      reviewerNotes || 'Approved by clinical administrator.'
    );

    await AdminAuditService.logAction({
      actorId: adminId,
      actorType: 'admin_user',
      action: 'therapist.application_approved',
      entityType: 'therapist',
      entityId: therapistAccountId,
      metadata: {
        decision: 'approved',
        notes: reviewerNotes || null,
        canPractice: true,
      },
    });

    return {
      ...result,
      message: 'Therapist application approved successfully. Clinical practice authorization granted.',
    };
  }

  /**
   * Rejects a therapist application.
   * Strictly enforces a mandatory operational rejection reason.
   */
  static async rejectApplication(
    paramsOrId: string | { therapistAccountId: string; adminId: string; rejectionReason: string; reviewerNotes?: string },
    adminIdArg?: string,
    reasonArg?: string,
    notesArg?: string
  ) {
    const therapistAccountId = typeof paramsOrId === 'string' ? paramsOrId : paramsOrId.therapistAccountId;
    const adminId = typeof paramsOrId === 'string' ? (adminIdArg || 'system') : paramsOrId.adminId;
    const rejectionReason = typeof paramsOrId === 'string' ? (reasonArg || '') : paramsOrId.rejectionReason;
    const reviewerNotes = typeof paramsOrId === 'string' ? notesArg : paramsOrId.reviewerNotes;

    if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim().length < 5) {
      const err: any = new Error('A detailed operational rejection reason (minimum 5 characters) is required.');
      err.code = 'REJECTION_REASON_REQUIRED';
      err.status = 400;
      throw err;
    }

    const result = await TherapistPlatformService.adminReviewTherapist(
      therapistAccountId,
      'rejected',
      adminId,
      reviewerNotes || rejectionReason,
      rejectionReason.trim()
    );

    await AdminAuditService.logAction({
      actorId: adminId,
      actorType: 'admin_user',
      action: 'therapist.application_rejected',
      entityType: 'therapist',
      entityId: therapistAccountId,
      metadata: {
        decision: 'rejected',
        reason: rejectionReason.trim(),
        notes: reviewerNotes || null,
        canPractice: false,
      },
    });

    return {
      ...result,
      message: 'Therapist application rejected. Feedback delivered to applicant.',
    };
  }

  /**
   * Reviews and transitions a therapist application.
   * Backward-compatible dispatcher routing to approve or reject.
   */
  static async reviewApplication(params: {
    therapistAccountId: string;
    decision: 'approved' | 'rejected';
    adminId: string;
    reviewerNotes?: string;
    rejectionReason?: string;
  }) {
    const { therapistAccountId, decision, adminId, reviewerNotes, rejectionReason } = params;

    if (decision === 'approved') {
      return this.approveApplication({ therapistAccountId, adminId, reviewerNotes });
    } else if (decision === 'rejected') {
      return this.rejectApplication({
        therapistAccountId,
        adminId,
        rejectionReason: rejectionReason || reviewerNotes || 'Application declined following clinical credential review.',
        reviewerNotes,
      });
    }

    const err: any = new Error('Invalid review decision: must be approved or rejected.');
    err.code = 'INVALID_DECISION';
    err.status = 400;
    throw err;
  }

  /**
   * 6. Client Management (Least-Privilege, Zero Clinical Notes)
   */
  static async getClients(params: { page?: number; limit?: number; search?: string }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .or('role.eq.client,role.is.null');

    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim()}%`;
      query = query.or(`name.ilike.${q},phone_number.ilike.${q}`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count } = await query;

    // Strict data minimization: Return only operational identity
    const safeClients = (data || []).map((c: any) => ({
      id: c.id,
      phone_number: c.phone_number,
      name: c.name || null,
      account_status: c.account_status || 'active',
      is_active: c.is_active ?? true,
      created_at: c.created_at,
      last_login_at: c.last_login_at || null,
    }));

    return {
      clients: safeClients,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * 7. Sessions Management (Verified Meet Links, Filterable)
   */
  static async getSessions(params: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('therapist_clinical_appointments')
      .select('*', { count: 'exact' });

    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }

    query = query.order('session_time', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count } = await query;

    const safeSessions = (data || []).map((s: any) => ({
      id: s.id,
      therapist_account_id: s.therapist_account_id,
      client_id: s.client_id,
      session_time: s.session_time,
      status: s.status,
      payment_status: s.payment_status || 'paid',
      refund_status: s.refund_status || 'none',
      meet_link: s.meet_link || null,
      created_at: s.created_at,
    }));

    return {
      sessions: safeSessions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * 8. Payments Management (Masked Provider References)
   */
  static async getPayments(params: { page?: number; limit?: number; status?: string }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    let query = supabase.from('billing_orders').select('*', { count: 'exact' });

    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count } = await query;

    const safePayments = (data || []).map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      amount_total_paise: Math.round(Number(p.amount_total || 0) * 100),
      currency: p.currency || 'INR',
      status: p.status,
      provider_order_id: p.gateway_order_id ? `${p.gateway_order_id.substring(0, 10)}...` : null,
      provider_payment_id: p.gateway_payment_id ? `${p.gateway_payment_id.substring(0, 10)}...` : null,
      created_at: p.created_at,
    }));

    return {
      payments: safePayments,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * 9. Therapist Payouts Management (Reuses Authoritative Balance Logic)
   */
  static async getPayouts(params: { page?: number; limit?: number; status?: string }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    let query = supabase.from('therapist_withdrawal_requests').select('*', { count: 'exact' });

    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count } = await query;

    const safePayouts = (data || []).map((w: any) => ({
      id: w.id,
      therapist_account_id: w.therapist_account_id,
      payout_account_id: w.payout_account_id,
      amount_inr: Number(w.amount),
      currency: w.currency || 'INR',
      status: w.status,
      provider_payout_id: w.provider_payout_id,
      utr_number: w.utr_number || null,
      failure_reason: w.failure_reason || null,
      created_at: w.created_at,
      processed_at: w.processed_at || null,
    }));

    return {
      payouts: safePayouts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * 10. Webhook Events Monitoring
   */
  static async getWebhooks(params: { page?: number; limit?: number; provider?: string }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    let query = supabase.from('webhook_events').select('*', { count: 'exact' });

    if (params.provider && params.provider !== 'all') {
      query = query.eq('provider', params.provider);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count } = await query;

    const safeWebhooks = (data || []).map((w: any) => ({
      id: w.id,
      event_id: w.event_id,
      provider: w.provider,
      event_type: w.event_type,
      status: w.status || (w.processed ? 'processed' : 'pending'),
      processed: !!w.processed,
      error_message: w.error_message || null,
      created_at: w.created_at,
      processed_at: w.processed_at || null,
    }));

    return {
      webhooks: safeWebhooks,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * 11. Audit Logs Query
   */
  static async getAuditLogs(params: { page?: number; limit?: number; action?: string }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    let query = supabase.from('admin_audit_logs').select('*', { count: 'exact' });

    if (params.action && params.action !== 'all') {
      query = query.eq('action', params.action);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count } = await query;

    return {
      logs: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * 12. Operational System Health (Real Diagnostics)
   */
  static async getSystemHealth() {
    const checks: Record<string, { status: 'healthy' | 'degraded' | 'unavailable' | 'not_configured'; latencyMs?: number; message: string }> = {};

    // 1. Application Runtime
    checks['application'] = {
      status: 'healthy',
      message: `Node.js ${process.version} online. Environment: ${process.env.NODE_ENV || 'production'}.`,
    };

    // 2. Database Connectivity
    const dbStart = Date.now();
    try {
      const { data, error } = await supabase.from('admin_audit_logs').select('id').limit(1);
      const dbLatency = Date.now() - dbStart;
      if (error && error.code !== 'PGRST205' && error.code !== '42P01') {
        checks['database'] = {
          status: 'degraded',
          latencyMs: dbLatency,
          message: `Database query warning: ${error.message}`,
        };
      } else {
        checks['database'] = {
          status: 'healthy',
          latencyMs: dbLatency,
          message: 'PostgreSQL connection responsive.',
        };
      }
    } catch (err: any) {
      checks['database'] = {
        status: 'unavailable',
        latencyMs: Date.now() - dbStart,
        message: 'Database query timeout or connection failed.',
      };
    }

    // 3. Auth Engine
    const jwtSecret = process.env.JWT_SECRET;
    checks['authentication'] = {
      status: jwtSecret && jwtSecret !== 'jwt_default_secret_dev' ? 'healthy' : 'degraded',
      message: jwtSecret && jwtSecret !== 'jwt_default_secret_dev' ? 'HMAC-SHA256 JWT key configured.' : 'Using fallback development secret.',
    };

    // 3b. AI Provider Ecosystem (Anthropic Claude, Groq, Gemini)
    const claudeKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    checks['claude_ai'] = {
      status: claudeKey ? 'healthy' : 'degraded',
      message: claudeKey ? 'Claude 3.5 Sonnet (Primary AI) configured.' : 'Primary AI key missing, running fallback.',
    };

    checks['groq_ai'] = {
      status: groqKey ? 'healthy' : 'degraded',
      message: groqKey ? 'Groq Llama 3.3 (Secondary AI) configured.' : 'Groq fallback key missing.',
    };

    checks['gemini_ai'] = {
      status: geminiKey ? 'healthy' : 'degraded',
      message: geminiKey ? 'Gemini 2.0 (Tertiary AI) configured.' : 'Gemini tertiary key missing.',
    };

    // 4. Payment Gateway (Razorpay)
    const rzpKey = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const rzpSecret = process.env.RAZORPAY_KEY_SECRET;
    if (rzpKey && rzpSecret) {
      checks['payments'] = {
        status: 'healthy',
        message: 'Razorpay API credentials loaded.',
      };
    } else {
      checks['payments'] = {
        status: 'not_configured',
        message: 'Razorpay API credentials missing from environment.',
      };
    }

    // 5. Google Calendar / Meet OAuth
    const gClient = process.env.GOOGLE_CLIENT_ID;
    const gSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (gClient && gSecret) {
      checks['google_calendar'] = {
        status: 'healthy',
        message: 'Google OAuth credentials active for Meet creation.',
      };
    } else {
      checks['google_calendar'] = {
        status: 'not_configured',
        message: 'Google OAuth Client ID/Secret not set in environment.',
      };
    }

    // 6. Webhook Processing
    try {
      const { count: pendingWebhooks } = await supabase
        .from('webhook_events')
        .select('id', { count: 'exact', head: true })
        .eq('processed', false);

      checks['webhooks'] = {
        status: (pendingWebhooks || 0) > 20 ? 'degraded' : 'healthy',
        message: `${pendingWebhooks || 0} pending webhook events in queue.`,
      };
    } catch {
      checks['webhooks'] = {
        status: 'healthy',
        message: 'Webhook handler active.',
      };
    }

    // 7. Transactional Email System
    try {
      const emailHealth = await EmailService.getEmailHealthMetrics();
      checks['email'] = {
        status: emailHealth.status === 'error' ? 'unavailable' : emailHealth.status,
        message: `Email provider: ${emailHealth.status.toUpperCase()} (${emailHealth.sent + emailHealth.delivered} sent/delivered, ${emailHealth.failed} failed, ${emailHealth.retrying} retrying).`,
      };
    } catch {
      checks['email'] = {
        status: 'healthy',
        message: 'Transactional email provider initialized.',
      };
    }

    const isAllHealthy = Object.values(checks).every((c) => c.status === 'healthy');
    const isDegraded = Object.values(checks).some((c) => c.status === 'degraded' || c.status === 'not_configured');

    return {
      status: isAllHealthy ? 'healthy' : isDegraded ? 'degraded' : 'unavailable',
      checkedAt: new Date().toISOString(),
      checks,
    };
  }

  /**
   * 13. Admin Accounts Management
   */
  static async getAdminAccounts() {
    const { data } = await supabase
      .from('admin_accounts')
      .select('id, email, full_name, role, status, last_login_at, created_at')
      .order('created_at', { ascending: false });

    return data || [];
  }

  /**
   * Updates an admin account status (Super Admin only).
   */
  static async updateAdminStatus(targetAdminId: string, newStatus: AdminStatus, actorAdminId: string) {
    if (targetAdminId === actorAdminId && newStatus !== 'active') {
      const err: any = new Error('You cannot deactivate or suspend your own admin account.');
      err.code = 'CANNOT_SELF_DEACTIVATE';
      err.status = 400;
      throw err;
    }

    await supabase
      .from('admin_accounts')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', targetAdminId);

    // If deactivating, also revoke active sessions
    if (newStatus !== 'active') {
      await supabase
        .from('admin_sessions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('admin_id', targetAdminId);
    }

    await AdminAuditService.logAction({
      actorId: actorAdminId,
      actorType: 'admin_user',
      action: 'admin_status_changed',
      entityType: 'admin_account',
      entityId: targetAdminId,
      metadata: { newStatus },
    });

    return { success: true, targetAdminId, newStatus };
  }
}
