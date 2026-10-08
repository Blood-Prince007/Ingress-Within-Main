import { supabase } from '../db';
import { aiProvider } from '../ai/factory';
import { extractJson } from '../ai/utils';
import crypto from 'crypto';

export interface ProfileDimensionModel {
  summary: string;
  confidence: 'High' | 'Medium' | 'Low';
  supporting_events: {
    journals: string[];
    reports: string[];
    patterns: string[];
  };
  supporting_vocabulary: string[];
  referenced_nodes?: string[];
  last_updated: string;
}

export interface KnowledgeProfile {
  user_id: string;
  identity_model: ProfileDimensionModel;
  emotion_model: ProfileDimensionModel;
  vocabulary_model: ProfileDimensionModel;
  pattern_model: ProfileDimensionModel;
  agency_model: ProfileDimensionModel;
  relationship_model: ProfileDimensionModel;
  decision_model: ProfileDimensionModel;
  growth_model: ProfileDimensionModel;
  communication_model: ProfileDimensionModel;
  stress_model: ProfileDimensionModel;
  values_model: ProfileDimensionModel;
  provider?: string;
  model?: string;
  prompt_version?: string;
  knowledge_version: string;
  updated_at?: string;
}

export interface KnowledgeCard {
  id?: string;
  user_id: string;
  card_type: string;
  title: string;
  content: string;
  json_data: any;
  version: string;
  generated_from_event?: string;
  created_at?: string;
  updated_at?: string;
}

export class KnowledgeService {
  /**
   * Emits a new knowledge event into the database and triggers queue processing.
   */
  public static async emitKnowledgeEvent(
    userId: string,
    cycleId: string | null,
    entryId: string | null,
    eventType: string,
    source: string,
    payload: any
  ): Promise<any> {
    console.log(`[Knowledge Service] Emitting event ${eventType} for user ${userId}`);

    const { data: event, error } = await supabase
      .from('knowledge_events')
      .insert({
        user_id: userId,
        cycle_id: cycleId || null,
        entry_id: entryId || null,
        event_type: eventType,
        source: source,
        payload: payload || {},
        version: '1.0',
        processed: false
      })
      .select()
      .single();

    if (error) {
      console.error(`[Knowledge Service] Failed to insert knowledge event:`, error.message);
      throw error;
    }

    // Trigger the background worker processing for this event
    try {
      const { triggerKnowledgeProcessing } = await import('../queue/triggers');
      await triggerKnowledgeProcessing(event.id, userId, cycleId, entryId);
    } catch (triggerErr: any) {
      console.error(`[Knowledge Service] Failed to trigger background processing:`, triggerErr.message);
    }

    return event;
  }

  /**
   * Main entrypoint for processing a knowledge event in the background.
   * Performs idempotency check, updates profile, and regenerates cards.
   */
  private static createDefaultDimension(): ProfileDimensionModel {
    return {
      summary: 'No observations recorded yet.',
      confidence: 'Low',
      supporting_events: { journals: [], reports: [], patterns: [] },
      supporting_vocabulary: [],
      last_updated: new Date().toISOString()
    };
  }

  public static async processKnowledgeEvent(eventId: string): Promise<void> {
    console.log(`[Knowledge Service] Processing event ${eventId}`);

    // Check UUID validity to prevent PostgreSQL invalid uuid syntax error on aggregate triggers
    const isUuid = Boolean(eventId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId));
    if (!isUuid) {
      console.log(`[Knowledge Service] Identifier "${eventId}" is a pseudo/aggregate event. Skipping direct table lookup.`);
      return;
    }

    // 1. Fetch the event
    const { data: event, error: fetchErr } = await supabase
      .from('knowledge_events')
      .select('*')
      .eq('id', eventId)
      .maybeSingle();

    if (fetchErr) {
      throw new Error(`Failed to fetch event: ${fetchErr.message}`);
    }

    if (!event) {
      console.warn(`[Knowledge Service] Event ${eventId} not found in database.`);
      return;
    }

    // Idempotency Guard: skip if already processed
    if (event.processed) {
      console.log(`[Knowledge Service] Event ${eventId} has already been processed. Skipping.`);
      return;
    }

    const userId = event.user_id;
    const eventType = event.event_type;

    // Gatekeeper: only update profile on complete pipelines
    const isCompletePipelineEvent = eventType === 'VocabularyUpdated' || eventType === 'PatternUpdated';

