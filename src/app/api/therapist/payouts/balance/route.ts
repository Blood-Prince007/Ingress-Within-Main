import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../../lib/therapist/therapistAuthHelper';
import { TherapistPayoutAccountService } from '../../../../../lib/therapist/therapistPayoutAccountService';

export async function GET(request: NextRequest) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const balance = await TherapistPayoutAccountService.getAvailableBalance(account.id);

    return NextResponse.json({
      success: true,
      ...balance,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'BALANCE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
