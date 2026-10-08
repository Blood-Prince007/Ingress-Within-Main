import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../lib/therapist/therapistPlatformService';

export async function GET(request: NextRequest) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const searchParams = request.nextUrl.searchParams;
    const fromParam = searchParams.get('from') || searchParams.get('startDate');
    const toParam = searchParams.get('to') || searchParams.get('endDate');

    // Parse date or ISO strings cleanly
    const startDate = fromParam
      ? (fromParam.includes('T') ? fromParam : `${fromParam}T00:00:00.000Z`)
      : new Date(Date.now() - 7 * 86400000).toISOString();
    const endDate = toParam
      ? (toParam.includes('T') ? toParam : `${toParam}T23:59:59.999Z`)
      : new Date(Date.now() + 30 * 86400000).toISOString();

    const data = await TherapistPlatformService.getCalendarEvents(
      account.id,
      startDate,
      endDate
    );

    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'CALENDAR_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
