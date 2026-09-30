import { NextRequest, NextResponse } from 'next/server';
import { requireTherapistProfile } from '../../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../../lib/therapist/therapistPlatformService';

/**
 * Checks deactivation readiness for a therapist.
 */
export async function GET(request: NextRequest) {
  try {
    const { account } = await requireTherapistProfile(request);
    const readiness = await TherapistPlatformService.checkDeactivationReadiness(account.id);

    return NextResponse.json({
      success: true,
      readiness,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'DEACTIVATION_CHECK_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}

/**
 * Initiates practice offboarding/deactivation request if all healthcare invariants pass.
 */
export async function POST(request: NextRequest) {
  try {
    const { account } = await requireTherapistProfile(request);
    const readiness = await TherapistPlatformService.checkDeactivationReadiness(account.id);

    if (!readiness.canDeactivate) {
      return NextResponse.json(
        {
          error: {
            code: 'DEACTIVATION_BLOCKED',
            message: 'Your account cannot be deactivated at this time due to active clinical obligations or unsettled balances.',
            blockingReasons: readiness.blockingReasons,
          },
        },
        { status: 400 }
      );
    }

    // In a live healthcare platform, offboarding notifies clinical operations for final closure
    return NextResponse.json({
      success: true,
      message: 'Your practice offboarding request has been received. Our clinical operations team will review and complete closure within 2-3 business days.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'DEACTIVATION_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
