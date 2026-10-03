import { supabase } from '../db';
import { EntitlementService } from './entitlementService';
import { ComplimentaryAccessService } from './complimentaryAccessService';

export type CustomerState = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED_PENDING' | 'DORMANT';

export interface CustomerCapabilities {
  canWriteJournal: boolean;
  canStartSession: boolean;
  canPerformExercise: boolean;
  canGenerateReports: boolean;
  canReadHistory: boolean;
}

export interface AccessBanner {
  type: 'trial' | 'past_due' | 'cancelled_pending' | 'dormant';
  message: string;
  ctaText?: string;
  ctaHref?: string;
}

export interface CustomerAccess {
  userId: string;
  state: CustomerState;
  planName: string;
  capabilities: CustomerCapabilities;
  currentPeriodEnd: string | null;
  trialDaysRemaining: number;
  banner: AccessBanner | null;
  subscription: {
    id: string;
    gatewaySubscriptionId?: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
  } | null;

  // Section 27 Canonical Capability Model
  selfHelp: {
    canWrite: boolean;
    canStartSession: boolean;
    canStartDailySession: boolean;
    canUseExercises: boolean;
    canStartNewExercise: boolean;
    canSubmitExercise: boolean;
    canUseAI: boolean;
    canCreateReflection: boolean;
    canGenerateWeeklyReflection: boolean;
    canGenerateReports: boolean;
    canGeneratePatterns: boolean;
    canGenerateVocabulary: boolean;
  };
  history: {
    canViewEntries: boolean;
    canViewCycles: boolean;
    canViewSessions: boolean;
    canViewReflections: boolean;
    canViewReports: boolean;
    canViewPatterns: boolean;
    canViewVocabulary: boolean;
    canViewExerciseResults: boolean;
  };
  firstWeeklyReport: {
    canView: boolean;
    permanent: boolean;
    isPermanent: boolean;
  };
  psychoeducation: {
    canViewRecommendations: boolean;
    purchasedModules: string[];
  };
  workshops: {
    canBrowse: boolean;
    purchasedWorkshops: string[];
  };
  interventions: {
    canAccess: boolean;
  };
  therapy: {
    dashboardAccess: boolean;
    hasPaidSession: boolean;
    inactiveSince: string | null;
    requiresSupportReactivation: boolean;
  };
}

export class AccessDeniedError extends Error {
  public readonly code: string;
  public readonly state: CustomerState;
  public readonly statusCode: number;

  constructor(message: string, state: CustomerState, code: string = 'SELF_HELP_SUBSCRIPTION_REQUIRED') {
    super(message);
    this.name = 'AccessDeniedError';
    this.code = code;
    this.state = state;
    this.statusCode = 403;
  }
}

export class AccessControlService {
  public static readonly TRIAL_DAYS = 7;
  public static readonly PLAN_NAME = 'Ingress Within Self-Work';

  private static buildAccessPayload(params: {
    userId: string;
    state: CustomerState;
    capabilities: CustomerCapabilities;
    currentPeriodEnd: string | null;
    trialDaysRemaining: number;
    banner: AccessBanner | null;
    subscription: {
      id: string;
      gatewaySubscriptionId?: string;
      status: string;
      cancelAtPeriodEnd: boolean;
      currentPeriodEnd: string | null;
    } | null;
    purchasedModules?: string[];
    purchasedWorkshops?: string[];
    hasPaidTherapySession?: boolean;
  }): CustomerAccess {
    const canSelfHelp = params.capabilities.canWriteJournal;
    return {
      userId: params.userId,
      state: params.state,
      planName: this.PLAN_NAME,
      capabilities: params.capabilities,
      currentPeriodEnd: params.currentPeriodEnd,
      trialDaysRemaining: params.trialDaysRemaining,
      banner: params.banner,
      subscription: params.subscription,

      // Section 27 Canonical Capability Model
      selfHelp: {
        canWrite: canSelfHelp,
        canStartSession: canSelfHelp,
        canStartDailySession: canSelfHelp,
        canUseExercises: canSelfHelp,
        canStartNewExercise: canSelfHelp,
        canSubmitExercise: canSelfHelp,
        canUseAI: canSelfHelp,
        canCreateReflection: canSelfHelp,
        canGenerateWeeklyReflection: canSelfHelp,
        canGenerateReports: canSelfHelp,
        canGeneratePatterns: canSelfHelp,
        canGenerateVocabulary: canSelfHelp
      },
      history: {
        canViewEntries: true,
        canViewCycles: true,
        canViewSessions: true,
        canViewReflections: true,
        canViewReports: true,
        canViewPatterns: true,
        canViewVocabulary: true,
        canViewExerciseResults: true
      },
      firstWeeklyReport: {
        canView: true,
        permanent: true,
        isPermanent: true
      },
      psychoeducation: {
        canViewRecommendations: true,
        purchasedModules: params.purchasedModules || []
      },
      workshops: {
        canBrowse: true,
        purchasedWorkshops: params.purchasedWorkshops || []
      },
      interventions: {
        canAccess: true
      },
      therapy: {
        dashboardAccess: params.hasPaidTherapySession || false,
        hasPaidSession: params.hasPaidTherapySession || false,
        inactiveSince: null,
        requiresSupportReactivation: false
      }
    };
  }

