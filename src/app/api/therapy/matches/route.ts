import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { getTherapySession, saveTherapyMatches, getTherapyMatches, validateEligibleTherapist, getClientConnectedTherapist } from '../../../../lib/therapy/therapyService';
import { computeTherapistMatches } from '../../../../lib/therapy/therapistMatchingService';
import { supabase } from '../../../../lib/db';
import { EmailService } from '../../../../lib/email/emailService';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) return NextResponse.json({ error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } }, { status: 401 });

    const body = await request.json();
    if (!isRecord(body)) return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'Invalid request body.' } }, { status: 400 });

    const sessionId = body.sessionId;
    if (typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      return NextResponse.json({ error: { code: 'INVALID_SESSION', message: 'sessionId is required.' } }, { status: 400 });
    }

    const normalizedSessionId = sessionId.trim();
    const session = await getTherapySession(normalizedSessionId, authUser.userId);
    if (!session) return NextResponse.json({ error: { code: 'SESSION_NOT_FOUND', message: 'Therapy session was not found.' } }, { status: 404 });

    const selectedTherapistId = typeof body.selectedTherapistAccountId === 'string'
      ? body.selectedTherapistAccountId.trim()
      : null;

    let savedMatches;
    let candidatesToNotify: Array<{
      matchId: string;
      therapistAccountId: string;
      therapistName: string;
      email?: string | null;
      rank: number;
      score: number;
    }> = [];

    if (Array.isArray(body.matches) && body.matches.length > 0) {
      // Client provided matching candidates (e.g., from guided form)
      savedMatches = await saveTherapyMatches(
        normalizedSessionId,
        authUser.userId,
        body.matches.map((match: any, index: number) => {
          const tId = match.therapistAccountId || match.id;
          const isSelected = match.matchStatus === 'selected' || match.matchStatus === 'shortlisted' || (selectedTherapistId && tId === selectedTherapistId);
          return {
            therapistAccountId: tId,
            matchStatus: isSelected ? 'shortlisted' : (match.matchStatus || 'candidate'),
            matchRank: match.matchRank ?? (index + 1),
            matchScore: match.matchScore ?? 85,
            matchReasons: match.matchReasons || [],
            matchingMetadata: match.matchingMetadata || {},
          };
        })
      );

      // Collect profile and contact email info for all saved matches to dispatch notification
      for (let i = 0; i < savedMatches.length; i++) {
        const sm = savedMatches[i];
        if (!sm.therapist_account_id) continue;

        const { data: profile } = await supabase
          .from('therapist_profiles')
          .select('full_name, contact_email')
          .eq('therapist_account_id', sm.therapist_account_id)
          .maybeSingle();

        let therapistEmail = profile?.contact_email;
        if (!therapistEmail) {
          const { data: app } = await supabase
            .from('therapist_applications')
            .select('contact_email, answers')
            .eq('therapist_account_id', sm.therapist_account_id)
            .maybeSingle();
          therapistEmail = app?.contact_email || (app?.answers as any)?.contact_email;
        }

        candidatesToNotify.push({
          matchId: sm.id,
          therapistAccountId: sm.therapist_account_id,
          therapistName: profile?.full_name || 'Therapist',
          email: therapistEmail,
          rank: sm.match_rank || (i + 1),
          score: sm.match_score || 85,
        });
      }
    } else {
      // Compute matches dynamically
      const candidates = await computeTherapistMatches(normalizedSessionId, authUser.userId, 3);
      savedMatches = await saveTherapyMatches(normalizedSessionId, authUser.userId, candidates.map((candidate, index) => ({
        therapistAccountId: candidate.therapistAccountId,
        matchStatus: (selectedTherapistId && candidate.therapistAccountId === selectedTherapistId) ? 'shortlisted' : 'candidate',
        matchRank: index + 1,
        matchScore: candidate.score,
        matchReasons: candidate.reasons,
        matchingMetadata: candidate.metadata,
      })));

      candidatesToNotify = savedMatches.map((m, idx) => ({
        matchId: m.id,
        therapistAccountId: candidates[idx]?.therapistAccountId,
        therapistName: candidates[idx]?.therapistName || 'Therapist',
        email: candidates[idx]?.email,
        rank: idx + 1,
        score: candidates[idx]?.score || 85,
      }));
    }

    const emailResults = await Promise.allSettled(candidatesToNotify.map((candidate) => {
      if (!candidate?.email || !candidate?.matchId) return Promise.resolve();
      return EmailService.notifyTherapistMatchRequest({
        matchId: candidate.matchId,
        therapistId: candidate.therapistAccountId,
        therapistName: candidate.therapistName,
        therapistEmail: candidate.email,
        rank: candidate.rank,
        score: candidate.score,
      });
    }));

    const failedEmails = emailResults.filter((result) => result.status === 'rejected');
    if (failedEmails.length > 0) {
      console.error(`[Therapy Matches POST] ${failedEmails.length} therapist notification email(s) failed after match save.`);
    }

    return NextResponse.json({ success: true, matches: savedMatches, emailNotifications: { attempted: emailResults.length, failed: failedEmails.length } }, { status: 201 });
  } catch (error) {
    console.error('[Therapy Matches POST] Error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to calculate and save Therapy matches.' } }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) return NextResponse.json({ error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    if (!sessionId) return NextResponse.json({ error: { code: 'INVALID_SESSION', message: 'sessionId is required.' } }, { status: 400 });

    const session = await getTherapySession(sessionId, authUser.userId);
    if (!session) return NextResponse.json({ error: { code: 'SESSION_NOT_FOUND', message: 'Therapy session was not found.' } }, { status: 404 });

    const [matches, connectedTherapist] = await Promise.all([
      getTherapyMatches(sessionId, authUser.userId),
      getClientConnectedTherapist(authUser.userId),
    ]);

    return NextResponse.json({ success: true, matches, connectedTherapist });
  } catch (error) {
    console.error('[Therapy Matches GET] Error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve Therapy matches.' } }, { status: 500 });
  }
}
