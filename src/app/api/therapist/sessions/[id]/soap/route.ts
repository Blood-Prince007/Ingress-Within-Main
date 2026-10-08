import { NextRequest, NextResponse } from 'next/server';
import { requireAuthorizedTherapist } from '../../../../../../lib/therapist/therapistAuthHelper';
import { TherapistPlatformService } from '../../../../../../lib/therapist/therapistPlatformService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const { id } = await params;

    const note = await TherapistPlatformService.getSoapNote(account.id, id);
    return NextResponse.json({ success: true, note });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'SOAP_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { account } = await requireAuthorizedTherapist(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { subjective, objective, assessment, plan, is_draft, isDraft } = body;

    const saved = await TherapistPlatformService.saveSoapNote(account.id, id, {
      subjective: subjective ?? '',
      objective: objective ?? '',
      assessment: assessment ?? '',
      plan: plan ?? '',
      isDraft: is_draft !== undefined ? Boolean(is_draft) : (isDraft !== undefined ? Boolean(isDraft) : true),
    });

    return NextResponse.json({ success: true, note: saved });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: err.code || 'SOAP_SAVE_ERROR', message: err.message } },
      { status: err.status || 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return POST(request, { params });
}
