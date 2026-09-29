import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../../../lib/therapist/therapistAuthHelper';
import { TherapistHomeworkService } from '../../../../../../lib/therapist/therapistHomeworkService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const feedback = body.feedback !== undefined ? body.feedback : body.feedbackText;

    const assignment = await TherapistHomeworkService.reviewSubmission(account.id, id, feedback || '');
    return NextResponse.json({ success: true, assignment });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'ASSIGNMENT_REVIEW_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