  /**
   * Authoritative centralized evaluation of customer access state.
   */
  public static async getCustomerAccess(userId: string): Promise<CustomerAccess> {
    const defaultCapabilities: CustomerCapabilities = {
      canWriteJournal: false,
      canStartSession: false,
      canPerformExercise: false,
      canGenerateReports: false,
      canReadHistory: true // Dormant users always retain historical read access
    };

    if (!userId) {
      return this.buildAccessPayload({
        userId: '',
        state: 'DORMANT',
        capabilities: defaultCapabilities,
        currentPeriodEnd: null,
        trialDaysRemaining: 0,
        banner: {
          type: 'dormant',
          message: 'Sign in to access your self-work journal and records.',
          ctaText: 'Sign In',
          ctaHref: '/login'
        },
        subscription: null
      });
    }

    // 1. Synthetic Reviewer Bypass for App Store / Gateway Compliance verification
    if (userId === 'usr_synthetic_razorpay_reviewer' || userId === 'synthetic-reviewer-user') {
      return this.buildAccessPayload({
        userId,
        state: 'ACTIVE',
        capabilities: {
          canWriteJournal: true,
          canStartSession: true,
          canPerformExercise: true,
          canGenerateReports: true,
          canReadHistory: true
        },
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        trialDaysRemaining: 0,
        banner: null,
        subscription: {
          id: 'sub_synthetic_active',
          gatewaySubscriptionId: 'sub_synthetic_active',
          status: 'active',
          cancelAtPeriodEnd: false,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      });
    }

    const now = new Date();

    // 2. Query user record for trial calculation
    let userCreatedAt: Date = now;
    try {
      const { data: userRec } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', userId)
        .maybeSingle();

      if (userRec?.created_at) {
        userCreatedAt = new Date(userRec.created_at);
      }
    } catch (e) {}

    // 3. Query user purchased modules & workshops
    let purchasedModules: string[] = [];
    let purchasedWorkshops: string[] = [];
    try {
      const { data: userEnts } = await supabase
        .from('entitlements')
        .select('feature_key')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (userEnts) {
        for (const e of userEnts) {
          if (e.feature_key.startsWith('module_')) {
            purchasedModules.push(e.feature_key);
          } else if (e.feature_key.startsWith('workshop_')) {
            purchasedWorkshops.push(e.feature_key);
          }
        }
      }
    } catch (e) {}

    // 4. Query therapy paid session status
    let hasPaidTherapySession = false;
    try {
      const { data: therapyOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'paid')
        .ilike('product_id', '%therapy%')
        .limit(1)
        .maybeSingle();

      if (therapyOrder) hasPaidTherapySession = true;
    } catch (e) {}

    // 5. Authoritative Complimentary Entitlement Check (Section 5 Conceptual Order)
    // Order: Authenticated User -> Load Authoritative Entitlement -> Active Complimentary?
    // YES -> Allow paid features without payment (permanent: expires_at = NULL)
    // NO  -> Proceed to normal Razorpay subscription / payment logic
    const complimentary = await ComplimentaryAccessService.getActiveEntitlement(userId);
    if (complimentary && complimentary.status === 'active') {
      return this.buildAccessPayload({
        userId,
        state: 'ACTIVE',
        capabilities: {
          canWriteJournal: true,
          canStartSession: true,
          canPerformExercise: true,
          canGenerateReports: true,
          canReadHistory: true
        },
        currentPeriodEnd: null, // Permanent: expires_at = NULL
        trialDaysRemaining: 0,
        banner: null,
        subscription: {
          id: complimentary.subscriptionId || `sub_complimentary_${userId}`,
          gatewaySubscriptionId: complimentary.gatewaySubscriptionId || `sub_internal_complimentary_${userId}`,
          status: 'active',
          cancelAtPeriodEnd: false,
          currentPeriodEnd: null
        },
        purchasedModules,
        purchasedWorkshops,
        hasPaidTherapySession
      });
    }

    // 6. Query latest subscription
    let subscriptionRec: any = null;
    try {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      subscriptionRec = sub;
    } catch (e) {}

    // 4. Query active entitlement
    let hasActiveEntitlement = false;
    try {
      const { data: ent } = await supabase
        .from('entitlements')
        .select('*')
        .eq('user_id', userId)
        .eq('feature_key', 'self_help_subscription')
        .eq('is_active', true)
        .maybeSingle();

      if (ent) {
        if (!ent.valid_until || new Date(ent.valid_until) > now) {
          hasActiveEntitlement = true;
        }
      }
    } catch (e) {}

    // 5. Evaluate state based on Subscription, Entitlement, or Trial
    if (subscriptionRec) {
      const status = subscriptionRec.status;
      const periodEnd = subscriptionRec.current_period_end ? new Date(subscriptionRec.current_period_end) : null;
      const isPeriodValid = periodEnd ? periodEnd > now : false;

      // PAST_DUE (Grace period: retained write access with billing banner)
      if (status === 'past_due') {
        return this.buildAccessPayload({
          userId,
          state: 'PAST_DUE',
          capabilities: {
            canWriteJournal: true,
            canStartSession: true,
            canPerformExercise: true,
            canGenerateReports: true,
            canReadHistory: true
          },
          currentPeriodEnd: subscriptionRec.current_period_end,
          trialDaysRemaining: 0,
          banner: {
            type: 'past_due',
            message: 'Your latest payment could not be processed. Please update your payment method to keep your self-work uninterrupted.',
            ctaText: 'Update Payment Method',
            ctaHref: '/settings'
          },
          subscription: {
            id: subscriptionRec.id,
            gatewaySubscriptionId: subscriptionRec.gateway_subscription_id,
            status: subscriptionRec.status,
            cancelAtPeriodEnd: subscriptionRec.cancel_at_period_end || false,
            currentPeriodEnd: subscriptionRec.current_period_end
          },
          purchasedModules,
          purchasedWorkshops,
          hasPaidTherapySession
        });
      }

      // CANCELLED_PENDING (User cancelled, but period end has not yet elapsed)
      if (subscriptionRec.cancel_at_period_end && isPeriodValid) {
        const formattedDate = periodEnd?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) || 'end of period';
        return this.buildAccessPayload({
          userId,
          state: 'CANCELLED_PENDING',
          capabilities: {
            canWriteJournal: true,
            canStartSession: true,
            canPerformExercise: true,
            canGenerateReports: true,
            canReadHistory: true
          },
          currentPeriodEnd: subscriptionRec.current_period_end,
          trialDaysRemaining: 0,
          banner: {
            type: 'cancelled_pending',
            message: `Your subscription is set to end on ${formattedDate}. You retain full access until then.`,
            ctaText: 'Keep Subscription',
            ctaHref: '/settings'
          },
          subscription: {
            id: subscriptionRec.id,
            gatewaySubscriptionId: subscriptionRec.gateway_subscription_id,
            status: subscriptionRec.status,
            cancelAtPeriodEnd: true,
            currentPeriodEnd: subscriptionRec.current_period_end
          },
          purchasedModules,
          purchasedWorkshops,
          hasPaidTherapySession
        });
      }

      // ACTIVE Subscription
      if (status === 'active' && (!periodEnd || isPeriodValid)) {
        return this.buildAccessPayload({
          userId,
          state: 'ACTIVE',
          capabilities: {
            canWriteJournal: true,
            canStartSession: true,
            canPerformExercise: true,
            canGenerateReports: true,
            canReadHistory: true
          },
          currentPeriodEnd: subscriptionRec.current_period_end,
          trialDaysRemaining: 0,
          banner: null,
          subscription: {
            id: subscriptionRec.id,
            gatewaySubscriptionId: subscriptionRec.gateway_subscription_id,
            status: subscriptionRec.status,
            cancelAtPeriodEnd: false,
            currentPeriodEnd: subscriptionRec.current_period_end
          },
          purchasedModules,
          purchasedWorkshops,
          hasPaidTherapySession
        });
      }
    }

    // 6. If active entitlement without subscription record
    if (hasActiveEntitlement) {
      return this.buildAccessPayload({
        userId,
        state: 'ACTIVE',
        capabilities: {
          canWriteJournal: true,
          canStartSession: true,
          canPerformExercise: true,
          canGenerateReports: true,
          canReadHistory: true
        },
        currentPeriodEnd: null,
        trialDaysRemaining: 0,
        banner: null,
        subscription: null,
        purchasedModules,
        purchasedWorkshops,
        hasPaidTherapySession
      });
    }

    // 7. Check Trial window (7 days from user creation)
    const trialEnd = new Date(userCreatedAt.getTime() + this.TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const msRemaining = trialEnd.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

    if (now < trialEnd) {
      return this.buildAccessPayload({
        userId,
        state: 'TRIAL',
        capabilities: {
          canWriteJournal: true,
          canStartSession: true,
          canPerformExercise: true,
          canGenerateReports: true,
          canReadHistory: true
        },
        currentPeriodEnd: trialEnd.toISOString(),
        trialDaysRemaining: daysRemaining,
        banner: {
          type: 'trial',
          message: `You have ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining in your free trial.`,
          ctaText: 'Lock In Self-Work (₹499/mo)',
          ctaHref: '/settings'
        },
        subscription: null,
        purchasedModules,
        purchasedWorkshops,
        hasPaidTherapySession
      });
    }

    // 8. DORMANT state: Past trial, expired, or cancelled past period end
    return this.buildAccessPayload({
      userId,
      state: 'DORMANT',
      capabilities: {
        canWriteJournal: false,
        canStartSession: false,
        canPerformExercise: false,
        canGenerateReports: false,
        canReadHistory: true // All past reflections, journals, and reports remain safe and readable
      },
      currentPeriodEnd: subscriptionRec?.current_period_end || null,
      trialDaysRemaining: 0,
      banner: {
        type: 'dormant',
        message: 'Your account is currently in reflective read-only mode. All past journals, reports, and reflections remain safe and accessible. Subscribe to resume daily self-work sessions.',
        ctaText: 'Resume Self-Work (₹499/mo)',
        ctaHref: '/settings'
      },
      subscription: subscriptionRec ? {
        id: subscriptionRec.id,
        gatewaySubscriptionId: subscriptionRec.gateway_subscription_id,
        status: subscriptionRec.status,
        cancelAtPeriodEnd: subscriptionRec.cancel_at_period_end || false,
        currentPeriodEnd: subscriptionRec.current_period_end
      } : null,
      purchasedModules,
      purchasedWorkshops,
      hasPaidTherapySession
    });
  }

  /**
   * Guard for writing journal entries or starting daily self-work sessions.
   * Throws AccessDeniedError if customer is dormant.
   */
  public static async requireSelfHelpWriteAccess(userId: string): Promise<CustomerAccess> {
    const access = await this.getCustomerAccess(userId);
    if (!access.capabilities.canWriteJournal || !access.capabilities.canStartSession) {
      throw new AccessDeniedError(
        'Your account is currently in reflective read-only mode. An active Ingress Within Self-Work subscription (₹499/mo) is required to write entries or start sessions.',
        access.state,
        'SELF_HELP_SUBSCRIPTION_REQUIRED'
      );
    }
    return access;
  }

  /**
   * Guard for starting or progressing interactive exercises.
   * Throws AccessDeniedError if customer is dormant.
   */
  public static async requireExerciseProgressAccess(userId: string, exerciseId?: string): Promise<CustomerAccess> {
    const access = await this.getCustomerAccess(userId);
    if (!access.capabilities.canPerformExercise) {
      throw new AccessDeniedError(
        'Your account is currently in reflective read-only mode. An active Ingress Within Self-Work subscription (₹499/mo) is required to progress through exercises.',
        access.state,
        'SELF_HELP_SUBSCRIPTION_REQUIRED'
      );
    }
    return access;
  }

  /**
   * Guard for triggering on-demand report backfill or generation.
   * Throws AccessDeniedError if customer is dormant.
   */
  public static async requireReportGenerateAccess(userId: string): Promise<CustomerAccess> {
    const access = await this.getCustomerAccess(userId);
    if (!access.capabilities.canGenerateReports) {
      throw new AccessDeniedError(
        'Your account is currently in reflective read-only mode. An active Ingress Within Self-Work subscription (₹499/mo) is required to generate new reports.',
        access.state,
        'SELF_HELP_SUBSCRIPTION_REQUIRED'
      );
    }
    return access;
  }

  /**
   * Guard for generating new pattern analysis.
   * Throws AccessDeniedError if customer is dormant.
   */
  public static async requirePatternGenerateAccess(userId: string): Promise<CustomerAccess> {
    const access = await this.getCustomerAccess(userId);
    if (!access.selfHelp.canGeneratePatterns) {
      throw new AccessDeniedError(
        'Your account is currently in reflective read-only mode. An active Ingress Within Self-Work subscription (₹499/mo) is required to generate new patterns.',
        access.state,
        'SELF_HELP_SUBSCRIPTION_REQUIRED'
      );
    }
    return access;
  }

  /**
   * Guard for module access (independent purchase check).
   */
  public static async requireModuleAccess(userId: string, moduleId: string): Promise<boolean> {
    const hasAccess = await EntitlementService.hasModuleAccess(userId, moduleId);
    if (!hasAccess) {
      throw new AccessDeniedError(
        `Access to module '${moduleId}' requires an independent purchase.`,
        'DORMANT',
        'MODULE_PURCHASE_REQUIRED'
      );
    }
    return true;
  }
}
