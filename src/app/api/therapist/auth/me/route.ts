import { NextRequest, NextResponse } from 'next/server';
import { requireTherapistProfile } from '../../../../../lib/therapist/therapistAuthHelper';

export async function GET(request: NextRequest) {
  try {
    const { account, profile } = await requireTherapistProfile(request);

    return NextResponse.json({
      success: true,
      therapist: {
        id: account.id,
        phone_number: account.phone_number,
        status: account.status,
        is_active: account.is_active,
        can_practice: account.can_practice,
        application_status: account.application_status,
        verification_status: account.verification_status,
        rci_registered: account.rci_registered,
        rci_number: account.rci_number,
        commission_rate: account.commission_rate,
        per_session_fee: account.per_session_fee,
        created_at: account.created_at,
        updated_at: account.updated_at
      },
      profile: {
        id: profile.id,
        phone_number: profile.phone_number,
        full_name: profile.full_name,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }
    });
  } catch (err: any) {
    const status = err.status || 401;
    return NextResponse.json(
      {
        error: {
          code: err.code || 'THERAPIST_AUTH_REQUIRED',
          message: err.message || 'Therapist authentication required.'
        }
      },
      { status }
    );
  }
}
