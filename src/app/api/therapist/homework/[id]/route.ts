import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../../lib/therapist/therapistAuthHelper';
import { TherapistHomeworkService } from '../../../../../lib/therapist/therapistHomeworkService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const { id } = await params;

    const assignment = await TherapistHomeworkService.getAssignmentById(account.id, id);
    return NextResponse.json({ success: true, assignment });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'ASSIGNMENT_FETCH_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const updated = await TherapistHomeworkService.updateAssignment(account.id, id, {
      title: body.title,
      instructions: body.instructions,
      clinicalGoal: body.clinicalGoal !== undefined ? body.clinicalGoal : body.clinical_goal,
      dueAt: body.dueAt !== undefined ? body.dueAt : body.due_at,
      status: body.status,
    });

    return NextResponse.json({ success: true, assignment: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'ASSIGNMENT_UPDATE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
