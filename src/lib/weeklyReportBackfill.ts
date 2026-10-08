import { supabase } from './db';
import { queueRegistry } from './queue/registry';

export interface BackfillResult {
  total_weeks_checked: number;
  already_generated: number;
  newly_queued: number;
  re_queued_failed: number;
}

/**
 * Scans all historical cycles for the user and generates any missing weekly reports.
 * Converges on the same BullMQ worker pipeline used for real-time processing.
 */
export async function backfillWeeklyReports(userId: string): Promise<BackfillResult> {
  console.log(`[Backfill Orchestrator] Starting weekly summary audit for user ${userId}`);
  
  const result: BackfillResult = {
    total_weeks_checked: 0,
    already_generated: 0,
    newly_queued: 0,
    re_queued_failed: 0
  };

  try {
    // 1. Fetch all cycles for this user, ordered chronologically
    const { data: cycles, error: cyclesErr } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (cyclesErr) {
      console.error('[Backfill Orchestrator] Error fetching user cycles:', cyclesErr.message);
      return result;
    }

    if (!cycles || cycles.length === 0) {
      console.log('[Backfill Orchestrator] No cycles found for user.');
      return result;
    }

    // 2. Fetch user timezone
    const { data: userRecord } = await supabase.from('users').select('timezone').eq('id', userId).maybeSingle();
    const userTimezone = userRecord?.timezone || 'UTC';

    // Check all 4 weeks of the cycle
    const targetWeeks = [
      { week: 1, startDay: 1, endDay: 7, triggerDay: 8 },
      { week: 2, startDay: 8, endDay: 14, triggerDay: 15 },
      { week: 3, startDay: 15, endDay: 21, triggerDay: 22 },
      { week: 4, startDay: 22, endDay: 28, triggerDay: 29 }
    ];

    for (const cycle of cycles) {
      const cycleId = cycle.id;
      const isCycleCompleted = 
        cycle.status?.toLowerCase() === 'complete' || 
        cycle.status?.toLowerCase() === 'completed' ||
        cycle.status?.toLowerCase() === 'archived';
      
      const startDateMs = new Date(cycle.start_date).getTime();
      const calculatedDay = Math.max(1, Math.floor((Date.now() - startDateMs) / (1000 * 60 * 60 * 24)) + 1);

      const { data: maxEntry } = await supabase
        .from('entries')
        .select('cycle_day')
        .eq('user_id', userId)
        .eq('cycle_id', cycleId)
        .order('cycle_day', { ascending: false })
        .limit(1)
        .maybeSingle();
      const currentDay = Math.max(maxEntry?.cycle_day || 0, calculatedDay);

      for (const target of targetWeeks) {
        // A week is completed if the cycle is completed, or if the current day has reached or passed the trigger day
        const isWeekCompleted = isCycleCompleted || currentDay >= target.triggerDay;
        
        if (!isWeekCompleted) {
          continue; // Week is not yet complete, skip
        }

        result.total_weeks_checked++;

        // Check if a weekly summary already exists in the database (scoped by user_id)
        const { data: summary, error: summaryErr } = await supabase
          .from('weekly_summaries')
          .select('*')
          .eq('cycle_id', cycleId)
          .eq('week_number', target.week)
          .eq('user_id', userId)
          .maybeSingle();

        if (summaryErr) {
          console.error(`[Backfill Orchestrator] Error checking summary for cycle ${cycleId} week ${target.week}:`, summaryErr.message);
          continue;
        }

        if (summary) {
          // Row exists
          if (summary.status === 'READY') {
            // Already successfully generated — never touch it again
            result.already_generated++;
          } else if (
            summary.status === 'PENDING' ||
            summary.status === 'WAITING_FOR_PROCESSING' ||
            summary.status === 'GENERATING' ||
            summary.status === 'GRACE_PERIOD'
          ) {
            // Actively in-flight — only intervene if stuck for > 15 minutes
            const timeSinceUpdate = Date.now() - new Date(summary.updated_at || summary.created_at).getTime();
            const isStuck = timeSinceUpdate > 15 * 60 * 1000;

            if (isStuck) {
              result.re_queued_failed++;
              console.log(`[Backfill Orchestrator] Re-queueing stuck summary ${summary.id} (status: ${summary.status}, stuck for ${Math.round(timeSinceUpdate / 60000)}min)`);

              await supabase
                .from('weekly_summaries')
                .update({ status: 'PENDING' })
                .eq('id', summary.id);

              await queueRegistry.addJob(
                'weekly_summary_generation',
                `weekly_backfill_${summary.id}`,
                { cycle_id: cycleId, user_id: userId, week_number: target.week, summary_id: summary.id },
                `weekly_backfill_${summary.id}`
              );
            } else {
              // Still actively processing — do nothing
              result.newly_queued++;
            }
          } else if (summary.status === 'FAILED') {
            // Explicitly failed — re-trigger once
            result.re_queued_failed++;
            console.log(`[Backfill Orchestrator] Re-queueing failed summary ${summary.id} (week: ${target.week}, cycle: ${cycleId})`);

            await supabase
              .from('weekly_summaries')
              .update({ status: 'PENDING' })
              .eq('id', summary.id);

            await queueRegistry.addJob(
              'weekly_summary_generation',
              `weekly_backfill_${summary.id}`,
              { cycle_id: cycleId, user_id: userId, week_number: target.week, summary_id: summary.id },
              `weekly_backfill_${summary.id}`
            );
          }
        } else {
          // No row exists -> Create new summary row as PENDING and trigger worker
          result.newly_queued++;
          console.log(`[Backfill Orchestrator] Creating missing weekly summary (Week ${target.week}, Cycle ${cycleId})`);

          const initialOrchestration = {
            orchestration: {
              status: 'WAITING_FOR_PROCESSING',
              entry_id: '',
              completed_events: {
                'SCORING_COMPLETED': false,
                'REFLECTION_COMPLETED': false,
                'CRISIS_COMPLETED': false,
                'VOCABULARY_COMPLETED': false,
                'THREADS_COMPLETED': false,
                'CYCLE_METADATA_UPDATED': false
              },
              history: [
                { stage: 'WAITING_FOR_PROCESSING', timestamp: new Date().toISOString() }
              ],
              updated_at: new Date().toISOString()
            }
          };

          const { data: newSummary, error: insertError } = await supabase
            .from('weekly_summaries')
            .insert({
              user_id: userId,
              cycle_id: cycleId,
              week_number: target.week,
              day_start: target.startDay,
              day_end: target.endDay,
              status: 'PENDING',
              report_data: initialOrchestration
            })
            .select()
            .single();

          if (insertError) {
            console.error(`[Backfill Orchestrator] Failed to insert missing weekly summary:`, insertError.message);
            result.newly_queued--;
          } else if (newSummary) {
            // Add job to validation queue
            await queueRegistry.addJob(
              'weekly_summary_generation',
              `weekly_backfill_${newSummary.id}`,
              {
                cycle_id: cycleId,
                user_id: userId,
                week_number: target.week,
                summary_id: newSummary.id
              },
              `weekly_backfill_${newSummary.id}` // jobId
            );
          }
        }
      }

      // Also audit monthly assessment report for completed / Day 28+ cycle
      const hasEntries = (maxEntry?.cycle_day || 0) > 0;
      const isCycleAssessmentDue = (isCycleCompleted || cycle.assessment_completed || (Boolean(cycle.assessment_available) && (maxEntry?.cycle_day || 0) >= 28)) && (hasEntries || isCycleCompleted);
      if (isCycleAssessmentDue) {
        const { data: assessment } = await supabase
          .from('assessments')
          .select('id, generation_status, report_text')
          .eq('cycle_id', cycleId)
          .maybeSingle();

        const isPlaceholder = !assessment?.report_text || assessment.report_text.length < 50 || assessment.report_text.startsWith('Auto-Transition') || assessment.report_text.startsWith('Completed Transition');
        const needsGeneration = !assessment || assessment.generation_status !== 'ready' || isPlaceholder;

        if (needsGeneration) {
          console.log(`[Backfill Orchestrator] Generating/repairing monthly report for cycle ${cycleId}`);
          let assId = assessment?.id;
          if (!assId) {
            const { data: newAss } = await supabase
              .from('assessments')
              .insert({
                user_id: userId,
                cycle_id: cycleId,
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
            try {
              const { processMonthlyReport } = await import('./queue/workers/monthlyReportWorker');
              await processMonthlyReport({
                cycle_id: cycleId,
                user_id: userId,
                assessment_id: assId
              });
            } catch (monthlyErr: any) {
              console.error(`[Backfill Orchestrator] Error processing monthly report for cycle ${cycleId}:`, monthlyErr.message);
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[Backfill Orchestrator] Fatal error during backfill run:', err.message || err);
  }

  console.log(`[Backfill Orchestrator] Audit complete. Checked: ${result.total_weeks_checked}, Ready: ${result.already_generated}, Newly Queued: ${result.newly_queued}, Re-queued: ${result.re_queued_failed}`);
  return result;
}
