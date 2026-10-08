import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../lib/therapist/therapistAuthHelper';
import { TherapistEarningsService } from '../../../../lib/therapist/therapistEarningsService';

export async function GET(request: NextRequest) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const { searchParams } = new URL(request.url);

    const range = (searchParams.get('range') as any) || undefined;
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;

    const report = await TherapistEarningsService.getEarningsReport(account.id, {
      range,
      from,
      to,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...report,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'EARNINGS_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
