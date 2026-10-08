import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { createTherapySubmission } from '../../../../lib/therapy/therapyService';

const VALID_SUBMISSION_TYPES = [
  'conversation',
  'guided',
  'team',
] as const;

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Authentication is required.',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid request body.',
          },
        },
        { status: 400 }
      );
    }

    const {
      therapySessionId,
      submissionType,
      callbackPreference,
      notes,
      metadata,
      payload,
    } = body;

    if (
      typeof therapySessionId !== 'string' ||
      therapySessionId.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_SESSION',
            message: 'therapySessionId is required.',
          },
        },
        { status: 400 }
      );
    }

    if (
      typeof submissionType !== 'string' ||
      !VALID_SUBMISSION_TYPES.includes(
        submissionType as (typeof VALID_SUBMISSION_TYPES)[number]
      )
    ) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_SUBMISSION_TYPE',
            message: 'Invalid submissionType.',
          },
        },
        { status: 400 }
      );
    }

    const resolvedMetadata =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata)
        ? metadata
        : payload && typeof payload === 'object' && !Array.isArray(payload)
          ? payload
          : {};

    const submission = await createTherapySubmission({
      therapySessionId: therapySessionId.trim(),
      userId: authUser.userId,
      submissionType:
        submissionType as Parameters<typeof createTherapySubmission>[0]['submissionType'],
      callbackPreference:
        typeof callbackPreference === 'string'
          ? callbackPreference
          : null,
      notes:
        typeof notes === 'string'
          ? notes
          : null,
      metadata: resolvedMetadata,
    });

    // Ensure selected therapist is tracked in therapy_matches with shortlisted status and notified
    const selectedTherapistId = resolvedMetadata.selectedTherapistAccountId || resolvedMetadata.selectedTherapistPrototypeId;
    if (typeof selectedTherapistId === 'string' && selectedTherapistId.trim()) {
      try {
        const cleanTherapistId = selectedTherapistId.trim();
        const { supabase } = await import('../../../../lib/db');
        const { EmailService } = await import('../../../../lib/email/emailService');

        // Check if match already exists
        const { data: existingMatch } = await supabase
          .from('therapy_matches')
          .select('*')
          .eq('therapy_session_id', therapySessionId.trim())
          .eq('therapist_account_id', cleanTherapistId)
          .maybeSingle();

        let targetMatchId = existingMatch?.id;

        if (!existingMatch) {
          const { data: newMatch } = await supabase
            .from('therapy_matches')
            .insert({
              therapy_session_id: therapySessionId.trim(),
              user_id: authUser.userId,
              therapist_account_id: cleanTherapistId,
              match_status: 'shortlisted',
              match_rank: 1,
              match_score: 95,
              match_reasons: ['Selected by client during guided intake'],
              matching_metadata: { source: 'client_intake_submission' },
            })
            .select('*')
            .single();
          targetMatchId = newMatch?.id;
        } else if (existingMatch.match_status !== 'selected') {
          await supabase
            .from('therapy_matches')
            .update({ match_status: 'shortlisted' })
            .eq('id', existingMatch.id);
        }

        if (targetMatchId) {
          const { data: profile } = await supabase
            .from('therapist_profiles')
            .select('full_name, contact_email')
            .eq('therapist_account_id', cleanTherapistId)
            .maybeSingle();

          let therapistEmail = profile?.contact_email;
          if (!therapistEmail) {
            const { data: app } = await supabase
              .from('therapist_applications')
              .select('contact_email, answers')
              .eq('therapist_account_id', cleanTherapistId)
              .maybeSingle();
            therapistEmail = app?.contact_email || (app?.answers as any)?.contact_email;
          }

          if (therapistEmail) {
            await EmailService.notifyTherapistMatchRequest({
              matchId: targetMatchId,
              therapistId: cleanTherapistId,
              therapistName: profile?.full_name || (resolvedMetadata.selectedTherapistName as string) || 'Therapist',
              therapistEmail,
              rank: 1,
              score: 95,
            });
          }
        }
      } catch (matchLinkErr) {
        console.warn('[Therapy Submission POST] Match linking/email notice:', matchLinkErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        submission,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Therapy Submission POST] Error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create Therapy submission.',
        },
      },
      { status: 500 }
    );
  }
}