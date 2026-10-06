import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { getTherapySession, saveTherapyMatches, getTherapyMatches, validateEligibleTherapist, getClientConnectedTherapist } from '../../../../lib/therapy/therapyService';
import { computeTherapistMatches } from '../../../../lib/therapy/therapistMatchingService';
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

    const candidates = await computeTherapistMatches(normalizedSessionId, authUser.userId, 3);
    const savedMatches = await saveTherapyMatches(normalizedSessionId, authUser.userId, candidates.map((candidate, index) => ({
      therapistAccountId: candidate.therapistAccountId,
      matchStatus: 'candidate',
      matchRank: index + 1,
      matchScore: candidate.score,
      matchReasons: candidate.reasons,
      matchingMetadata: candidate.metadata,
    })));

    const emailResults = await Promise.allSettled(savedMatches.map((match, index) => {
      const candidate = candidates[index];
      if (!candidate?.email || !match?.id) return Promise.resolve();
      return EmailService.notifyTherapistMatchRequest({
        matchId: match.id,
        therapistId: candidate.therapistAccountId,
        therapistName: candidate.therapistName,
        therapistEmail: candidate.email,
        rank: index + 1,
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
