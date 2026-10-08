import { supabase } from '../db';
import { IntelligenceOrchestrator } from './intelligenceOrchestrator';

export interface RepairAuditResult {
  userId: string;
  repairedCounts: {
    reflections: number;
    scores: number;
    vocabulary: number;
    patterns: number;
    knowledge: number;
    weeklyReports: number;
    cycleReports: number;
  };
  logs: string[];
}

export class IntelligenceRepairService {
  /**
   * Run a full audit & repair pass for a specific user.
   */
  public static async auditUser(userId: string): Promise<RepairAuditResult> {
    console.log(`[IntelligenceRepairService] Starting pipeline audit for user ${userId}...`);
    const logs: string[] = [];
    const repairedCounts = {
      reflections: 0,
      scores: 0,
      vocabulary: 0,
      patterns: 0,
      knowledge: 0,
      weeklyReports: 0,
      cycleReports: 0
    };

    const { queueRegistry } = await import('../queue/registry');

    // 1. Audit Journal Entries (Reflections, Scores, Vocab)
    try {
      const { data: entries } = await supabase
        .from('entries')
        .select('id, cycle_id, cycle_day, scoring_status, vocab_processed, created_at')
        .eq('user_id', userId);

      if (entries && entries.length > 0) {
        for (const entry of entries) {
          // Check missing reflection
          const { data: refl } = await supabase
            .from('reflections')
            .select('id')
            .eq('entry_id', entry.id)
            .maybeSingle();

          if (!refl) {
            console.log(`[RepairService] Missing reflection for entry ${entry.id}. Queueing repair...`);
            const jobId = await IntelligenceOrchestrator.enqueueJob(userId, 'reflection', `Repair:MissingReflection:${entry.id}`);
            await queueRegistry.addJob('reflection_generation', `refl_repair_${entry.id}`, {
              entry_id: entry.id,
              user_id: userId,
              orchestrator_job_id: jobId
            });
            repairedCounts.reflections++;
            logs.push(`Queued missing reflection for entry ${entry.id}`);
          }

          // Check missing score
          if (entry.scoring_status !== 'scored') {
            const { data: score } = await supabase
              .from('entry_scores')
              .select('id')
              .eq('entry_id', entry.id)
              .maybeSingle();

            if (!score) {
              console.log(`[RepairService] Missing score for entry ${entry.id}. Queueing repair...`);
              const jobId = await IntelligenceOrchestrator.enqueueJob(userId, 'scoring', `Repair:MissingScore:${entry.id}`);
              await queueRegistry.addJob('entry_scoring', `score_repair_${entry.id}`, {
                entry_id: entry.id,
                user_id: userId,
                orchestrator_job_id: jobId
              });
              repairedCounts.scores++;
              logs.push(`Queued missing score for entry ${entry.id}`);
            }
          }

          // Check missing vocab extraction
          if (!entry.vocab_processed) {
            const { data: vocab } = await supabase
              .from('vocab_extractions')
              .select('id')
              .eq('entry_id', entry.id)
              .maybeSingle();

            if (!vocab) {
              console.log(`[RepairService] Missing vocabulary extraction for entry ${entry.id}. Queueing repair...`);
              const jobId = await IntelligenceOrchestrator.enqueueJob(userId, 'vocabulary', `Repair:MissingVocab:${entry.id}`);
              await queueRegistry.addJob('vocab_processing', `vocab_repair_${entry.id}`, {
                entry_id: entry.id,
                user_id: userId,
                orchestrator_job_id: jobId
              });
              repairedCounts.vocabulary++;
              logs.push(`Queued missing vocabulary extraction for entry ${entry.id}`);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[RepairService] Error auditing journal entries:', err.message);
    }

    // 2. Audit Active Cycle & Missing Reports
    try {
      const { data: activeCycle } = await supabase
        .from('cycles')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (activeCycle) {
        const { data: maxEntry } = await supabase
          .from('entries')
          .select('cycle_day')
          .eq('user_id', userId)
          .eq('cycle_id', activeCycle.id)
          .order('cycle_day', { ascending: false })
          .limit(1)
          .maybeSingle();

        const cycleDay = maxEntry?.cycle_day || 0;
        const weeksToCheck = [
          { weekNum: 1, triggerDay: 8, startDay: 1, endDay: 7 },
          { weekNum: 2, triggerDay: 15, startDay: 8, endDay: 14 },
          { weekNum: 3, triggerDay: 22, startDay: 15, endDay: 21 },
          { weekNum: 4, triggerDay: 29, startDay: 22, endDay: 28 }
        ];

        for (const w of weeksToCheck) {
          if (cycleDay >= w.triggerDay) {
            const { data: summary } = await supabase
              .from('weekly_summaries')
              .select('id, status')
              .eq('cycle_id', activeCycle.id)
              .eq('week_number', w.weekNum)
              .maybeSingle();

            if (!summary || summary.status === 'PENDING' || summary.status === 'FAILED') {
              console.log(`[RepairService] Missing or ungenerated Weekly Report for week ${w.weekNum}. Queueing repair...`);
              let summaryId = summary?.id;
              if (!summaryId) {
                const { data: newSummary } = await supabase
                  .from('weekly_summaries')
                  .insert({
                    user_id: userId,
                    cycle_id: activeCycle.id,
                    week_number: w.weekNum,
                    day_start: w.startDay,
                    day_end: w.endDay,
                    status: 'PENDING'
                  })
                  .select('id')
                  .single();
                summaryId = newSummary?.id;
              }

              if (summaryId) {
                const jobId = await IntelligenceOrchestrator.enqueueJob(userId, 'weekly_report', `Repair:WeeklyReport:${w.weekNum}`);
                await queueRegistry.addJob('weekly_summary_generation', `weekly_validate_repair_${summaryId}`, {
                  summary_id: summaryId,
                  cycle_id: activeCycle.id,
                  user_id: userId,
                  week_number: w.weekNum,
                  is_validation_job: true,
                  orchestrator_job_id: jobId
                });
                repairedCounts.weeklyReports++;
                logs.push(`Queued missing weekly report for week ${w.weekNum}`);
              }
            }
          }
        }

        // Audit Cycle Assessment Reports for all completed or Day 28+ cycles
        const { data: allUserCycles } = await supabase
          .from('cycles')
          .select('*')
          .eq('user_id', userId);

        for (const userCycle of allUserCycles || []) {
          const { data: maxEntry } = await supabase
            .from('entries')
            .select('cycle_day')
            .eq('user_id', userId)
            .eq('cycle_id', userCycle.id)
            .order('cycle_day', { ascending: false })
            .limit(1)
            .maybeSingle();

          const startDateMs = new Date(userCycle.start_date).getTime();
          const calculatedDay = Math.max(1, Math.floor((Date.now() - startDateMs) / (1000 * 60 * 60 * 24)) + 1);
          const isCycleCompleted = userCycle.status === 'COMPLETED' || userCycle.status === 'completed' || userCycle.assessment_completed;
          const isDay28Eligible = Boolean(userCycle.assessment_available) && (maxEntry?.cycle_day || 0) >= 28;
          const isDue = isCycleCompleted || isDay28Eligible;

          if (isDue) {
            const { data: assessment } = await supabase
              .from('assessments')
              .select('id, generation_status, report_text')
              .eq('cycle_id', userCycle.id)
              .maybeSingle();

            const isPlaceholder = !assessment?.report_text || assessment.report_text.length < 50 || assessment.report_text.startsWith('Auto-Transition') || assessment.report_text.startsWith('Completed Transition');
            const needsRepair = !assessment || assessment.generation_status !== 'ready' || isPlaceholder;

            if (needsRepair) {
              console.log(`[RepairService] Missing, held or placeholder Cycle Report for cycle ${userCycle.id}. Queueing repair...`);
              let assId = assessment?.id;
              if (!assId) {
                const { data: newAss } = await supabase
                  .from('assessments')
                  .insert({
                    user_id: userId,
                    cycle_id: userCycle.id,
                    generation_status: 'pending',
                    unlocked_at: new Date().toISOString(),
                    ei_avg: 0,
                    pr_avg: 0,
                    sa_avg: 0,
                    dt_score: 0,
                    normalised_sa: 0,
                    risk_total: 0,
                    path_assignment: 'second_cycle',
                    branch_assignment: 'A',
                    entry_count: 0
                  })
                  .select('id')
                  .single();
                assId = newAss?.id;
              }

              if (assId) {
                const jobId = await IntelligenceOrchestrator.enqueueJob(userId, 'assessment', `Repair:Assessment:${userCycle.id}`);
                await queueRegistry.addJob('monthly_report_generation', `assessment_repair_${assId}`, {
                  cycle_id: userCycle.id,
                  user_id: userId,
                  assessment_id: assId,
                  month_number: userCycle.cycle_number || userCycle.number || 1,
                  orchestrator_job_id: jobId
                });
                repairedCounts.cycleReports++;
                logs.push(`Queued missing cycle report assessment for cycle ${userCycle.id}`);
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[RepairService] Error auditing reports:', err.message);
    }

    // Write audit record to DB
    if (logs.length > 0) {
      await supabase.from('orchestrator_events').insert({
        user_id: userId,
        event_type: 'IntelligenceRepairCompleted',
        payload: { repairedCounts, logs }
      });
    }

    return {
      userId,
      repairedCounts,
      logs
    };
  }

  /**
   * Runs an audit pass across all active platform users.
   */
  public static async auditAllUsers(): Promise<RepairAuditResult[]> {
    const { data: users } = await supabase.from('users').select('id');
    const results: RepairAuditResult[] = [];
    if (users) {
      for (const u of users) {
        const res = await this.auditUser(u.id);
        results.push(res);
      }
    }
    return results;
  }
}
