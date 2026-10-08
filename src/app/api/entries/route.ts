import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/db';
import { getAuthenticatedUser } from '../../../lib/auth-helper';
import { triggerAIProcessing, checkWeeklyAndMonthlySummary } from '../../../lib/queue/triggers';
import { AccessControlService, AccessDeniedError } from '../../../lib/billing/accessControlService';

/**
 * GET /api/entries: Fetches all journal entries for the user from Supabase.
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

    const search = request.nextUrl.searchParams.get('search');
    const cycleId = request.nextUrl.searchParams.get('cycleId');
    const classification = request.nextUrl.searchParams.get('classification');
    const isCrisis = request.nextUrl.searchParams.get('isCrisis');
    const startDate = request.nextUrl.searchParams.get('startDate');
    const endDate = request.nextUrl.searchParams.get('endDate');
    const limit = request.nextUrl.searchParams.get('limit');
    const offset = request.nextUrl.searchParams.get('offset');

    let query;
    let fallbackQuery;

    if (classification) {
      query = supabase
        .from('entries')
        .select('*, reflections!inner(*), daily_sessions!fk_daily_sessions_entry(day_number), cycles(*)')
        .eq('user_id', authUser.userId)
        .eq('reflections.classification', classification);

      fallbackQuery = supabase
        .from('entries')
        .select('*, reflections!inner(*), cycles(*)')
        .eq('user_id', authUser.userId)
        .eq('reflections.classification', classification);
    } else {
      query = supabase
        .from('entries')
        .select('*, reflections(*), daily_sessions!fk_daily_sessions_entry(day_number), cycles(*)')
        .eq('user_id', authUser.userId);

      fallbackQuery = supabase
        .from('entries')
        .select('*, reflections(*), cycles(*)')
        .eq('user_id', authUser.userId);
    }

    if (search) {
      query = query.ilike('content', `%${search}%`);
      fallbackQuery = fallbackQuery.ilike('content', `%${search}%`);
    }
    if (cycleId) {
      query = query.eq('cycle_id', cycleId);
      fallbackQuery = fallbackQuery.eq('cycle_id', cycleId);
    }
    if (isCrisis) {
      query = query.eq('crisis_flag', isCrisis === 'true');
      fallbackQuery = fallbackQuery.eq('crisis_flag', isCrisis === 'true');
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
      fallbackQuery = fallbackQuery.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
      fallbackQuery = fallbackQuery.lte('created_at', endDate);
    }

    query = query.order('created_at', { ascending: false });
    fallbackQuery = fallbackQuery.order('created_at', { ascending: false });

    if (limit) {
      const parsedLimit = parseInt(limit);
      if (!isNaN(parsedLimit)) {
        query = query.limit(parsedLimit);
        fallbackQuery = fallbackQuery.limit(parsedLimit);
      }
    }
    if (offset) {
      const parsedOffset = parseInt(offset);
      if (!isNaN(parsedOffset)) {
        const parsedLimit = limit ? parseInt(limit) : 20;
        const from = parsedOffset;
        const to = from + (parsedLimit - 1);
        query = query.range(from, to);
        fallbackQuery = fallbackQuery.range(from, to);
      }
    }

    let { data: entries, error } = await query;

    // Fallback if the database schema has relational join ambiguity
    if (error && (error.code === 'PGRST201' || error.code === 'PGRST200' || error.message.includes('relationship') || error.message.includes('column'))) {
      console.warn('[api/entries] Join query failed, falling back to simple select (schema may need migration):', error.message);
      const { data: simpleEntries, error: simpleError } = await fallbackQuery;
        
      if (simpleError) {
        console.error('Failed to fetch journal entries on fallback:', simpleError);
        return NextResponse.json(
          { error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve journal entries.' } },
          { status: 500 }
        );
      }
      entries = simpleEntries;
    } else if (error) {
      console.error('Failed to fetch journal entries:', error);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve journal entries.' } },
        { status: 500 }
      );
    }

    // Auto-heal/backfill missing reflections for real entries in the background
    if (entries && entries.length > 0) {
      const realEntriesWithoutReflection = entries.filter(e => 
        e.entry_type !== 'empty' && 
        (!e.reflections || (Array.isArray(e.reflections) && e.reflections.length === 0))
      );
      
      if (realEntriesWithoutReflection.length > 0) {
        console.log(`[API Entries GET] Found ${realEntriesWithoutReflection.length} entries missing reflections for user ${authUser.userId}. Triggering fast background backfill...`);
        const { processReflectionGeneration } = await import('../../../lib/queue/workers/reflectionWorker');
        // Run in background (fire-and-forget) using fast local fallback
        realEntriesWithoutReflection.forEach(entry => {
          void processReflectionGeneration({
            entry_id: entry.id,
            user_id: authUser.userId,
            bypass_ai: true
          }).catch(err => {
            console.error(`[API Entries GET] Background reflection generation failed for entry ${entry.id}:`, err);
          });
        });
      }
    }

    // Fetch entry-specific vocab words from extractions
    let vocabRes: any[] = [];
    const { data: extRes, error: extErr } = await supabase
      .from('vocab_extractions')
      .select('entry_id, word')
      .eq('user_id', authUser.userId);
      
    if (!extErr && extRes) {
      vocabRes = extRes;
    } else {
      console.warn('[api/entries] Failed to fetch vocab_extractions, falling back to vocab_words:', extErr?.message);
      const { data: wordsRes } = await supabase
        .from('vocab_words')
        .select('word, entry_ids')
        .eq('user_id', authUser.userId);
      
      vocabRes = (wordsRes || []).flatMap((v: any) => {
        if (v.entry_ids && Array.isArray(v.entry_ids)) {
          return v.entry_ids.map((id: string) => ({ entry_id: id, word: v.word }));
        }
        return [];
      });
    }


    const formattedEntries = (entries || []).map((entry: any) => {
      // Normalize reflections (can be array or single object depending on PostgREST cardinality detection)
      const rawReflection = entry.reflections;
      const reflection = Array.isArray(rawReflection)
        ? (rawReflection[0] || null)
        : (rawReflection || null);
      delete entry.reflections;

      // Normalize daily_sessions (can be array or single object)
      const rawSession = entry.daily_sessions;
      const session = Array.isArray(rawSession)
        ? (rawSession[0] || null)
        : (rawSession || null);
      entry.daily_sessions = session;

      // Normalize cycles (can be array or single object)
      const rawCycle = entry.cycles;
      const cycle = Array.isArray(rawCycle)
        ? (rawCycle[0] || null)
        : (rawCycle || null);
      
      const cycleNum = cycle 
        ? (cycle.cycle_number !== undefined ? cycle.cycle_number : cycle.number)
        : null;
      delete entry.cycles;

      const entryVocab = vocabRes
        ? vocabRes.filter((v: any) => v.entry_id === entry.id).map((v: any) => v.word)
        : [];

      let reflectionStatus = 'None';
      if (reflection) {
        if (reflection.status === 'completed') reflectionStatus = 'Completed';
        else if (reflection.status === 'ready') reflectionStatus = 'Pending Response';
        else if (reflection.status === 'failed') reflectionStatus = 'Failed';
        else if (reflection.status === 'pending') reflectionStatus = 'Processing AI...';
        else reflectionStatus = reflection.status || 'Ready';
      }

      return {
        ...entry,
        cycle_number: cycleNum,
        entry_mode: entry.entry_mode || 'free',
        reflectionStatus,
        reflection: reflection ? {
          ...reflection,
          vocabulary: entryVocab
        } : null
      };
    });

    return NextResponse.json({
      success: true,
      entries: formattedEntries
    });

  } catch (error) {
    console.error('Entries GET Route Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/entries: Saves a new free-form journal entry in Supabase.
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

    // Access control: Ensure user is TRIAL, ACTIVE, PAST_DUE, or CANCELLED_PENDING (not DORMANT)
    await AccessControlService.requireSelfHelpWriteAccess(authUser.userId);

    const body = await request.json().catch(() => ({}));
    const { content, entry_mode, started_at, completed_at, completion_time, resume_count } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Journal entry content cannot be empty.' } },
        { status: 400 }
      );
    }

    // Daily limit validation: Check if they have already written today
    const clientTodayStart = request.headers.get('x-client-today-start');
    const fallbackStart = new Date();
    fallbackStart.setUTCHours(0, 0, 0, 0);
    const startRange = clientTodayStart || fallbackStart.toISOString();

    const { data: existingEntries, error: checkError } = await supabase
      .from('entries')
      .select('id')
      .eq('user_id', authUser.userId)
      .gte('created_at', startRange)
      .limit(1);

    if (checkError) {
      console.error('Failed to check existing entries for daily limit:', checkError);
    } else if (existingEntries && existingEntries.length > 0) {
      return NextResponse.json(
        { error: { code: 'LIMIT_EXCEEDED', message: 'You have already completed your writing for today. The limit resets at midnight.' } },
        { status: 400 }
      );
    }

    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

    // Gating check: Block new entries if the latest cycle is completed but assessment is pending
    const { data: latestCycle } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', authUser.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestCycle && (latestCycle.status === 'COMPLETED' || latestCycle.status === 'complete') && !latestCycle.assessment_completed) {
      return NextResponse.json(
        { error: { code: 'ASSESSMENT_REQUIRED', message: 'You must complete your cycle assessment before writing new entries.' } },
        { status: 400 }
      );
    }

    // Fetch the active cycle for the user to populate cycle_id and cycle_day
    const { data: activeCycle } = await supabase
      .from('cycles')
      .select('id, start_date, total_days')
      .eq('user_id', authUser.userId)
      .in('status', ['ACTIVE', 'active'])
      .maybeSingle();

    let cycleId = activeCycle?.id || null;
    let cycleDay = 1;
    
    const clientDateStr = request.headers.get('x-client-date');
    let todayMidnight: Date;
    if (clientDateStr) {
      todayMidnight = new Date(clientDateStr + 'T00:00:00Z');
    } else {
      const today = new Date();
      todayMidnight = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    }

    if (activeCycle) {
      const startDateStr = (activeCycle.start_date || '').split('T')[0];
      const startMidnight = new Date(startDateStr + 'T00:00:00Z');
      const diffTime = todayMidnight.getTime() - startMidnight.getTime();
      const calculatedDay = Math.floor(diffTime / (24 * 60 * 60 * 1000)) + 1;
      cycleDay = Math.min(activeCycle.total_days || 30, Math.max(1, calculatedDay));
    } else {
      // Fallback: Fetch the most recent cycle (could be COMPLETED or ARCHIVED)
      const { data: mostRecentCycle } = await supabase
        .from('cycles')
        .select('id, start_date, total_days')
        .eq('user_id', authUser.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (mostRecentCycle) {
        cycleId = mostRecentCycle.id;
        const startDateStr = (mostRecentCycle.start_date || '').split('T')[0];
        const startMidnight = new Date(startDateStr + 'T00:00:00Z');
        const diffTime = todayMidnight.getTime() - startMidnight.getTime();
        const calculatedDay = Math.floor(diffTime / (24 * 60 * 60 * 1000)) + 1;
        cycleDay = Math.min(mostRecentCycle.total_days || 30, Math.max(1, calculatedDay));
      }
    }

    const insertPayload: any = {
      user_id: authUser.userId,
      content: content.trim(),
      new_entry_text_encrypted: content.trim(), // for future AI workflow compatibility
      entry_type: 'new_only',
      entry_mode: (entry_mode === 'guided' ? 'guided' : 'free'),
      started_at: started_at || new Date().toISOString(),
      completed_at: completed_at || new Date().toISOString(),
      completion_time: completion_time || null,
      resume_count: resume_count || 0,
      word_count: wordCount,
      session_id: null,
      cycle_id: cycleId,
      cycle_day: cycleDay,
      written_at: new Date().toISOString()
    };

    let { data: newEntry, error } = await supabase
      .from('entries')
      .insert(insertPayload)
      .select()
      .single();

    // Fallback if the database schema is not fully migrated (missing new columns)
    if (error && (error.message.includes('column') || error.code === 'PGRST200' || error.code === '42703')) {
      console.warn('[api/entries] Insert failed with cycle/encryption columns, retrying with basic columns...');
      const fallbackPayload = {
        user_id: authUser.userId,
        content: content.trim(),
        word_count: wordCount,
        session_id: null
      };
      const { data: fallbackEntry, error: fallbackError } = await supabase
        .from('entries')
        .insert(fallbackPayload)
        .select()
        .single();
        
      if (fallbackError) {
        console.error('Failed to insert journal entry on fallback:', fallbackError);
        return NextResponse.json(
          { error: { code: 'DATABASE_ERROR', message: 'Failed to save journal entry.' } },
          { status: 500 }
        );
      }
      newEntry = fallbackEntry;
    } else if (error) {
      console.error('Failed to insert journal entry:', error);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to save journal entry.' } },
        { status: 500 }
      );
    }

    let reflectionRecord: any = null;
    if (newEntry) {
      // 1. Run crisis detection and reflection generation synchronously to return it instantly!
      try {
        console.log(`[API Entries POST] Running crisis detection synchronously for entry ${newEntry.id}...`);
        const { processCrisisDetection } = await import('../../../lib/queue/workers/crisisDetectionWorker');
        await processCrisisDetection({ entry_id: newEntry.id, user_id: authUser.userId });

        console.log(`[API Entries POST] Running reflection generation synchronously for entry ${newEntry.id}...`);
        const { processReflectionGeneration } = await import('../../../lib/queue/workers/reflectionWorker');
        await processReflectionGeneration({ entry_id: newEntry.id, user_id: authUser.userId });

        // Retrieve the updated entry with crisis_flag and generated reflection
        const { data: updatedEntry } = await supabase
          .from('entries')
          .select('*')
          .eq('id', newEntry.id)
          .single();

        const { data: dbReflection } = await supabase
          .from('reflections')
          .select('*')
          .eq('entry_id', newEntry.id)
          .maybeSingle();

        reflectionRecord = dbReflection;

        // If for any reason dbReflection is missing or status is pending, run fallback generation directly!
        if (!reflectionRecord || reflectionRecord.status === 'pending' || reflectionRecord.reflection_text?.includes('Processing')) {
          console.warn(`[API Entries POST] Reflection is missing or pending. Creating instant fallback reflection.`);
          const { generateLocalFallbackReflection } = await import('../../../lib/queue/workers/reflectionWorker');
          const fallback = generateLocalFallbackReflection(content.trim(), newEntry.day_ei || null, newEntry.day_sa || null);
          const fullFallbackText = `${fallback.reflection.trim()}\n\n${(fallback.closing_nudge || 'Be gentle with yourself.').trim()}`;
          
          const fallbackPayload: any = {
            entry_id: newEntry.id,
            user_id: authUser.userId,
            cycle_id: newEntry.cycle_id,
            reflection_text: fullFallbackText,
            closing_question: fallback.closing_question,
            classification: fallback.classification,
            provider: 'local-fallback',
            confidence: 'high',
            themes: fallback.themes || [],
            status: 'ready',
            generated_at: new Date().toISOString()
          };

          const { data: savedFallback } = await supabase
            .from('reflections')
            .upsert(fallbackPayload, { onConflict: 'entry_id' })
            .select('*')
            .maybeSingle();

          reflectionRecord = savedFallback || fallbackPayload;
        }

        return NextResponse.json({
          success: true,
          entry: {
            ...(updatedEntry || newEntry),
            reflection: reflectionRecord
          }
        });
      } catch (err: any) {
        console.error(`[API Entries POST] Synchronous AI generation failed:`, err.message);
      }

      // 2. Trigger other background AI tasks (scoring, vocabulary, metadata)
      void triggerAIProcessing(newEntry.id, authUser.userId).catch(err => {
        console.error('[API Entries POST] Background trigger error:', err);
      });

      // 3. Check and trigger weekly / monthly milestone summaries
      void checkWeeklyAndMonthlySummary(authUser.userId, cycleId, cycleDay).catch(err => {
        console.error('[API Entries POST] Weekly/monthly check error:', err);
      });

      // 4. Synchronize cycle entries count in database
      if (newEntry.cycle_id) {
        import('../../../lib/cycles/cycleSync')
          .then(m => m.CycleSync.syncCycleEntriesCount(newEntry.cycle_id, authUser.userId))
          .catch(err => console.error('[API Entries POST] CycleSync error:', err));
      }
    }

    return NextResponse.json({
      success: true,
      entry: {
        ...newEntry,
        reflection: reflectionRecord
      }
    });

  } catch (error: any) {
    if (error instanceof AccessDeniedError || error.code === 'SUBSCRIPTION_REQUIRED' || error.code === 'SELF_HELP_SUBSCRIPTION_REQUIRED') {
      return NextResponse.json(
        {
          error: {
            code: 'SELF_HELP_SUBSCRIPTION_REQUIRED',
            message: error.message || 'An active self-help subscription is required to continue.',
            state: error.state || 'DORMANT'
          }
        },
        { status: error.statusCode || 403 }
      );
    }

    console.error('Entries POST Route Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
