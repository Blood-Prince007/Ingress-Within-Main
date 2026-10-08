import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const cycleId = params.id;
    
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const userId = authUser.userId;

    if (!cycleId) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing cycle ID.' } },
        { status: 400 }
      );
    }

    // 1. Fetch the specific cycle
    const { data: cy, error: cycleErr } = await supabase
      .from('cycles')
      .select('*')
      .eq('id', cycleId)
      .eq('user_id', userId)
      .maybeSingle();

    if (cycleErr) {
      console.error(`Error fetching cycle ${cycleId}:`, cycleErr.message);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve cycle details.' } },
        { status: 500 }
      );
    }

    if (!cy) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Cycle not found.' } },
        { status: 404 }
      );
    }

    // 2. Fetch entries for this cycle
    let { data: entries, error: entriesErr } = await supabase
      .from('entries')
      .select('*, reflections(*)')
      .eq('cycle_id', cy.id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (entriesErr) {
      console.warn(`[API Cycle Details] Join select failed for cycle ${cy.id}, falling back to simple select:`, entriesErr.message);
      const { data: simpleEntries, error: simpleErr } = await supabase
        .from('entries')
        .select('*')
        .eq('cycle_id', cy.id)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (!simpleErr && simpleEntries) {
        entries = simpleEntries;
      }
    }

    // 3. Count weekly summaries
    const { count: summaryCount } = await supabase
      .from('weekly_summaries')
      .select('id', { count: 'exact', head: true })
      .eq('cycle_id', cy.id)
      .eq('user_id', userId);

    // 4. Count active open threads
    const { count: threadCount } = await supabase
      .from('threads')
      .select('id', { count: 'exact', head: true })
      .eq('cycle_id', cy.id)
      .eq('user_id', userId)
      .eq('status', 'Open');

    // 5. Fetch and count distinct vocabulary words
    const { data: vocabRes } = await supabase
      .from('vocab_words')
      .select('word')
      .eq('user_id', userId)
      .eq('cycle_id', cy.id)
      .gte('frequency', 2);

    const distinctWords = new Set((vocabRes || []).map((v: any) => v.word.toLowerCase()));
    const vocabCount = distinctWords.size;

    // 6. Calculate progress percentage
    let activeDay = cy.current_day || 1;
    const isCycleActive = cy.status?.toUpperCase() === 'ACTIVE' || cy.status?.toUpperCase() === 'ARCHIVED';
    if (isCycleActive && cy.start_date && !cy.end_date) {
      const clientDateStr = request.headers.get('x-client-date');
      let todayMidnight: Date;
      if (clientDateStr) {
        todayMidnight = new Date(clientDateStr + 'T00:00:00Z');
      } else {
        const today = new Date();
        todayMidnight = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      }

      const startDateStr = cy.start_date.split('T')[0];
      const startMidnight = new Date(startDateStr + 'T00:00:00Z');
      const diffTime = todayMidnight.getTime() - startMidnight.getTime();
      const calculatedDay = Math.floor(diffTime / (24 * 60 * 60 * 1000)) + 1;
      activeDay = Math.min(cy.total_days || 30, Math.max(cy.current_day || 1, calculatedDay));
    }
    const progressPercentage = Math.round((activeDay / (cy.total_days || 30)) * 100);

    // Formatted entries list
    const formattedEntries = (entries || []).map((entry: any) => {
      const rawReflection = entry.reflections;
      const reflection = Array.isArray(rawReflection)
        ? (rawReflection[0] || null)
        : (rawReflection || null);

      let reflectionStatus = 'None';
      if (reflection) {
        if (reflection.status === 'completed') reflectionStatus = 'Completed';
        else if (reflection.status === 'ready') reflectionStatus = 'Pending Response';
        else reflectionStatus = reflection.status || 'Ready';
      }

      return {
        id: entry.id,
        content: entry.content,
        cycle_day: entry.cycle_day,
        entry_type: entry.entry_type || 'free_write',
        word_count: entry.word_count || 0,
        created_at: entry.created_at,
        crisis_flag: entry.crisis_flag || false,
        crisis_type: entry.crisis_type || null,
        reflectionStatus,
        reflectionId: reflection?.id || null,
        reflectionText: reflection?.reflection_text || null,
        closingQuestion: reflection?.closing_question || null,
        reflectionAnswer: reflection?.reflection_answer || null
      };
    });

    return NextResponse.json({
      success: true,
      cycle: {
        id: cy.id,
        cycle_number: cy.cycle_number !== undefined ? cy.cycle_number : cy.number,
        status: cy.status,
        current_day: activeDay,
        total_days: cy.total_days || 30,
        progress_percentage: Math.min(100, progressPercentage),
        entries_count: formattedEntries.length,
        open_threads_count: threadCount || 0,
        weekly_summaries_count: summaryCount || 0,
        vocabulary_count: vocabCount,
        start_date: cy.start_date || cy.started_at,
        end_date: cy.end_date || cy.ended_at,
        assessment_completed: cy.assessment_completed,
        assessment_available: cy.assessment_available,
        entries: formattedEntries
      }
    });

  } catch (error: any) {
    console.error(`[API Cycle Details] Error:`, error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
