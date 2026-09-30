import { NextRequest, NextResponse } from 'next/server';
import { requireTherapistProfile } from '../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../lib/therapist/therapistPlatformService';

export async function GET(request: NextRequest) {
  try {
    const { account, profile } = await requireTherapistProfile(request);

    // Compute summary stats for the profile settings hub
    let balanceSummary: any = null;
    let deactivationReadiness: any = null;
    try {
      deactivationReadiness = await TherapistPlatformService.checkDeactivationReadiness(account.id);
      balanceSummary = {
        availableToWithdraw: deactivationReadiness.availableBalance,
        inFlightWithdrawals: deactivationReadiness.inFlightWithdrawals,
      };
    } catch {
      // In-memory or fallback
    }

    return NextResponse.json({
      success: true,
      account,
      profile,
      summary: {
        activeClients: deactivationReadiness?.activeClients || 0,
        upcomingSessions: deactivationReadiness?.upcomingSessions || 0,
        availableBalance: balanceSummary?.availableToWithdraw || 0,
        canDeactivate: deactivationReadiness?.canDeactivate ?? false,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'PROFILE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Mass Assignment Shield: Strictly Reject attempts to tamper with protected fields
    const FORBIDDEN_KEYS = [
      'id',
      'therapist_account_id',
      'auth_user_id',
      'phone',
      'phone_number',
      'can_practice',
      'canPractice',
      'status',
      'account_status',
      'application_status',
      'applicationStatus',
      'verification_status',
      'verificationStatus',
      'rci_registered',
      'rciRegistered',
      'commission_rate',
      'commissionRate',
      'per_session_fee',
      'perSessionFee',
      'role',
    ];

    for (const key of FORBIDDEN_KEYS) {
      if (body[key] !== undefined) {
        return NextResponse.json(
          {
            error: {
              code: 'FORBIDDEN_FIELD_MUTATION',
              message: `Field '${key}' cannot be modified. Administrative authorization required.`,
            },
          },
          { status: 403 }
        );
      }
    }

    const { account } = await requireTherapistProfile(request);

    const updatedProfile = await TherapistPlatformService.updateProfile(
      account.id,
      body
    );

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'PROFILE_UPDATE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