    if (!isCompletePipelineEvent) {
      console.log(`[Knowledge Service] Event ${eventType} is an intermediate step. Skipping AI profile update for efficiency.`);
      
      const { error: updateErr } = await supabase
        .from('knowledge_events')
        .update({
          processed: true,
          processed_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (updateErr) {
        console.error(`[Knowledge Service] Failed to mark event ${eventId} as processed:`, updateErr.message);
      }
      return;
    }

    // 2. Fetch the current knowledge profile
    const { data: existingProfile, error: profileErr } = await supabase
      .from('knowledge_profile')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileErr) {
      throw new Error(`Failed to fetch knowledge profile: ${profileErr.message}`);
    }

    const currentProfile: KnowledgeProfile = existingProfile || {
      user_id: userId,
      identity_model: this.createDefaultDimension(),
      emotion_model: this.createDefaultDimension(),
      vocabulary_model: this.createDefaultDimension(),
      pattern_model: this.createDefaultDimension(),
      agency_model: this.createDefaultDimension(),
      relationship_model: this.createDefaultDimension(),
      decision_model: this.createDefaultDimension(),
      growth_model: this.createDefaultDimension(),
      communication_model: this.createDefaultDimension(),
      stress_model: this.createDefaultDimension(),
      values_model: this.createDefaultDimension(),
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      prompt_version: '2.0',
      knowledge_version: '2.0',
      updated_at: new Date().toISOString()
    };

    // 3. Fetch detailed context details for complete pipeline processing
    let newContext: any = {};
    if (eventType === 'VocabularyUpdated') {
      const entryId = event.entry_id || event.payload?.entry_id;
      const threadResponseId = event.payload?.thread_response_id;

      if (entryId) {
        const { data: entry } = await supabase
          .from('entries')
          .select('id, content, cycle_day, written_at')
          .eq('id', entryId)
          .maybeSingle();

        const { data: reflection } = await supabase
          .from('reflections')
          .select('reflection_text, reflection_observation')
          .eq('entry_id', entryId)
          .maybeSingle();

        const { data: score } = await supabase
          .from('entry_scores')
          .select('day_ei, day_pr, day_sa')
          .eq('entry_id', entryId)
          .maybeSingle();

        const { data: vocabs } = await supabase
          .from('vocab_extractions')
          .select('word, normalized_word, sentence, confidence')
          .eq('entry_id', entryId);

        newContext = {
          type: 'journal_entry',
          entry_id: entryId,
          content: entry?.content || '',
          cycle_day: entry?.cycle_day,
          written_at: entry?.written_at,
          reflection: reflection?.reflection_text || reflection?.reflection_observation || '',
          scores: score ? {
            emotional_intensity: score.day_ei,
            processing_depth: score.day_pr,
            self_agency: score.day_sa
          } : null,
          vocabulary: vocabs?.map(v => ({ word: v.word, normalized: v.normalized_word, confidence: v.confidence })) || []
        };
      } else if (threadResponseId) {
        const { data: threadRes } = await supabase
          .from('thread_responses')
          .select('id, response_text, created_at')
          .eq('id', threadResponseId)
          .maybeSingle();

        const { data: vocabs } = await supabase
          .from('vocab_extractions')
          .select('word, normalized_word, sentence, confidence')
          .eq('thread_response_id', threadResponseId);

        newContext = {
          type: 'thread_response',
          thread_response_id: threadResponseId,
          response_text: threadRes?.response_text || '',
          created_at: threadRes?.created_at,
          vocabulary: vocabs?.map(v => ({ word: v.word, normalized: v.normalized_word, confidence: v.confidence })) || []
        };
      }
    } else if (eventType === 'PatternUpdated') {
      const weeklySummaryId = event.payload?.weekly_summary_id;
      if (weeklySummaryId) {
        const { data: summary } = await supabase
          .from('weekly_summaries')
          .select('id, week_number, title, why, body, open_question')
          .eq('id', weeklySummaryId)
          .maybeSingle();

        const { data: patterns } = await supabase
          .from('pattern_snapshots')
          .select('snapshot_data, cycle_number')
          .eq('user_id', userId)
          .eq('cycle_id', event.cycle_id)
          .maybeSingle();

        newContext = {
          type: 'weekly_report',
          weekly_summary_id: weeklySummaryId,
          week_number: summary?.week_number,
          title: summary?.title,
          why: summary?.why,
          body: summary?.body,
          open_question: summary?.open_question,
          patterns: patterns?.snapshot_data?.patterns || []
        };
      }
    }

    // 3.5 Update relationship graph nodes based on the new daily/weekly context
    console.log(`[Knowledge Service] Updating relationship graph via AI for user ${userId}...`);
    await this.updateGraphWithAI(userId, event, newContext);

    // 4. Update the knowledge profile models using AI
    console.log(`[Knowledge Service] Updating knowledge profile models via AI for user ${userId}...`);
    const updatedModels = await this.updateProfileModelsWithAI(currentProfile, event, newContext);

    const updatedProfile: KnowledgeProfile = {
      ...currentProfile,
      ...updatedModels,
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      prompt_version: '2.0',
      knowledge_version: '2.0',
      updated_at: new Date().toISOString()
    };

    // Save updated profile
    const { error: upsertErr } = await supabase
      .from('knowledge_profile')
      .upsert(updatedProfile);

    if (upsertErr) {
      throw new Error(`Failed to save updated knowledge profile: ${upsertErr.message}`);
    }
    console.log(`[Knowledge Service] Successfully saved knowledge profile for user ${userId}.`);

    // 5. Save completed weekly snapshots and regenerate cards only on PatternUpdated
    if (eventType === 'PatternUpdated') {
      const weeklySummaryId = event.payload?.weekly_summary_id;
      const { data: summary } = await supabase
        .from('weekly_summaries')
        .select('week_number, generated_at, created_at')
        .eq('id', weeklySummaryId)
        .maybeSingle();

      const weekNumber = summary?.week_number || 1;
      
      console.log(`[Knowledge Service] Generating weekly snapshot for week ${weekNumber}...`);
      const { error: snapErr } = await supabase
        .from('knowledge_snapshots')
        .insert({
          user_id: userId,
          week_number: weekNumber,
          snapshot: updatedProfile,
          generated_at: summary?.generated_at || summary?.created_at || new Date().toISOString()
        });

      if (snapErr) {
        console.error(`[Knowledge Service] Failed to save weekly snapshot:`, snapErr.message);
      }

      console.log(`[Knowledge Service] Regenerating user knowledge cards...`);
      await this.regenerateKnowledgeCards(userId, updatedProfile, eventId);
    }

    // 6. Mark event as processed (idempotency update)
    const { error: updateErr } = await supabase
      .from('knowledge_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString()
      })
      .eq('id', eventId);

