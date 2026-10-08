import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/db';
import { getAuthenticatedUser } from '../../../lib/auth-helper';
import { triggerAIProcessing, checkWeeklyAndMonthlySummary } from '../../../lib/queue/triggers';
import { queueRegistry } from '../../../lib/queue/registry';
import { AccessControlService, AccessDeniedError } from '../../../lib/billing/accessControlService';

/**
 * GET: Fetches the active daily session or check if today's session is complete.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    // 1. Look for an active session in progress (status !== 'complete')
    const { data: activeSessions, error: activeError } = await supabase
      .from('daily_sessions')
      .select('*')
      .eq('user_id', authUser.userId)
      .neq('status', 'complete')
      .order('created_at', { ascending: false })
      .limit(1);

    if (activeError) {
      console.error('Failed to query active daily session:', activeError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to check active session.' } },
        { status: 500 }
      );
    }

    if (activeSessions && activeSessions.length > 0) {
      return NextResponse.json({
        success: true,
        exists: true,
        isCompletedToday: false,
        session: activeSessions[0]
      });
    }

    // 2. Look for the latest completed session to see if it was completed recently
    const { data: completedSessions, error: completedError } = await supabase
      .from('daily_sessions')
      .select('*')
      .eq('user_id', authUser.userId)
      .eq('status', 'complete')
      .order('completed_at', { ascending: false })
      .limit(1);

    if (completedError) {
      console.error('Failed to query completed sessions:', completedError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to query completed sessions.' } },
        { status: 500 }
      );
    }

    if (completedSessions && completedSessions.length > 0) {
      const latest = completedSessions[0];

      const clientTodayStart = request.headers.get('x-client-today-start');
      const fallbackStart = new Date();
      fallbackStart.setUTCHours(0, 0, 0, 0);
      const startRange = clientTodayStart || fallbackStart.toISOString();

      // If completed on or after client local midnight, treat today's session as completed
      const isCompletedToday = new Date(latest.completed_at).getTime() >= new Date(startRange).getTime();

      // Fetch exercise and journal entry details for the completion recap screen
      let exercise = null;
      let journal = null;

      if (isCompletedToday) {
        if (latest.exercise_id) {
          const { data: exData } = await supabase
            .from('exercises')
            .select('*')
            .eq('id', latest.exercise_id)
            .eq('user_id', authUser.userId)
            .maybeSingle();
          if (exData) {
            try {
              const parsed = JSON.parse(exData.response_encrypted || '{}');
              exercise = {
                ...exData,
                stressor_type: parsed.stressor_type || '',
                reactive_thought: parsed.reactive_thought || '',
                reframed_thought: parsed.reframed_thought || '',
                clarity_score: parsed.clarity_score || 0
              };
            } catch {
              exercise = exData;
            }
          }
        }
        if (latest.journal_entry_id) {
          const { data: jData } = await supabase
            .from('entries')
            .select('*')
            .eq('id', latest.journal_entry_id)
            .eq('user_id', authUser.userId)
            .maybeSingle();
          journal = jData;
        }
      }

      return NextResponse.json({
        success: true,
        exists: isCompletedToday,
        isCompletedToday,
        session: latest,
        exercise,
        journal
      });
    }

    // No session found at all
    return NextResponse.json({
      success: true,
      exists: false,
      isCompletedToday: false,
      session: null
    });

  } catch (error) {
    console.error('Session GET Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}

/**
 * POST: Handles session mutations (start, save-step, complete).
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    // Access control: Ensure user has active/trial self-work access
    await AccessControlService.requireSelfHelpWriteAccess(authUser.userId);

    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing action parameter.' } },
        { status: 400 }
      );
    }

    // --- ACTION: START SESSION ---
    if (action === 'start') {
      // Check for existing active session first
      const { data: active } = await supabase
        .from('daily_sessions')
        .select('*')
        .eq('user_id', authUser.userId)
        .neq('status', 'complete')
        .limit(1);

      if (active && active.length > 0) {
        return NextResponse.json({
          success: true,
          session: active[0]
        });
      }

      // Check if they already wrote or completed a session today
      const clientTodayStart = request.headers.get('x-client-today-start');
      const fallbackStart = new Date();
      fallbackStart.setUTCHours(0, 0, 0, 0);
      const startRange = clientTodayStart || fallbackStart.toISOString();

      // Check journal_entries
      const { data: existingEntries } = await supabase
        .from('entries')
        .select('id')
        .eq('user_id', authUser.userId)
        .gte('created_at', startRange)
        .limit(1);

      // Check completed daily sessions
      const { data: completedSessions } = await supabase
        .from('daily_sessions')
        .select('id')
        .eq('user_id', authUser.userId)
        .eq('status', 'complete')
        .gte('completed_at', startRange)
        .limit(1);

      if ((existingEntries && existingEntries.length > 0) || (completedSessions && completedSessions.length > 0)) {
        return NextResponse.json(
          { error: { code: 'LIMIT_EXCEEDED', message: 'You have already completed your writing for today. The limit resets at midnight.' } },
          { status: 400 }
        );
      }

      // Count completed sessions to determine the day number
      const { count, error: countError } = await supabase
        .from('daily_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authUser.userId)
        .eq('status', 'complete');

      if (countError) {
        console.error('Failed to count completed sessions:', countError);
        return NextResponse.json(
          { error: { code: 'DATABASE_ERROR', message: 'Failed to initialize session day count.' } },
          { status: 500 }
        );
      }

      const nextDayNum = (count || 0) + 1;

      // Insert new session row
      const { data: newSession, error: insertError } = await supabase
        .from('daily_sessions')
        .insert({
          user_id: authUser.userId,
          day_number: nextDayNum,
          status: 'start',
          session_data: {}
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create daily session:', insertError);
        return NextResponse.json(
          { error: { code: 'DATABASE_ERROR', message: 'Failed to create new daily session.' } },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        session: newSession
      });
    }

    // --- ACTION: SAVE STEP & DRAFT DATA ---
    if (action === 'save-step') {
      const { status, sessionData } = body;
      if (!status) {
        return NextResponse.json(
          { error: { code: 'BAD_REQUEST', message: 'Missing status step name.' } },
          { status: 400 }
        );
      }

      // Update the active session's step status and draft data
      const { data: updated, error: updateError } = await supabase
        .from('daily_sessions')
        .update({
          status,
          session_data: sessionData || {}
        })
        .eq('user_id', authUser.userId)
        .neq('status', 'complete')
        .select();

      if (updateError) {
        console.error('Failed to save session step:', updateError);
        return NextResponse.json(
          { error: { code: 'DATABASE_ERROR', message: 'Failed to save session progress.' } },
          { status: 500 }
        );
      }

      if (!updated || updated.length === 0) {
        return NextResponse.json(
          { error: { code: 'SESSION_NOT_FOUND', message: 'No active session in progress found to update.' } },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        session: updated[0]
      });
    }

    // --- ACTION: COMPLETE SESSION ---
    if (action === 'complete') {
      const { exercise, journal, closing_response } = body;
      if (!exercise || !journal || closing_response === undefined) {
        return NextResponse.json(
          { error: { code: 'BAD_REQUEST', message: 'Missing final step completion details.' } },
          { status: 400 }
        );
      }

      // Block session completion if they have written a free-form entry today
      const clientTodayStart = request.headers.get('x-client-today-start');
      const fallbackStart = new Date();
      fallbackStart.setUTCHours(0, 0, 0, 0);
      const startRange = clientTodayStart || fallbackStart.toISOString();

      const { data: todayEntries } = await supabase
        .from('entries')
        .select('id, session_id')
        .eq('user_id', authUser.userId)
        .gte('created_at', startRange);

      const hasFreeWriteToday = todayEntries && todayEntries.some(e => !e.session_id);
      if (hasFreeWriteToday) {
        return NextResponse.json(
          { error: { code: 'LIMIT_EXCEEDED', message: 'You have already completed your writing for today. The limit resets at midnight.' } },
          { status: 400 }
        );
      }

      // Get the active session to find the day number
      const { data: activeSessions } = await supabase
        .from('daily_sessions')
        .select('*')
        .eq('user_id', authUser.userId)
        .neq('status', 'complete')
        .limit(1);

      if (!activeSessions || activeSessions.length === 0) {
        return NextResponse.json(
          { error: { code: 'SESSION_NOT_FOUND', message: 'No active session found to complete.' } },
          { status: 404 }
        );
      }
      const activeSession = activeSessions[0];

      // Gating check: Block completing session if the latest cycle is completed but assessment is pending
      const { data: latestCycle } = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', authUser.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestCycle && (latestCycle.status === 'COMPLETED' || latestCycle.status === 'complete') && !latestCycle.assessment_completed) {
        return NextResponse.json(
          { error: { code: 'ASSESSMENT_REQUIRED', message: 'You must complete your cycle assessment before completing daily sessions.' } },
          { status: 400 }
        );
      }

      // Fetch active cycle to populate exercises and entries
      const { data: activeCycle } = await supabase
        .from('cycles')
        .select('id, start_date, total_days')
        .eq('user_id', authUser.userId)
        .in('status', ['ACTIVE', 'active'])
        .maybeSingle();

      const cycleId = activeCycle?.id || null;
      const cycleDay = activeSession.day_number || 1;

      // 1. Create exercise record
      const { data: exerciseRecord, error: exerciseError } = await supabase
        .from('exercises')
        .insert({
          user_id: authUser.userId,
          cycle_id: cycleId,
          cycle_day: cycleDay,
          template_id: 'cbt_reframing',
          surfaced_at: activeSession.created_at,
          completed_at: new Date().toISOString(),
          response_encrypted: JSON.stringify({
            stressor_type: exercise.stressor_type,
            reactive_thought: exercise.reactive_thought,
            reframed_thought: exercise.reframed_thought,
            clarity_score: exercise.clarity_score
          }),
          status: 'completed'
        })
        .select()
        .single();

      if (exerciseError) {
        console.error('Failed to log session exercise:', exerciseError);
        return NextResponse.json(
          { error: { code: 'DATABASE_ERROR', message: 'Failed to save session cognitive exercise.' } },
          { status: 500 }
        );
      }

      let formattedExercise = null;
      if (exerciseRecord) {
        formattedExercise = {
          ...exerciseRecord,
          stressor_type: exercise.stressor_type,
          reactive_thought: exercise.reactive_thought,
          reframed_thought: exercise.reframed_thought,
          clarity_score: exercise.clarity_score
        };
      }

      // 2. Create journal entry record
      const wordCount = journal.content.trim().split(/\s+/).filter(Boolean).length;
      const { data: journalRecord, error: journalError } = await supabase
        .from('entries')
        .insert({
          user_id: authUser.userId,
          session_id: activeSession.id,
          content: journal.content,
          new_entry_text_encrypted: journal.content, // future compatibility
          entry_type: 'new_only',
          word_count: wordCount,
          cycle_id: cycleId,
          cycle_day: cycleDay,
          written_at: new Date().toISOString()
        })
        .select()
        .single();

      if (journalError) {
        console.error('Failed to log session journal:', journalError);
        // Attempt cleanup of the exercise
        await supabase.from('exercises').delete().eq('id', exerciseRecord.id).eq('user_id', authUser.userId);

        return NextResponse.json(
          { error: { code: 'DATABASE_ERROR', message: 'Failed to save session journal entry.' } },
          { status: 500 }
        );
      }

      // 3. Mark session as complete and link the entries
      const finalSessionData = {
        ...activeSession.session_data,
        closing_response
      };

      const { data: completedSession, error: completeError } = await supabase
        .from('daily_sessions')
        .update({
          status: 'complete',
          exercise_id: exerciseRecord.id,
          journal_entry_id: journalRecord.id,
          session_data: finalSessionData,
          completed_at: new Date().toISOString()
        })
        .eq('id', activeSession.id)
        .eq('user_id', authUser.userId)
        .select()
        .single();

      if (completeError) {
        console.error('Failed to update session to complete:', completeError);
        // Attempt cleanup of created items
        await supabase.from('exercises').delete().eq('id', exerciseRecord.id).eq('user_id', authUser.userId);
        await supabase.from('entries').delete().eq('id', journalRecord.id).eq('user_id', authUser.userId);

        return NextResponse.json(
          { error: { code: 'DATABASE_ERROR', message: 'Failed to finalize session completion.' } },
          { status: 500 }
        );
      }

      // 4. Trigger asynchronous background processing for AI pipeline

      if (journalRecord) {
        triggerAIProcessing(journalRecord.id, authUser.userId);
        // Check and trigger weekly / monthly milestone summaries
        void checkWeeklyAndMonthlySummary(authUser.userId, cycleId, cycleDay).catch(err => {
          console.error('[Session Complete] Weekly/monthly check error:', err);
        });

        // Synchronize cycle entries count in database
        if (cycleId) {
          import('../../../lib/cycles/cycleSync')
            .then(m => m.CycleSync.syncCycleEntriesCount(cycleId, authUser.userId))
            .catch(err => console.error('[Session Complete] CycleSync error:', err));
        }
      }

      return NextResponse.json({
        success: true,
        session: completedSession,
        exercise: formattedExercise,
        journal: journalRecord
      });
    }

    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid action type.' } },
      { status: 400 }
    );

  } catch (error: any) {
    if (error instanceof AccessDeniedError || error.code === 'SUBSCRIPTION_REQUIRED' || error.code === 'SELF_HELP_SUBSCRIPTION_REQUIRED') {
      return NextResponse.json(
        {
          error: {
            code: 'SELF_HELP_SUBSCRIPTION_REQUIRED',
            message: error.message || 'An active self-help subscription is required to perform daily sessions.',
            state: error.state || 'DORMANT'
          }
        },
        { status: error.statusCode || 403 }
      );
    }

    console.error('Session POST Route Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
