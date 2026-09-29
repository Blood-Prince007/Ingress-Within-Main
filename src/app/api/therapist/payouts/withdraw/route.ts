import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../../lib/therapist/therapistAuthHelper';
import { TherapistPayoutAccountService } from '../../../../../lib/therapist/therapistPayoutAccountService';

export async function GET(request: NextRequest) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const history = await TherapistPayoutAccountService.getWithdrawalHistory(account.id);

    return NextResponse.json({
      success: true,
      withdrawals: history,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'UNAUTHORIZED', message: err.message } },
      { status: err.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const body = await request.json();

    const { payoutAccountId, amount, idempotencyKey } = body;

    const withdrawal = await TherapistPayoutAccountService.requestWithdrawal({
      therapistAccountId: account.id,
      payoutAccountId,
      amount: Number(amount),
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      withdrawal,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'WITHDRAWAL_ERROR', message: err.message } },
      { status: err.status || 400 }
    );
  }
}
