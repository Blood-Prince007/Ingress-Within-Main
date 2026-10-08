import { NextRequest, NextResponse } from 'next/server';
import { requireTherapistApplicant } from '../../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../../lib/therapist/therapistPlatformService';

export async function GET(request: NextRequest) {
  try {
    const { account, profile } = await requireTherapistApplicant(request);
    const state = await TherapistPlatformService.getOnboardingState(account.id);

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        phoneNumber: account.phone_number,
        status: account.status,
        canPractice: account.can_practice,
        applicationStatus: account.application_status,
        verificationStatus: account.verification_status,
      },
      profile: {
        fullName: profile.full_name,
        title: profile.title,
      },
      application: {
        step: state.application?.step,
        submittedAt: state.application?.submitted_at,
        reviewedAt: state.application?.reviewed_at,
        reviewerNotes: state.application?.reviewer_notes,
        rejectionReason: (state.application as any)?.rejection_reason || null,
        resubmittedAt: (state.application as any)?.resubmitted_at || null,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'STATUS_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
