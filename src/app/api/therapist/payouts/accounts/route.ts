import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../../lib/therapist/therapistAuthHelper';
import { TherapistPayoutAccountService } from '../../../../../lib/therapist/therapistPayoutAccountService';

export async function GET(request: NextRequest) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const accounts = await TherapistPayoutAccountService.getPayoutAccounts(account.id);

    return NextResponse.json({
      success: true,
      accounts,
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

    const {
      accountType,
      beneficiaryName,
      bankName,
      accountNumber,
      ifsc,
      upiId,
      isDefault,
    } = body;

    const newAccount = await TherapistPayoutAccountService.createPayoutAccount({
      therapistAccountId: account.id,
      accountType,
      beneficiaryName,
      bankName,
      accountNumber,
      ifsc,
      upiId,
      isDefault,
    });

    return NextResponse.json({
      success: true,
      account: newAccount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'PAYOUT_ACCOUNT_ERROR', message: err.message } },
      { status: err.status || 400 }
    );
  }
}
