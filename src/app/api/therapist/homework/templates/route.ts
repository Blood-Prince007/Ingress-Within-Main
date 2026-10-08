import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../../lib/therapist/therapistAuthHelper';
import { TherapistHomeworkService } from '../../../../../lib/therapist/therapistHomeworkService';

export async function GET(request: NextRequest) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const templates = await TherapistHomeworkService.getTemplates(account.id);
    return NextResponse.json({ success: true, templates });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'TEMPLATES_FETCH_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
