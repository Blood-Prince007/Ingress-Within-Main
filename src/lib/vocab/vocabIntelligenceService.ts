import { supabase } from '../db';

export interface VocabularySnapshotData {
  entry_count: number;
  words: {
    word: string;
    normalized_word: string;
    frequency: number;
    first_seen: string;
    last_seen: string;
    semantic_meaning: string;
    context: string;
    confidence: number;
    entry_ids: string[];
  }[];
  most_used: { word: string; normalized_word: string; frequency: number }[];
  new_words: string[];
  dropped_words: string[];
  clusters: {
    cluster_name: string;
    description: string;
    confidence: number;
    words: string[];
  }[];
}

export class VocabularyIntelligenceService {
  /**
   * Fetches vocabulary analytics for the user's overall state (all-time).
   * Reads exclusively from database snapshots.
   */
  static async getVocabularyOverview(userId: string, forceAudit = false): Promise<any> {
    console.log(`[Vocab Intelligence] Fetching overview for user ${userId}...`);

    // 1. Fetch all cycle snapshots ordered by generated_at ascending
    const { data: dbSnaps, error: snapsErr } = await supabase
      .from('vocab_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: true });

    if (snapsErr) throw snapsErr;

    // Filter out dummy or completed indicator snapshots
    const snapshots = (dbSnaps || []).filter(s => s.cycle_id !== '00000000-0000-0000-0000-000000000000' && s.cycle_id !== '11111111-1111-1111-1111-111111111111');

    if (snapshots.length === 0) {
      // Dynamically extract real vocabulary from user's actual journal entries
      const { data: userEntries, count: entryCount } = await supabase
        .from('entries')
        .select('id, content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!userEntries || userEntries.length === 0) {
        return {
          isAvailable: false,
          stats: { entriesCount: 0, distinctWordCount: 0, mostUsedWord: 'none', mostUsedFrequency: 0, currentCycleWordsCount: 0 },
          mostUsed: [],
          timeline: [],
          clusters: [],
          allWords: { frequent: [], occasional: [], usedOnce: [] },
          shiftSignals: { last: [], six: [], all: [] }
        };
      }

      // Filter stop words to extract meaningful emotional/expressive vocabulary
      const stopWords = new Set([
        'the','be','to','of','and','a','in','that','have','i','it','for','not','on','with','he','as','you','do','at','this','but','his','by','from','they','we','say','her','she','or','an','will','my','one','all','would','there','their','what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time','no','just','him','know','take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well','way','even','new','want','because','any','these','give','day','most','us','is','am','are','was','were','been','being','has','had','having','did','doing','feel','feeling','felt','really','very','thing','things','something','going','got'
      ]);

      const wordCounts = new Map<string, { word: string; count: number; entryIds: Set<string> }>();

      for (const entry of userEntries) {
        if (!entry.content) continue;
        const words = entry.content.toLowerCase().replace(/[^a-z0-9'\s-]/g, ' ').split(/\s+/).filter(Boolean);
        for (const rawW of words) {
          const w = rawW.trim();
          if (w.length <= 2 || stopWords.has(w) || /^\d+$/.test(w)) continue;
          if (!wordCounts.has(w)) {
            wordCounts.set(w, { word: w, count: 0, entryIds: new Set() });
          }
          const item = wordCounts.get(w)!;
          item.count += 1;
          item.entryIds.add(entry.id);
        }
      }

      const sorted = Array.from(wordCounts.values()).sort((a, b) => b.count - a.count);
      const mostUsed = sorted.slice(0, 5).map(s => ({
        word: s.word,
        normalized_word: s.word,
        frequency: s.count
      }));

      const topConcepts = sorted.slice(0, 3).map(s => ({
        concept: s.word.charAt(0).toUpperCase() + s.word.slice(1)
      }));

      const topWordsSummary = sorted.slice(0, 2).map(s => s.word).join(' & ');

      return {
        isAvailable: sorted.length > 0,
        stats: {
          entriesCount: entryCount || userEntries.length,
          distinctWordCount: sorted.length,
          mostUsedWord: mostUsed[0]?.word || 'none',
          mostUsedFrequency: mostUsed[0]?.frequency || 0,
          currentCycleWordsCount: sorted.length
        },
        mostUsed,
        concepts: topConcepts,
        clusters: sorted.length > 0 ? [{ cluster_name: topWordsSummary || 'Reflection' }] : [],
        timeline: [],
        allWords: {
          frequent: sorted.filter(s => s.count >= 3).map(s => ({ word: s.word, normalized_word: s.word, frequency: s.count })),
          occasional: sorted.filter(s => s.count === 2).map(s => ({ word: s.word, normalized_word: s.word, frequency: s.count })),
          usedOnce: sorted.filter(s => s.count === 1).map(s => ({ word: s.word, normalized_word: s.word, frequency: s.count }))
        },
        shiftSignals: { last: [], six: [], all: [] }
      };
    }

    // 2. Aggregate all word groups in memory from cycle snapshots
    const wordGroups = new Map<string, any>();
    let totalEntriesCount = 0;

    snapshots.forEach(snap => {
      const data = snap.snapshot_data as VocabularySnapshotData;
      if (!data) return;

      totalEntriesCount += data.entry_count || 0;
      const cyWords = data.words || [];

      cyWords.forEach(w => {
        const norm = w.normalized_word.toLowerCase().trim();
        if (!wordGroups.has(norm)) {
          wordGroups.set(norm, {
            word: w.word,
            normalized_word: norm,
            frequency: 0,
            first_seen: w.first_seen || snap.generated_at,
            last_seen: w.last_seen || snap.generated_at,
            semantic_meaning: w.semantic_meaning,
            context: w.context,
            confidence: w.confidence || 1.0,
            entry_ids: [],
            audit_trail: []
          });
        }

        const group = wordGroups.get(norm);
        group.frequency += w.frequency || 0;
        
        (w.entry_ids || []).forEach(id => {
          if (!group.entry_ids.includes(id)) {
            group.entry_ids.push(id);
          }
        });

        // Track first/last seen
        const groupFirstTime = new Date(group.first_seen).getTime();
        const wFirstTime = new Date(w.first_seen || snap.generated_at).getTime();
        if (wFirstTime < groupFirstTime) {
          group.first_seen = w.first_seen || snap.generated_at;
        }

        const groupLastTime = new Date(group.last_seen).getTime();
        const wLastTime = new Date(w.last_seen || snap.generated_at).getTime();
        if (wLastTime >= groupLastTime) {
          group.last_seen = w.last_seen || snap.generated_at;
          group.word = w.word;
          group.context = w.context;
          group.semantic_meaning = w.semantic_meaning || group.semantic_meaning;
        }
      });
    });

    const allWordsList = Array.from(wordGroups.values());
    const distinctWordCount = allWordsList.length;

    // Sort by frequency descending
    const sortedWords = [...allWordsList].sort((a, b) => b.frequency - a.frequency);
    const mostUsedWord = sortedWords[0]?.normalized_word || 'none';
    const mostUsedFrequency = sortedWords[0]?.frequency || 0;

    // Build discovery timeline
    const timelineSorted = [...allWordsList].sort((a, b) => new Date(a.first_seen).getTime() - new Date(b.first_seen).getTime());
    const timeline = timelineSorted.map((w, idx) => ({
      date: w.first_seen,
      count: idx + 1
    }));

    // Group into tiers
    const frequent = sortedWords.filter(w => w.frequency >= 5).map(w => ({ word: w.word, normalized_word: w.normalized_word, count: w.frequency }));
    const occasional = sortedWords.filter(w => w.frequency >= 2 && w.frequency < 5).map(w => ({ word: w.word, normalized_word: w.normalized_word, count: w.frequency }));
    const usedOnce = sortedWords.filter(w => w.frequency === 1).map(w => ({ word: w.word, normalized_word: w.normalized_word, count: w.frequency }));

    // Get clusters from the latest snapshot
    const latestSnap = snapshots[snapshots.length - 1];
    const latestData = latestSnap.snapshot_data as VocabularySnapshotData;
    const clusters = latestData?.clusters || [];

    // Compute shifts using pre-compiled snapshot aggregates
    const shiftSignals = await this.computeShiftSignalsFromSnapshots(snapshots);

    const result: any = {
      isAvailable: true,
      stats: {
        entriesCount: totalEntriesCount,
        distinctWordCount,
        mostUsedWord,
        mostUsedFrequency
      },
      mostUsed: sortedWords.slice(0, 10).map(w => ({
        word: w.word,
        normalized_word: w.normalized_word,
        frequency: w.frequency,
        first_seen: w.first_seen,
        last_seen: w.last_seen,
        semantic_meaning: w.semantic_meaning,
        context: w.context,
        confidence: w.confidence
      })),
      timeline,
      clusters,
      allWords: { frequent, occasional, usedOnce },
      shiftSignals
    };

    if (forceAudit) {
      result.currentCycleWords = sortedWords.map(w => ({
        word: w.word,
        normalized_word: w.normalized_word,
        frequency: w.frequency,
        first_seen: w.first_seen,
        last_seen: w.last_seen,
        semantic_meaning: w.semantic_meaning,
        context: w.context,
        confidence: w.confidence,
        entry_ids: w.entry_ids
      }));
    }

    return result;
  }

  /**
   * Fetches vocabulary analytics grouped by cycle.
   * Reads exclusively from database snapshots.
   */
  static async getVocabularyByCycle(userId: string): Promise<any[]> {
    console.log(`[Vocab Intelligence] Fetching by-cycle breakdown for user ${userId}...`);

    // 1. Fetch user cycles ordered chronologically
    const { data: cycles, error: cyclesErr } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', userId)
      .order('cycle_number', { ascending: true });

    if (cyclesErr) throw cyclesErr;

    // 2. Fetch all snapshots
    const { data: dbSnaps, error: snapsErr } = await supabase
      .from('vocab_snapshots')
      .select('*')
      .eq('user_id', userId);

    if (snapsErr) throw snapsErr;

    const snapMap = new Map<string, any>();
    dbSnaps?.forEach(s => snapMap.set(s.cycle_id, s));

    // Sort chronologically ascending to establish sequence
    const sortedCycles = [...(cycles || [])].sort((a: any, b: any) => {
      const numA = typeof a.cycle_number === 'number' ? a.cycle_number : (typeof a.number === 'number' ? a.number : 0);
      const numB = typeof b.cycle_number === 'number' ? b.cycle_number : (typeof b.number === 'number' ? b.number : 0);
      if (numA !== numB) return numA - numB;
      const dateA = new Date(a.start_date || a.started_at || a.created_at || 0).getTime();
      const dateB = new Date(b.start_date || b.started_at || b.created_at || 0).getTime();
      return dateA - dateB;
    });

    const maxCycleNum = sortedCycles.length > 0
      ? Math.max(...sortedCycles.map((c: any) => (typeof c.cycle_number === 'number' ? c.cycle_number : (typeof c.number === 'number' ? c.number : 0))))
      : 0;

    const cycleBreakdowns: any[] = [];

    sortedCycles.forEach((cy: any, index: number) => {
      const cyId = cy.id;
      const snap = snapMap.get(cyId);
      const cyNum = cy.cycle_number !== undefined ? cy.cycle_number : (cy.number !== undefined ? cy.number : index + 1);
      const statusUpper = (cy.status || '').toUpperCase();
      const isLatest = cyNum === maxCycleNum || index === sortedCycles.length - 1;

      // Determine active/current status authoritatively
      const isActive = statusUpper === 'ACTIVE' || (!statusUpper && isLatest) || (isLatest && statusUpper !== 'COMPLETED' && !cy.end_date && !cy.ended_at);
      const isCompleted = !isActive;

      // For completed cycles with missing end date, fallback to start date of subsequent cycle
      const nextCycle = sortedCycles[index + 1];
      const nextCycleStartDate = nextCycle ? (nextCycle.start_date || nextCycle.started_at) : null;
      const endedAt = isActive ? null : (cy.end_date || cy.ended_at || nextCycleStartDate || null);

      const commonFields = {
        id: cyId,
        number: cyNum,
        status: isActive ? 'ACTIVE' : (cy.status || 'COMPLETED'),
        started_at: cy.start_date || cy.started_at,
        ended_at: endedAt,
        is_current: isActive,
        is_active: isActive,
        is_locked: isCompleted,
      };

      if (snap) {
        const data = snap.snapshot_data as VocabularySnapshotData;
        cycleBreakdowns.push({
          ...commonFields,
          entry_count: data.entry_count || 0,
          most_used: data.most_used || [],
          new_words: data.new_words || [],
          dropped_words: data.dropped_words || [],
          clusters: data.clusters || []
        });
      } else {
        // Safe fallback payload for cycles with no snapshot yet
        cycleBreakdowns.push({
          ...commonFields,
          entry_count: 0,
          most_used: [],
          new_words: [],
          dropped_words: [],
          clusters: []
        });
      }
    });

    // Return newest cycles first (descending order)
    return cycleBreakdowns.reverse();
  }

  /**
   * Generates or fetches clusters for a cycle. Called strictly in the background worker.
   */
  static async backgroundGenerateClusters(
    userId: string,
    cycleId: string,
    sortedWords: any[]
  ): Promise<any[]> {
    const currentTop3Words = sortedWords.slice(0, 3).map(w => w.normalized_word);
    if (currentTop3Words.length === 0) return [];

    console.log(`[Vocab Clusters] Generating AI word clusters for top words: ${currentTop3Words.join(', ')}`);
    const startTime = Date.now();
    try {
      const { aiProvider } = await import('../ai/factory');
      const wordsToGenerate = sortedWords.slice(0, 3).map(w => ({
        word: w.word,
        normalized_word: w.normalized_word,
        frequency: w.frequency,
        semantic_meaning: w.semantic_meaning || 'Recurring emotional theme'
      }));

      const aiResponse = await aiProvider.groupClusters(wordsToGenerate);
      const generatedClusters = aiResponse?.clusters || [];

      const actualProvider = (aiProvider as any).lastProviderUsed || process.env.AI_PROVIDER || 'claude';
      const fallbackUsed = (aiProvider as any).lastFallbackUsed || false;
      const primaryProvider = (aiProvider as any).lastPrimaryProvider || 'claude';

      // Validate clusters before persisting
      const validatedClusters: any[] = [];
      for (const cl of generatedClusters) {
        if (!cl || typeof cl !== 'object') continue;
        const clusterName = (cl.cluster_name || '').trim();
        const description = (cl.description || '').trim();
        const clusterWords = Array.isArray(cl.words) ? cl.words.map((w: any) => String(w).trim()).filter(Boolean) : [];
        const confidence = typeof cl.confidence === 'number' ? Math.max(0, Math.min(1, cl.confidence)) : 0.9;

        if (!clusterName || !description || clusterWords.length === 0) {
          console.warn(`[Vocab Clusters] Skipping invalid cluster:`, cl);
          continue;
        }

        validatedClusters.push({
          cluster_name: clusterName,
          description,
          confidence,
          words: clusterWords
        });
      }

      // Fail safe: If no valid clusters generated, do not delete existing clusters
      if (validatedClusters.length === 0) {
        console.warn(`[Vocab Clusters] No valid clusters produced by AI. Keeping existing clusters intact.`);
        return [];
      }

      // Save to vocab_clusters cache table (atomic replace for this cycle)
      await supabase
        .from('vocab_clusters')
        .delete()
        .eq('user_id', userId)
        .eq('cycle_id', cycleId);

      const savedClusters: any[] = [];
      for (const cl of validatedClusters) {
        await supabase
          .from('vocab_clusters')
          .insert({
            user_id: userId,
            cycle_id: cycleId,
            cluster_name: cl.cluster_name,
            cluster_type: 'emotional',
            words: cl.words,
            description: cl.description,
            confidence: cl.confidence,
            word_count: cl.words.length
          });

        savedClusters.push({
          cluster_name: cl.cluster_name,
          description: cl.description,
          confidence: cl.confidence,
          words: cl.words
        });
      }

      // Log observability
      try {
        await supabase.from('ai_observability').insert({
          entry_id: null,
          provider: actualProvider,
          raw_provider_response: (aiProvider as any).lastRawResponse || JSON.stringify(generatedClusters),
          parsed_response: {
            clusters: savedClusters,
            _metadata: {
              module: 'vocabulary_clustering',
              user_id: userId,
              cycle_id: cycleId,
              fallback_used: fallbackUsed,
              primary_provider: primaryProvider,
              usage: (aiProvider as any).lastUsage || null
            }
          },
          validation_result: {
            status: 'passed',
            count: savedClusters.length,
            fallback_used: fallbackUsed,
            primary_provider: primaryProvider
          },
          processing_time: Date.now() - startTime,
          retry_count: fallbackUsed ? 1 : 0,
          error_reason: null
        });
      } catch (obsErr) {
        console.warn('[Vocab Clusters] Failed to record ai_observability:', obsErr);
      }

      return savedClusters;
    } catch (err: any) {
      console.error(`[Vocab Clusters] Background AI cluster generation failed:`, err.message || err);
      return [];
    }
  }

  /**
   * Helper to compute shift signals comparing pre-compiled snapshots.
   */
  private static async computeShiftSignalsFromSnapshots(
    snapshots: any[]
  ): Promise<{ last: string[]; six: string[]; all: string[] }> {
    const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
    const result = { last: [] as string[], six: [] as string[], all: [] as string[] };
    if (snapshots.length < 2) {
      const emptyMsg = 'Your vocabulary tracking has started in Cycle 1. Compare shifts once you progress to Cycle 2.';
      return { last: [emptyMsg], six: [emptyMsg], all: [emptyMsg] };
    }

    const activeSnap = snapshots[snapshots.length - 1];
    const activeData = activeSnap.snapshot_data as VocabularySnapshotData;
    const activeCounts = new Map<string, number>();
    (activeData.words || []).forEach(w => activeCounts.set(w.normalized_word, w.frequency));

    const activeTop3 = (activeData.most_used || []).slice(0, 3);

    const buildSignals = (prevWordsList: any[], prevLabel: string, endLabel: string) => {
      const signals: string[] = [];
      const prevCounts = new Map<string, number>();
      prevWordsList.forEach(w => prevCounts.set(w.normalized_word, w.frequency));

      // Check if top word frequency decreased
      if (activeTop3.length > 0) {
        const topWord = activeTop3[0].normalized_word;
        const currFreq = activeCounts.get(topWord) || 0;
        const prevFreq = prevCounts.get(topWord) || 0;
        if (prevFreq > 0 && currFreq < prevFreq) {
          signals.push(
            `"${cap(topWord)}" appeared ${prevFreq}× in ${prevLabel} and ${currFreq}× in ${endLabel} — still your most used word, but less so. Something is loosening.`
          );
        }
      }

      // Check for new words
      const newWords = Array.from(activeCounts.keys())
        .filter(w => !prevCounts.has(w) || prevCounts.get(w) === 0)
        .slice(0, 2);
      if (newWords.length > 0) {
        const displayNew = newWords.map(w => `"${cap(w)}"`).join(' and ');
        signals.push(`${displayNew} ${newWords.length === 1 ? 'is new' : 'are new'} since ${prevLabel} — now appearing in ${endLabel}.`);
      }

      // Check for dropped words
      const droppedWords = Array.from(prevCounts.keys())
        .filter(w => !activeCounts.has(w) || activeCounts.get(w) === 0)
        .slice(0, 2);
      if (droppedWords.length > 0) {
        const displayDropped = droppedWords.map(w => `"${cap(w)}"`).join(' and ');
        signals.push(`${displayDropped} dropped away in ${endLabel}.`);
      }

      if (signals.length === 0) {
        signals.push('Your emotional vocabulary held steady across this window.');
      }
      return signals.slice(0, 3);
    };

    // Last cycle comparison
    const lastSnap = snapshots[snapshots.length - 2];
    const lastData = lastSnap.snapshot_data as VocabularySnapshotData;
    result.last = buildSignals(lastData.words || [], `Cycle ${snapshots.length - 1}`, `Cycle ${snapshots.length}`);

    // Cycle 1 comparison
    const firstSnap = snapshots[0];
    const firstData = firstSnap.snapshot_data as VocabularySnapshotData;
    result.all = buildSignals(firstData.words || [], 'Cycle 1', `Cycle ${snapshots.length}`);

    // Last 6 cycles comparison
    const sixStartIdx = Math.max(0, snapshots.length - 7);
    const sixEndIdx = snapshots.length - 2;
    const compareCount = sixEndIdx - sixStartIdx + 1;
    const sixMergedWords = new Map<string, number>();

    for (let idx = sixStartIdx; idx <= sixEndIdx; idx++) {
      const snapData = snapshots[idx].snapshot_data as VocabularySnapshotData;
      (snapData.words || []).forEach(w => {
        sixMergedWords.set(w.normalized_word, (sixMergedWords.get(w.normalized_word) || 0) + w.frequency);
      });
    }

    const sixWordsList = Array.from(sixMergedWords.entries()).map(([normalized_word, frequency]) => ({
      normalized_word,
      frequency: frequency / compareCount
    }));

    result.six = buildSignals(sixWordsList, `${compareCount} cycles ago`, `Cycle ${snapshots.length}`);

    return result;
  }
}
