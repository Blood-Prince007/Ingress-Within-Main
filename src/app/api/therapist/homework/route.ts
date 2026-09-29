import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../lib/therapist/therapistAuthHelper';
import { TherapistHomeworkService } from '../../../../lib/therapist/therapistHomeworkService';

export async function GET(request: NextRequest) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId') || undefined;
    const appointmentId = searchParams.get('appointmentId') || undefined;
    const status = searchParams.get('status') || undefined;

    const assignments = await TherapistHomeworkService.getAssignments(account.id, {
      clientId,
      appointmentId,
      status,
    });

    return NextResponse.json({ success: true, assignments });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'HOMEWORK_FETCH_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const body = await request.json().catch(() => ({}));

    const assignment = await TherapistHomeworkService.createAssignment(account.id, {
      clientId: body.clientId || body.user_id,
      appointmentId: body.appointmentId || body.appointment_id,
      templateId: body.templateId || body.template_id,
      title: body.title,
      instructions: body.instructions,
      clinicalGoal: body.clinicalGoal || body.clinical_goal,
      exerciseType: body.exerciseType || body.exercise_type,
      resourceReference: body.resourceReference || body.resource_reference,
      estimatedMinutes: body.estimatedMinutes !== undefined ? Number(body.estimatedMinutes) : (body.estimated_minutes !== undefined ? Number(body.estimated_minutes) : undefined),
      dueAt: body.dueAt || body.due_at,
    });

    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'HOMEWORK_CREATE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}