    if (updateErr) {
      console.error(`[Knowledge Service] Failed to mark event ${eventId} as processed:`, updateErr.message);
    } else {
      console.log(`[Knowledge Service] Event ${eventId} marked as processed.`);
    }
  }

  private static async updateProfileModelsWithAI(
    current: KnowledgeProfile,
    event: any,
    newContext: any
  ): Promise<Partial<KnowledgeProfile>> {
    const prompt = `You are the core Knowledge Intelligence Engine for Ingress Within, a therapeutic writing platform.
Your task is to update the long-term knowledge profile of the user based on the current profile models and a new completed daily/weekly processing step.

CURRENT KNOWLEDGE PROFILE DIMENSIONS:
- identity_model: ${JSON.stringify(current.identity_model)}
- emotion_model: ${JSON.stringify(current.emotion_model)}
- vocabulary_model: ${JSON.stringify(current.vocabulary_model)}
- pattern_model: ${JSON.stringify(current.pattern_model)}
- agency_model: ${JSON.stringify(current.agency_model)}
- relationship_model: ${JSON.stringify(current.relationship_model)}
- decision_model: ${JSON.stringify(current.decision_model)}
- growth_model: ${JSON.stringify(current.growth_model)}
- communication_model: ${JSON.stringify(current.communication_model)}
- stress_model: ${JSON.stringify(current.stress_model)}
- values_model: ${JSON.stringify(current.values_model)}

NEW COMPLETED STEP CONTEXT:
- event_type: ${event.event_type}
- source: ${event.source}
- event_id: ${event.id}
- context_details: ${JSON.stringify(newContext, null, 2)}

INSTRUCTIONS:
1. Evolve and update the 11 dimensions in the user's profile based on the new context details.
2. STABILITY CONSTRAINT: Evolve slowly. One day's entry or one week's report should never completely rewrite previous understanding. Use weighted history: weight the new event details, but maintain existing high-confidence observations unless there is sustained conflicting evidence.
3. EVIDENCE-DRIVEN: Base all observations strictly on the user's own writing in the new context and existing models. Do NOT invent or assume.
4. NO PSYCHOLOGICAL LABELS: Do not use labels like "clinical depression", "BPD", "PTSD", etc. Use descriptive, behavioral, and emotional observations.
5. STRICT TONE REQUIREMENT: Write the "summary" in either the first-person ("I", "my") or address the user directly as "you" ("your"). NEVER refer to the writer in the third person (e.g. "the user", "the writer", "he/she", "they").
6. CONFIDENCE: Rate the confidence for each observation as "High" (repeated evidence over multiple cycles/days), "Medium" (some evidence), or "Low" (insufficient/initial evidence).
7. AUDIT TRAIL: Populate the "supporting_events" object.
   - For journals/daily updates, append the new journal entry ID to "journals".
   - For weekly summary/pattern updates, append the new weekly summary ID to "reports" and the pattern snapshot ID to "patterns".
   - Ensure you keep the existing supporting IDs that are still relevant.
   - Extract up to 5 supporting vocabulary words from the context and append them to "supporting_vocabulary".
8. GRAPH REFERENCE: Identify key concepts in this dimension observation that map to nodes in the user's Knowledge Relationship Graph, and list them in the "referenced_nodes" array (e.g. ["boundaries", "overthinking", "burnout"]).
9. Return ONLY a valid JSON object matching the schema below. Do not include markdown code block formatting (e.g. \`\`\`json), no preamble, no explanation.

JSON SCHEMA:
{
  "identity_model": {
    "summary": "Observation summary in 1st/2nd person",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  },
  "emotion_model": {
    "summary": "Observation summary in 1st/2nd person. Focus on direct/reserved/avoidant emotional expression style",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  },
  "vocabulary_model": {
    "summary": "Observation summary in 1st/2nd person",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  },
  "pattern_model": {
    "summary": "Observation summary in 1st/2nd person",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  },
  "agency_model": {
    "summary": "Observation summary in 1st/2nd person. Focus on locus of control (e.g. 'I chose', 'I had to', 'It happened', 'I can't', 'I'm learning')",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  },
  "relationship_model": {
    "summary": "Observation summary in 1st/2nd person. Focus on boundary language, support, conflict, isolation, dependence, boundaries, trust",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  },
  "decision_model": {
    "summary": "Observation summary in 1st/2nd person. Focus on overthinking, acting quickly, needing reassurance, deep reflection, or decision avoidance",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  },
  "growth_model": {
    "summary": "Observation summary in 1st/2nd person. Focus on recovery signals (walking, writing, nature, friends, etc.) and growth indicators (richer vocabulary, higher agency, less avoidance, boundary language)",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  },
  "communication_model": {
    "summary": "Observation summary in 1st/2nd person",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  },
  "stress_model": {
    "summary": "Observation summary in 1st/2nd person. Focus on stress response styles: withdrawal, overworking, seeking support, self criticism, reflection, planning",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  },
  "values_model": {
    "summary": "Observation summary in 1st/2nd person. Focus on work and purpose themes: pressure, achievement, meaning, burnout, growth, balance",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  }
}`;

    try {
      const response = await aiProvider.callRaw(prompt);
      return extractJson<any>(response);
    } catch (err: any) {
      console.error(`[Knowledge Service] AI profile update error:`, err.message || err);
      return {
        identity_model: current.identity_model,
        emotion_model: current.emotion_model,
        vocabulary_model: current.vocabulary_model,
        pattern_model: current.pattern_model,
        agency_model: current.agency_model,
        relationship_model: current.relationship_model,
        decision_model: current.decision_model,
        growth_model: current.growth_model,
        communication_model: current.communication_model,
        stress_model: current.stress_model,
        values_model: current.values_model
      };
    }
  }

  /**
   * Regenerates a set of user knowledge cards using the updated profile.
   */
  private static async regenerateKnowledgeCards(
    userId: string,
    profile: KnowledgeProfile,
    eventId: string
  ): Promise<void> {
    return this.generateCardsWithAI(userId, profile, eventId);
  }

  /**
   * Performs an idempotent, resumable, and progress-tracked historical backfill for a single user.
   */
  public static async backfillUser(userId: string, force: boolean = false): Promise<any> {
    console.log(`[Knowledge Service] Initiating backfill for user ${userId} (force: ${force})`);

    // 1. If force flag is active, delete existing knowledge data
    if (force) {
      console.log(`[Knowledge Service] Force flag active. Purging existing knowledge data for user ${userId}...`);
      await supabase.from('knowledge_relationships').delete().eq('user_id', userId);
      await supabase.from('knowledge_cards').delete().eq('user_id', userId);
      await supabase.from('knowledge_snapshots').delete().eq('user_id', userId);
      await supabase.from('knowledge_profile').delete().eq('user_id', userId);
      await supabase.from('knowledge_events').delete().eq('user_id', userId);
      await supabase.from('knowledge_backfill_status').delete().eq('user_id', userId);
    }

    // 2. Fetch or create backfill progress record
    const { data: existingProgress } = await supabase
      .from('knowledge_backfill_status')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingProgress?.status === 'completed' && !force) {
      console.log(`[Knowledge Service] Backfill for user ${userId} already completed. Skipping.`);
      return existingProgress;
    }

    if (!existingProgress) {
      await supabase
        .from('knowledge_backfill_status')
        .insert({
          user_id: userId,
          status: 'pending',
          updated_at: new Date().toISOString()
        });
    }

    // Mark as processing
    await supabase
      .from('knowledge_backfill_status')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        current_step: 'compiling_events',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    try {
      // 3. Fetch historical source records
      console.log(`[Knowledge Service] Compiling historical records for user ${userId}...`);
      const [
        { data: entries },
        { data: reflections },
        { data: entriesVocab },
        { data: threadVocab },
        { data: threadResponses },
        { data: weeklySummaries },
        { data: patternSnapshots },
        { data: exercises },
        { data: assessments },
        { data: dbEvents }
      ] = await Promise.all([
        supabase.from('entries').select('id, created_at, cycle_day, cycle_id').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('reflections').select('id, entry_id, status, generated_at, created_at').eq('user_id', userId),
        supabase.from('entries').select('id, created_at, cycle_id').eq('user_id', userId).eq('vocab_processed', true),
        supabase.from('thread_responses').select('id, created_at, cycle_id').eq('user_id', userId).eq('vocab_processed', true),
        supabase.from('thread_responses').select('id, thread_id, response_text, created_at, cycle_id, threads(cycle_id)').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('weekly_summaries').select('id, week_number, title, why, body, open_question, generated_at, created_at, cycle_id').eq('user_id', userId).eq('status', 'READY').order('week_number', { ascending: true }),
        supabase.from('pattern_snapshots').select('id, cycle_number, snapshot_data, updated_at, created_at, cycle_id').eq('user_id', userId).eq('snapshot_status', 'completed').order('cycle_number', { ascending: true }),
        supabase.from('exercise_instances').select('id, cycle_id, completed_at, created_at').eq('user_id', userId).in('status', ['completed', 'submitted', 'processing']),
        supabase.from('assessments').select('id, cycle_id, generated_at, unlocked_at').eq('user_id', userId).eq('generation_status', 'ready'),
        supabase.from('knowledge_events').select('*').eq('user_id', userId)
      ]);

      // 4. Compile the chronological timeline of events
      const timeline: any[] = [];

      // JournalCreated
      entries?.forEach(entry => {
        timeline.push({
          timestamp: entry.created_at || new Date().toISOString(),
          eventType: 'JournalCreated',
          source: 'journal',
          cycleId: entry.cycle_id,
          entryId: entry.id,
          payload: { entry_id: entry.id, cycle_day: entry.cycle_day }
        });
      });

      // ReflectionGenerated
      reflections?.forEach(refl => {
        if (refl.status === 'ready' || refl.status === 'completed') {
          const entry = entries?.find(e => e.id === refl.entry_id);
          timeline.push({
            timestamp: refl.generated_at || refl.created_at || new Date().toISOString(),
            eventType: 'ReflectionGenerated',
            source: 'reflection_engine',
            cycleId: entry?.cycle_id || null,
            entryId: refl.entry_id,
            payload: { reflection_id: refl.id }
          });
        }
      });

      // VocabularyUpdated (Entries)
      entriesVocab?.forEach(entry => {
        timeline.push({
          timestamp: new Date(new Date(entry.created_at).getTime() + 10000).toISOString(),
          eventType: 'VocabularyUpdated',
          source: 'vocabulary_engine',
          cycleId: entry.cycle_id,
          entryId: entry.id,
          payload: { entry_id: entry.id, thread_response_id: null }
        });
      });

      // VocabularyUpdated (Thread Responses)
      threadVocab?.forEach(resp => {
        timeline.push({
          timestamp: new Date(new Date(resp.created_at).getTime() + 5000).toISOString(),
          eventType: 'VocabularyUpdated',
          source: 'vocabulary_engine',
          cycleId: resp.cycle_id || null,
          entryId: null,
          payload: { entry_id: null, thread_response_id: resp.id }
        });
      });

      // ThreadAnswered
      threadResponses?.forEach(resp => {
        const threadsVal = resp.threads;
        const cId = (Array.isArray(threadsVal) ? threadsVal[0]?.cycle_id : (threadsVal as any)?.cycle_id) || resp.cycle_id || null;
        timeline.push({
          timestamp: resp.created_at || new Date().toISOString(),
          eventType: 'ThreadAnswered',
          source: 'guide_conversation',
          cycleId: cId,
          entryId: null,
          payload: { thread_id: resp.thread_id, thread_response_id: resp.id }
        });
      });

      // WeeklyReportGenerated
      weeklySummaries?.forEach(ws => {
        timeline.push({
          timestamp: ws.generated_at || ws.created_at || new Date().toISOString(),
          eventType: 'WeeklyReportGenerated',
          source: 'weekly_report_orchestrator',
          cycleId: ws.cycle_id,
          entryId: null,
          payload: { weekly_summary_id: ws.id, week_number: ws.week_number }
        });
      });

      // PatternUpdated
      patternSnapshots?.forEach(snap => {
        timeline.push({
          timestamp: snap.updated_at || snap.created_at || new Date().toISOString(),
          eventType: 'PatternUpdated',
          source: 'pattern_engine',
          cycleId: snap.cycle_id,
          entryId: null,
          payload: { weekly_summary_id: snap.cycle_id }
        });
      });

      // ExerciseCompleted
      exercises?.forEach(ex => {
        timeline.push({
          timestamp: ex.completed_at || ex.created_at || new Date().toISOString(),
          eventType: 'ExerciseCompleted',
          source: 'exercise_insight_worker',
          cycleId: ex.cycle_id,
          entryId: null,
          payload: { exercise_id: ex.id }
        });
      });

      // AssessmentCompleted
      assessments?.forEach(ass => {
        timeline.push({
          timestamp: ass.generated_at || ass.unlocked_at || new Date().toISOString(),
          eventType: 'AssessmentCompleted',
          source: 'monthly_report_worker',
          cycleId: ass.cycle_id,
          entryId: null,
          payload: { assessment_id: ass.id }
        });
      });

      // Sort chronological
      timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // 5. Deduplicate and filter out events
      const eventsToProcess: any[] = [];
      const dbEventsList = dbEvents || [];

      for (const event of timeline) {
        const existing = dbEventsList.find(de => {
          if (de.event_type !== event.eventType) return false;
          if (de.entry_id !== event.entryId) return false;
          if (de.cycle_id !== event.cycleId) return false;

          // Payload matching
          if (event.payload.entry_id && de.payload?.entry_id !== event.payload.entry_id) return false;
          if (event.payload.thread_response_id && de.payload?.thread_response_id !== event.payload.thread_response_id) return false;
          if (event.payload.weekly_summary_id && de.payload?.weekly_summary_id !== event.payload.weekly_summary_id) return false;
          if (event.payload.reflection_id && de.payload?.reflection_id !== event.payload.reflection_id) return false;
          if (event.payload.exercise_id && de.payload?.exercise_id !== event.payload.exercise_id) return false;
          if (event.payload.assessment_id && de.payload?.assessment_id !== event.payload.assessment_id) return false;
          return true;
        });

        if (existing) {
          if (existing.processed) {
            continue; // Skip completely, already processed!
          } else {
            eventsToProcess.push(existing); // Existing in DB but unprocessed
          }
        } else {
          // Insert new event with processed = false
          const { data: newDbEvent, error: insertErr } = await supabase
            .from('knowledge_events')
            .insert({
              user_id: userId,
              cycle_id: event.cycleId,
              entry_id: event.entryId,
              event_type: event.eventType,
              source: event.source,
              payload: event.payload,
              version: '1.0',
              processed: false,
              created_at: event.timestamp
            })
            .select()
            .single();

          if (insertErr || !newDbEvent) {
            console.error(`[Knowledge Service] Failed to insert event ${event.eventType}:`, insertErr?.message);
            continue;
          }

          eventsToProcess.push(newDbEvent);
        }
      }

      const totalEvents = timeline.length;
      let processedCount = totalEvents - eventsToProcess.length;

      await supabase
        .from('knowledge_backfill_status')
        .update({
          current_step: 'processing_events',
          processed_events: processedCount,
          remaining_events: eventsToProcess.length,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      // 6. Process each queued event (silently mark as processed to avoid massive AI overhead)
      for (const dbEvent of eventsToProcess) {
        await supabase
          .from('knowledge_backfill_status')
          .update({
            current_step: `processing_event_${dbEvent.id}`,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        const { error: procUpdateErr } = await supabase
          .from('knowledge_events')
          .update({
            processed: true,
            processed_at: new Date().toISOString()
          })
          .eq('id', dbEvent.id);

        if (procUpdateErr) {
          console.error(`[Knowledge Service] Failed to mark event ${dbEvent.id} as processed:`, procUpdateErr.message);
        }

        processedCount++;
        const remainingCount = totalEvents - processedCount;

        await supabase
          .from('knowledge_backfill_status')
          .update({
            processed_events: processedCount,
            remaining_events: remainingCount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }

      // 7. Compile unified historical profile inputs
      console.log(`[Knowledge Service] Fetching inputs for consolidated profile generation...`);
      const [
        { data: entryScores },
        { data: vocabExtractions },
        { data: finalThreadResponses }
      ] = await Promise.all([
        supabase.from('entry_scores').select('id, day_ei, day_pr, day_sa, created_at').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('vocab_extractions').select('word, normalized_word, sentence, confidence').eq('user_id', userId),
        supabase.from('thread_responses').select('id, response_text').eq('user_id', userId)
      ]);

      const historicalSummary = {
        user_id: userId,
        total_entries: entries?.length || 0,
        average_scores: {
          emotional_intensity: entryScores && entryScores.length > 0 ? (entryScores.reduce((acc, s) => acc + (s.day_ei || 0), 0) / entryScores.length).toFixed(2) : '5.0',
          processing_depth: entryScores && entryScores.length > 0 ? (entryScores.reduce((acc, s) => acc + (s.day_pr || 0), 0) / entryScores.length).toFixed(2) : '4.5',
          self_agency: entryScores && entryScores.length > 0 ? (entryScores.reduce((acc, s) => acc + (s.day_sa || 0), 0) / entryScores.length).toFixed(2) : '5.5'
        },
        journals: entries?.map(e => ({
          id: e.id,
          cycle_day: e.cycle_day,
          created_at: e.created_at
        })) || [],
        weekly_summaries: weeklySummaries?.map(ws => ({
          id: ws.id,
          week: ws.week_number,
          title: ws.title,
          realization: ws.why,
          what_we_saw: ws.body,
          open_question: ws.open_question
        })) || [],
        patterns: patternSnapshots?.map(ps => ({
          id: ps.id,
          week: ps.cycle_number,
          active_patterns: (ps.snapshot_data?.patterns || [])
            .filter((p: any) => p.status !== 'absent' && p.status !== 'quiet')
            .map((p: any) => ({
              name: p.pattern_name || p.name,
              summary: p.summary || p.body,
              status: p.status
            }))
        })) || [],
        vocabulary: vocabExtractions?.slice(0, 100).map(v => ({
          word: v.word,
          normalized: v.normalized_word,
          confidence: v.confidence
        })) || [],
        thread_responses: finalThreadResponses?.map(tr => ({
          id: tr.id,
          text: tr.response_text
        })) || []
      };

      // 7.5 Generate consolidated relationship graph via 1 unified AI call
      console.log(`[Knowledge Service] Generating Knowledge Graph via AI...`);
      await this.generateConsolidatedGraphWithAI(userId, historicalSummary);

      // 8. Generate long-term Knowledge Profile via 1 unified AI call
      await supabase
        .from('knowledge_backfill_status')
        .update({
          current_step: 'generating_profile',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      console.log(`[Knowledge Service] Generating Knowledge Profile via AI...`);
      const profileModels = await this.generateConsolidatedProfileWithAI(userId, historicalSummary);
      
      const newProfile: KnowledgeProfile = {
        user_id: userId,
        identity_model: profileModels.identity_model || this.createDefaultDimension(),
        emotion_model: profileModels.emotion_model || this.createDefaultDimension(),
        vocabulary_model: profileModels.vocabulary_model || this.createDefaultDimension(),
        pattern_model: profileModels.pattern_model || this.createDefaultDimension(),
        agency_model: profileModels.agency_model || this.createDefaultDimension(),
        relationship_model: profileModels.relationship_model || this.createDefaultDimension(),
        decision_model: profileModels.decision_model || this.createDefaultDimension(),
        growth_model: profileModels.growth_model || this.createDefaultDimension(),
        communication_model: profileModels.communication_model || this.createDefaultDimension(),
        stress_model: profileModels.stress_model || this.createDefaultDimension(),
        values_model: profileModels.values_model || this.createDefaultDimension(),
        provider: 'gemini',
        model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
        prompt_version: '2.0',
        knowledge_version: '2.0',
        updated_at: new Date().toISOString()
      };

      const { error: profileUpsertErr } = await supabase
        .from('knowledge_profile')
        .upsert(newProfile);

      if (profileUpsertErr) {
        throw new Error(`Failed to save knowledge profile: ${profileUpsertErr.message}`);
      }

      // 9. Generate Knowledge Cards via AI
      await supabase
        .from('knowledge_backfill_status')
        .update({
          current_step: 'generating_cards',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      console.log(`[Knowledge Service] Generating Knowledge Cards via AI...`);
      await this.generateCardsWithAI(userId, newProfile);

      // 10. Save completed weekly snapshots (simulate week snapshots from historical summaries)
      console.log(`[Knowledge Service] Copying snapshots to knowledge_snapshots...`);
      if (weeklySummaries && weeklySummaries.length > 0) {
        for (const ws of weeklySummaries) {
          // Check if snapshot already exists
          const { count: snapExists } = await supabase
            .from('knowledge_snapshots')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('week_number', ws.week_number);

          if (!snapExists || snapExists === 0) {
            await supabase
              .from('knowledge_snapshots')
              .insert({
                user_id: userId,
                week_number: ws.week_number,
                snapshot: newProfile,
                generated_at: ws.generated_at || ws.created_at || new Date().toISOString()
              });
          }
        }
      }

      // 11. Complete
      const { data: finalProgress } = await supabase
        .from('knowledge_backfill_status')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          current_step: 'finished',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      console.log(`[Knowledge Service] Backfill successfully finished for user ${userId}.`);
      return finalProgress;

    } catch (err: any) {
      console.error(`[Knowledge Service] Backfill failed for user ${userId}:`, err.message || err);
      await supabase
        .from('knowledge_backfill_status')
        .update({
          status: 'failed',
          error_message: err.message || JSON.stringify(err),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      throw err;
    }
  }

  /**
   * Generates a 9-model consolidated profile from full user history.
   */
  private static async generateConsolidatedProfileWithAI(
    userId: string,
    historicalSummary: any
  ): Promise<any> {
    const prompt = `You are the core Knowledge Intelligence Engine for Ingress Within, a therapeutic writing platform.
Your task is to generate a comprehensive, long-term therapeutic Knowledge Profile based on the user's complete historical timeline.

USER HISTORICAL INTEL SUMMARY:
${JSON.stringify(historicalSummary, null, 2)}

INSTRUCTIONS:
1. Review the complete history. Generate a consolidated profile of the user across the 11 dimensions.
2. Ensure the narrative is grounded strictly in the actual weekly reports, patterns, journals, and vocabulary provided. Do not invent details.
3. STRICT TONE REQUIREMENT: Write all summaries and descriptions in either the first-person ("I", "my") or address the user directly as "you" ("your"). NEVER refer to the writer in the third person (e.g. "the user", "the writer", "he/she", "they").
4. CONFIDENCE: Rate the confidence for each observation as "High" (repeated evidence), "Medium" (some evidence), or "Low" (insufficient/initial evidence).
5. AUDIT TRAIL: For each observation, map the corresponding supporting journal UUIDs (from journals array), report UUIDs (from weekly_summaries), and pattern snapshot UUIDs (from patterns) in the "supporting_events" object. Identify supporting vocabulary words and place them in "supporting_vocabulary".
6. GRAPH REFERENCE: Identify key concepts in this dimension observation that map to nodes in the user's Knowledge Relationship Graph, and list them in the "referenced_nodes" array (e.g. ["boundaries", "overthinking", "burnout"]).
7. Return ONLY a valid JSON object matching the schema below. Do not include markdown code block formatting (e.g. \`\`\`json), no preamble, no explanation.

JSON SCHEMA:
{
  "identity_model": {
    "summary": "Observation summary in 1st/2nd person",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  },
  "emotion_model": {
    "summary": "Observation summary in 1st/2nd person. Focus on direct/reserved/avoidant emotional expression style",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  },
  "vocabulary_model": {
    "summary": "Observation summary in 1st/2nd person",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  },
  "pattern_model": {
    "summary": "Observation summary in 1st/2nd person",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  },
  "agency_model": {
    "summary": "Observation summary in 1st/2nd person. Focus on locus of control (e.g. 'I chose', 'I had to', 'It happened', 'I can't', 'I'm learning')",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  },
  "relationship_model": {
    "summary": "Observation summary in 1st/2nd person. Focus on boundary language, support, conflict, isolation, dependence, boundaries, trust",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  },
  "decision_model": {
    "summary": "Observation summary in 1st/2nd person. Focus on overthinking, acting quickly, needing reassurance, deep reflection, or decision avoidance",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  },
  "growth_model": {
    "summary": "Observation summary in 1st/2nd person. Focus on recovery signals (walking, writing, nature, friends, etc.) and growth indicators (richer vocabulary, higher agency, less avoidance, boundary language)",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  },
  "communication_model": {
    "summary": "Observation summary in 1st/2nd person",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  },
  "stress_model": {
    "summary": "Observation summary in 1st/2nd person. Focus on stress response styles: withdrawal, overworking, seeking support, self criticism, reflection, planning",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  },
  "values_model": {
    "summary": "Observation summary in 1st/2nd person. Focus on work and purpose themes: pressure, achievement, meaning, burnout, growth, balance",
    "confidence": "High / Medium / Low",
    "supporting_events": { "journals": ["uuid"], "reports": ["uuid"], "patterns": ["uuid"] },
    "supporting_vocabulary": ["vocab_word"],
    "referenced_nodes": ["node_name"],
    "last_updated": "ISO Timestamp"
  }
}`;

    const response = await aiProvider.callRaw(prompt);
    return extractJson<any>(response);
  }

  /**
   * Generates insight cards using the completed profile.
   */
  private static async generateCardsWithAI(
    userId: string,
    profile: KnowledgeProfile,
    eventId: string | null = null
  ): Promise<void> {
    const prompt = `You are the core Knowledge Intelligence Engine for Ingress Within, a therapeutic writing platform.
Your task is to analyze the user's structured 11-dimension long-term knowledge profile and generate a set of distinct, evidence-backed user-facing "Knowledge Cards".

USER KNOWLEDGE PROFILE:
${JSON.stringify(profile, null, 2)}

INSTRUCTIONS:
1. Examine the 11 profile dimensions.
2. For each dimension, evaluate the confidence rating:
   - ONLY generate a card if the supporting profile dimension has a confidence of "High" or "Medium".
   - If a dimension has "Low" confidence, do NOT generate a card for it.
   - If there is insufficient evidence across the profile, it is perfectly fine to return an empty array []. Quality over quantity is paramount: never generate placeholder cards, mock data, or generic advice.
3. The cards must belong to these valid categories: "emotion_language", "behaviour", "growth", "relationships", "decision_making", "recovery", "values", "communication".
4. For each card:
   - Provide a supportive, descriptive "title".
   - Provide a "subtitle" giving context (e.g. "Observation from your writing history").
   - Provide a "body" (2-4 sentences) presenting the insight. Write in either the first-person ("I") or direct address ("you"). Never refer to the writer in the third person.
   - Set "confidence" matching the profile dimension's confidence ("High" or "Medium").
   - Populate the "supporting_patterns" array, "supporting_vocabulary" array, "supporting_entries" array, and "supporting_reports" array with the cited UUIDs and terms directly from the corresponding profile dimension.
   - GRAPH REFERENCE: Identify key concepts in this card that map to nodes in the user's Knowledge Relationship Graph, and list them in the "referenced_nodes" array.
5. Suppress duplicates: only generate one card per category.
6. Return ONLY a valid JSON array of card objects. Do not include markdown code block formatting (e.g. \`\`\`json), no preamble, no explanation.

JSON SCHEMA:
[
  {
    "card_type": "relationships",
    "title": "...",
    "subtitle": "...",
    "body": "...",
    "confidence": "High",
    "supporting_patterns": ["pattern_id_or_name"],
    "supporting_vocabulary": ["vocab_word"],
    "supporting_entries": ["journal_uuid"],
    "supporting_reports": ["report_uuid"],
    "referenced_nodes": ["node_name"]
  }
]`;

    try {
      const response = await aiProvider.callRaw(prompt);
      const cards: any[] = extractJson<any[]>(response);
      if (Array.isArray(cards)) {
        // Clear old cards for the user to prevent duplication
        const { error: deleteErr } = await supabase
          .from('knowledge_cards')
          .delete()
          .eq('user_id', userId);

        if (deleteErr) {
          throw deleteErr;
        }

        // Insert new cards
        const dbCards = cards
          .filter(c => c.confidence === 'High' || c.confidence === 'Medium')
          .map(c => ({
            user_id: userId,
            card_type: c.card_type,
            title: c.title,
            subtitle: c.subtitle || '',
            body: c.body || c.content || '',
            content: c.body || c.content || '', // Keep for compatibility with existing queries
            confidence: c.confidence,
            supporting_patterns: c.supporting_patterns || [],
            supporting_vocabulary: c.supporting_vocabulary || [],
            supporting_entries: c.supporting_entries || [],
            supporting_reports: c.supporting_reports || [],
            referenced_nodes: c.referenced_nodes || [],
            version: '2.0',
            generated_from_event: eventId
          }));

        if (dbCards.length > 0) {
          const { error: insertErr } = await supabase
            .from('knowledge_cards')
            .insert(dbCards);

          if (insertErr) {
            console.error(`[Knowledge Service] Failed to insert knowledge cards:`, insertErr.message);
          } else {
            console.log(`[Knowledge Service] Successfully generated and saved ${dbCards.length} knowledge cards for user ${userId}.`);
          }
        } else {
          console.log(`[Knowledge Service] Insufficient confidence to generate any cards for user ${userId}.`);
        }
      }
    } catch (err: any) {
      console.error(`[Knowledge Service] AI card generation error:`, err.message || err);
    }
  }

  public static async updateGraphWithAI(
    userId: string,
    event: any,
    newContext: any
  ): Promise<void> {
    const prompt = `You are the core Knowledge Intelligence Engine for Ingress Within, a therapeutic writing platform.
Your task is to analyze a new daily writing or weekly report context and extract the concept relationships to build a living Knowledge Relationship Graph.

NEW COMPLETED STEP CONTEXT:
- event_type: ${event.event_type}
- event_id: ${event.id}
- context_details: ${JSON.stringify(newContext, null, 2)}

INSTRUCTIONS:
1. Identify key concepts (nodes) and their relationships (edges) observed in the context.
2. Dynamic Node Types: classify nodes dynamically (e.g. "Emotion", "Vocabulary", "Behaviour", "Pattern", "Situation", "Work", "Recovery", "Value", "Decision", "Identity", "Stress Trigger"). Do not limit yourself to a predefined list.
3. Dynamic Edge Types: classify the relationship types dynamically (e.g. "Leads To", "Associated With", "Often Follows", "Strengthens", "Weakens", "Recovered By", "Returned After").
4. Ensure all extracted relationships are strictly grounded in the raw text/data. Never invent relationships.
5. Return ONLY a valid JSON array of relationship objects. Do not include markdown code block formatting (e.g. \`\`\`json), no preamble, no explanation.

JSON SCHEMA:
[
  {
    "source_node": "Work pressure",
    "source_type": "Stress Trigger",
    "target_node": "Overthinking",
    "target_type": "Behaviour",
    "relationship_type": "Leads To"
  }
]`;

    try {
      const response = await aiProvider.callRaw(prompt);
      const relations: any[] = extractJson<any[]>(response);
      if (!Array.isArray(relations)) return;

      const eventId = event.id;
      const entryId = event.entry_id || event.payload?.entry_id || null;
      const weeklySummaryId = event.payload?.weekly_summary_id || null;
      const cycleId = event.cycle_id || null;

      // Keep track of active upserted relationship IDs to run decay on the rest
      const activeIds: string[] = [];

      for (const rel of relations) {
        if (!rel.source_node || !rel.target_node || !rel.relationship_type) continue;

        // Norm nodes and types
        const src = rel.source_node.trim();
        const srcType = (rel.source_type || 'Situation').trim();
        const tgt = rel.target_node.trim();
        const tgtType = (rel.target_type || 'Situation').trim();
        const relType = rel.relationship_type.trim();

        // 1. Fetch existing relation
        const { data: existing } = await supabase
          .from('knowledge_relationships')
          .select('*')
          .eq('user_id', userId)
          .eq('source_node', src)
          .eq('target_node', tgt)
          .eq('relationship_type', relType)
          .maybeSingle();

        // Prepare lists
        const mergeArray = (arr1: any[], item: any) => {
          if (!item) return arr1;
          const set = new Set([...arr1, item]);
          return Array.from(set);
        };

        let strength = 0.5;
        let confidence: 'Low' | 'Medium' | 'High' = 'Low';
        let supportingEvents = [eventId];
        let supportingEntries = entryId ? [entryId] : [];
        let supportingReports = weeklySummaryId ? [weeklySummaryId] : [];
        let supportingPatterns = cycleId ? [cycleId] : [];
        const first_seen = existing ? existing.first_seen : new Date().toISOString();

        if (existing) {
          strength = Math.min(1.0, Number(existing.strength) + 0.1);
          confidence = existing.confidence === 'Low' ? 'Medium' : 'High';
          supportingEvents = mergeArray(existing.supporting_events || [], eventId);
          supportingEntries = entryId ? mergeArray(existing.supporting_entries || [], entryId) : (existing.supporting_entries || []);
          supportingReports = weeklySummaryId ? mergeArray(existing.supporting_reports || [], weeklySummaryId) : (existing.supporting_reports || []);
          supportingPatterns = cycleId ? mergeArray(existing.supporting_patterns || [], cycleId) : (existing.supporting_patterns || []);
        }

        const { data: saved, error: upsertErr } = await supabase
          .from('knowledge_relationships')
          .upsert({
            id: existing?.id || crypto.randomUUID(),
            user_id: userId,
            source_node: src,
            source_type: srcType,
            target_node: tgt,
            target_type: tgtType,
            relationship_type: relType,
            strength,
            confidence,
            supporting_events: supportingEvents,
            supporting_entries: supportingEntries,
            supporting_reports: supportingReports,
            supporting_patterns: supportingPatterns,
            first_seen,
            last_seen: new Date().toISOString(),
            version: '2.0',
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (upsertErr) {
          console.error(`[Knowledge Service] Upsert relationship error:`, upsertErr.message);
        } else if (saved) {
          activeIds.push(saved.id);
        }
      }

      // 2. Decay Step: slowly weaken unused relationships
      const { data: allRelations } = await supabase
        .from('knowledge_relationships')
        .select('id, strength')
        .eq('user_id', userId);

      if (allRelations) {
        for (const edge of allRelations) {
          if (activeIds.includes(edge.id)) continue;
          const decayedStrength = Math.max(0.01, Number(edge.strength) * 0.95);
          await supabase
            .from('knowledge_relationships')
            .update({
              strength: decayedStrength,
              updated_at: new Date().toISOString()
            })
            .eq('id', edge.id);
        }
      }

      console.log(`[Knowledge Service] Successfully updated graph with ${relations.length} relationships for user ${userId}.`);
    } catch (err: any) {
      console.error(`[Knowledge Service] Graph update error:`, err.message || err);
    }
  }

  private static async generateConsolidatedGraphWithAI(
    userId: string,
    historicalSummary: any
  ): Promise<void> {
    const prompt = `You are the core Knowledge Intelligence Engine for Ingress Within, a therapeutic writing platform.
Your task is to analyze the user's complete historical timeline summary and generate the complete starting Knowledge Relationship Graph.

USER HISTORICAL INTEL SUMMARY:
${JSON.stringify(historicalSummary, null, 2)}

INSTRUCTIONS:
1. Review the complete history. Identify key concepts (nodes) and the relationships (edges) between them that emerged across their journals, weekly reports, and patterns.
2. Nodes classification must be dynamic (e.g. "Emotion", "Vocabulary", "Behaviour", "Pattern", "Situation", "Work", "Recovery", "Value", "Decision", "Identity", "Stress Trigger").
3. Edges classification must be dynamic (e.g. "Leads To", "Associated With", "Strengthens", "Weakens", "Recovered By", "Returned After").
4. Assign a "strength" rating (0.1 to 1.0) and "confidence" rating ("High" or "Medium" or "Low") based on how frequently and consistently the relationship appears in the history.
5. Identify cited supporting entry UUIDs (from journals array), weekly report UUIDs (from weekly_summaries), and pattern snapshot UUIDs (from patterns) for each relationship, and populate the respective arrays.
6. Return ONLY a valid JSON array of relationship objects. Do not include markdown code block formatting (e.g. \`\`\`json), no preamble, no explanation.

JSON SCHEMA:
[
  {
    "source_node": "...",
    "source_type": "...",
    "target_node": "...",
    "target_type": "...",
    "relationship_type": "...",
    "strength": 0.8,
    "confidence": "High",
    "supporting_events": [],
    "supporting_entries": ["uuid"],
    "supporting_reports": ["uuid"],
    "supporting_patterns": ["uuid"]
  }
]`;

    try {
      const response = await aiProvider.callRaw(prompt);
      const relations: any[] = extractJson<any[]>(response);
      if (!Array.isArray(relations)) return;

      // Purge old relationships for user if resetting
      await supabase
        .from('knowledge_relationships')
        .delete()
        .eq('user_id', userId);

      const dbRelations = relations.map(r => ({
        user_id: userId,
        source_node: r.source_node.trim(),
        source_type: r.source_type.trim(),
        target_node: r.target_node.trim(),
        target_type: r.target_type.trim(),
        relationship_type: r.relationship_type.trim(),
        strength: Number(r.strength) || 0.5,
        confidence: r.confidence || 'Low',
        supporting_events: r.supporting_events || [],
        supporting_entries: r.supporting_entries || [],
        supporting_reports: r.supporting_reports || [],
        supporting_patterns: r.supporting_patterns || [],
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        version: '2.0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      if (dbRelations.length > 0) {
        const { error } = await supabase
          .from('knowledge_relationships')
          .insert(dbRelations);
        if (error) {
          console.error(`[Knowledge Service] Failed to insert consolidated relationships:`, error.message);
        } else {
          console.log(`[Knowledge Service] Successfully generated consolidated relationship graph with ${dbRelations.length} edges.`);
        }
      }
    } catch (err: any) {
      console.error(`[Knowledge Service] consolidated graph AI error:`, err.message || err);
    }
  }

  public static async searchGraph(
    userId: string,
    query: string
  ): Promise<any> {
    // 1. Fetch all user relationships
    const { data: allEdges, error } = await supabase
      .from('knowledge_relationships')
      .select('*')
      .eq('user_id', userId);

    if (error || !allEdges) {
      return { categorized_nodes: {}, connections: [], supporting_entries: [], supporting_reports: [] };
    }

    // 2. Find starting nodes matching the query
    const searchLower = query.toLowerCase();
    const visited = new Set<string>();
    const matchedNodes = new Set<string>();

    allEdges.forEach(e => {
      if (e.source_node.toLowerCase().includes(searchLower)) {
        matchedNodes.add(e.source_node);
      }
      if (e.target_node.toLowerCase().includes(searchLower)) {
        matchedNodes.add(e.target_node);
      }
    });

    const resultEdges: any[] = [];
    const queue: { node: string; hop: number }[] = [];

    matchedNodes.forEach(node => {
      queue.push({ node, hop: 0 });
      visited.add(node);
    });

    // BFS Traversal
    while (queue.length > 0) {
      const { node, hop } = queue.shift()!;
      if (hop >= 2) continue;

      allEdges.forEach(e => {
        let neighbor: string | null = null;
        if (e.source_node === node) {
          neighbor = e.target_node;
        } else if (e.target_node === node) {
          neighbor = e.source_node;
        }

        if (neighbor) {
          resultEdges.push(e);
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push({ node: neighbor, hop: hop + 1 });
          }
        }
      });
    }

    // De-duplicate result edges
    const uniqueEdgesMap = new Map<string, any>();
    resultEdges.forEach(e => {
      uniqueEdgesMap.set(e.id, e);
    });
    const uniqueEdges = Array.from(uniqueEdgesMap.values());

    // Gather and group connected nodes
    const nodeDetails = new Map<string, { name: string; type: string }>();
    uniqueEdges.forEach(e => {
      nodeDetails.set(e.source_node, { name: e.source_node, type: e.source_type });
      nodeDetails.set(e.target_node, { name: e.target_node, type: e.target_type });
    });

    const categorizedNodes: Record<string, string[]> = {};
    nodeDetails.forEach(n => {
      const cat = n.type.toLowerCase().replace(/\s+/g, '_') + 's';
      if (!categorizedNodes[cat]) {
        categorizedNodes[cat] = [];
      }
      if (!categorizedNodes[cat].includes(n.name)) {
        categorizedNodes[cat].push(n.name);
      }
    });

    // Collect cited entries and reports
    const entriesSet = new Set<string>();
    const reportsSet = new Set<string>();
    uniqueEdges.forEach(e => {
      if (Array.isArray(e.supporting_entries)) {
        e.supporting_entries.forEach((id: string) => entriesSet.add(id));
      }
      if (Array.isArray(e.supporting_reports)) {
        e.supporting_reports.forEach((id: string) => reportsSet.add(id));
      }
    });

    return {
      query,
      categorized_nodes: categorizedNodes,
      connections: uniqueEdges.map(e => ({
        source: e.source_node,
        target: e.target_node,
        type: e.relationship_type,
        strength: e.strength,
        confidence: e.confidence
      })),
      supporting_entries: Array.from(entriesSet),
      supporting_reports: Array.from(reportsSet)
    };
  }
}

