import { supabase } from '../db';
import { IntelligenceOrchestrator } from './intelligenceOrchestrator';

export class OrchestratorScheduler {
  /**
   * Run Daily Maintenance checks and repairs.
   * Runs midnight checks for weekly summaries, knowledge updates, and vocabulary snapshots.
   */
  public static async runDailyMaintenance(userId: string): Promise<void> {
    console.log(`[Scheduler] Running Daily Maintenance for user ${userId}`);

    const { queueRegistry } = await import('../queue/registry');

    // 0. Stuck job timeout cleanup (prevents infinite processing)
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: stuckJobs } = await supabase
        .from('orchestrator_jobs')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'running')
        .lt('started_at', fiveMinutesAgo);

      if (stuckJobs) {
        for (const job of stuckJobs) {
          console.warn(`[Scheduler] Job ${job.id} for engine ${job.engine} has been running since ${job.started_at}. Timing out.`);
          await IntelligenceOrchestrator.failJob(job.id, job.user_id, job.engine, 'Job timed out (exceeded processing threshold)');
        }
      }
    } catch (err: any) {
      console.error('[Scheduler] Error cleaning up stuck jobs:', err.message);
    }

    // 1. Check if a week has ended and Weekly Report is missing
    try {
      const { data: activeCycle } = await supabase
        .from('cycles')
        .select('id, cycle_number, start_date')
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

        const startDateMs = new Date(activeCycle.start_date).getTime();
        const calculatedDay = Math.max(1, Math.floor((Date.now() - startDateMs) / (1000 * 60 * 60 * 24)) + 1);
        const cycleDay = Math.max(maxEntry?.cycle_day || 0, calculatedDay);

        const weeksToCheck = [
          { weekNum: 1, triggerDay: 8, startDay: 1, endDay: 7 },
          { weekNum: 2, triggerDay: 15, startDay: 8, endDay: 14 },
          { weekNum: 3, triggerDay: 22, startDay: 15, endDay: 21 },
          { weekNum: 4, triggerDay: 29, startDay: 22, endDay: 28 }
        ];

        for (const w of weeksToCheck) {
          if (cycleDay >= w.triggerDay) {
            // Check if report is missing
            const { data: existing } = await supabase
              .from('weekly_summaries')
              .select('id')
              .eq('cycle_id', activeCycle.id)
              .eq('week_number', w.weekNum)
              .maybeSingle();

            if (!existing) {
              console.log(`[Scheduler] Weekly Report for Week ${w.weekNum} is missing. Scheduling generation...`);
              const { data: insertedSummary } = await supabase
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

              if (insertedSummary) {
                const jobId = await IntelligenceOrchestrator.enqueueJob(userId, 'weekly_report', 'DailyMaintenance:WeeklyReportCheck');
                await queueRegistry.addJob('weekly_summary_generation', `weekly_validate_${insertedSummary.id}`, {
                  summary_id: insertedSummary.id,
                  cycle_id: activeCycle.id,
                  user_id: userId,
                  week_number: w.weekNum,
                  is_validation_job: true,
                  orchestrator_job_id: jobId
                });
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[Scheduler] Error checking missing weekly summaries:', err.message);
    }

    // 2. Check if Knowledge is behind (stale evidence check)
    try {
      const state = await IntelligenceOrchestrator.getEngineState(userId, 'knowledge');
      const lastGenerated = state?.last_generated ? new Date(state.last_generated).getTime() : 0;

      // Check if new pattern snapshot or journal entry exists after last generated timestamp
      const { data: latestSnap } = await supabase
        .from('pattern_snapshots')
        .select('updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: latestEntry } = await supabase
        .from('entries')
        .select('id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const latestTime = Math.max(
        latestSnap?.updated_at ? new Date(latestSnap.updated_at).getTime() : 0,
        latestEntry?.created_at ? new Date(latestEntry.created_at).getTime() : 0
      );

      if (latestTime > lastGenerated) {
        console.log(`[Scheduler] Knowledge is behind for user ${userId}. Enqueueing update.`);
        const jobId = await IntelligenceOrchestrator.enqueueJob(userId, 'knowledge', 'DailyMaintenance:KnowledgeBehind');
        await queueRegistry.addJob('knowledge_processing', `knowledge_event_daily_${Date.now()}`, {
          event_id: latestEntry?.id || '00000000-0000-0000-0000-000000000000',
          user_id: userId,
          orchestrator_job_id: jobId
        });
      }
    } catch (err: any) {
      console.error('[Scheduler] Error checking stale knowledge:', err.message);
    }

    // 3. Verify Vocabulary consistency and repair missing snapshots (no regeneration)
    try {
      // Find completed weekly summaries for the user
      const { data: completedSummaries } = await supabase
        .from('weekly_summaries')
        .select('cycle_id, week_number')
        .eq('user_id', userId)
        .eq('status', 'READY');

      if (completedSummaries) {
        for (const summary of completedSummaries) {
          // Check if vocab snapshot exists for this cycle/week
          const { data: existingVocab } = await supabase
            .from('vocab_snapshots')
            .select('id')
            .eq('user_id', userId)
            .eq('cycle_id', summary.cycle_id)
            .eq('cycle_number', summary.week_number)
            .maybeSingle();

          if (!existingVocab) {
            console.log(`[Scheduler] Vocabulary snapshot is missing for cycle ${summary.cycle_id} week ${summary.week_number}. Repairing...`);
            const jobId = await IntelligenceOrchestrator.enqueueJob(userId, 'vocabulary', `DailyMaintenance:VocabRepair:${summary.week_number}`);
            await queueRegistry.addJob('vocab_processing', `vocab_repair_${summary.week_number}_${Date.now()}`, {
              user_id: userId,
              cycle_id: summary.cycle_id,
              bypass_ai: true, // Only compile from pre-existing extractions
              orchestrator_job_id: jobId
            });
          }
        }
      }
    } catch (err: any) {
      console.error('[Scheduler] Error repairing vocabulary snapshots:', err.message);
    }

    // 4. Run Self-Healing integrity audit
    try {
      const { SelfHealingService } = await import('./selfHealing');
      await SelfHealingService.runIntegrityAudit(userId);
    } catch (err: any) {
      console.error('[Scheduler] Error running Self-Healing integrity audit:', err.message);
    }
  }

  /**
   * Run Weekly Maintenance checks and repairs.
   * Repairs missing pattern snapshots.
   */
  public static async runWeeklyMaintenance(userId: string): Promise<void> {
    console.log(`[Scheduler] Running Weekly Maintenance for user ${userId}`);

    const { queueRegistry } = await import('../queue/registry');

    // 1. Verify and repair missing Pattern snapshots
    try {
      const { data: completedSummaries } = await supabase
        .from('weekly_summaries')
        .select('id, cycle_id, week_number')
        .eq('user_id', userId)
        .eq('status', 'READY');

      if (completedSummaries) {
        for (const summary of completedSummaries) {
          // Check if pattern snapshot exists for this weekly summary
          const { data: existingPattern } = await supabase
            .from('pattern_snapshots')
            .select('id')
            .eq('user_id', userId)
            .eq('cycle_id', summary.id)
            .maybeSingle();

          if (!existingPattern) {
            console.log(`[Scheduler] Pattern snapshot is missing for weekly summary ${summary.id}. Repairing...`);
            const jobId = await IntelligenceOrchestrator.enqueueJob(userId, 'patterns', `WeeklyMaintenance:PatternRepair:${summary.id}`);
            await queueRegistry.addJob('pattern_processing', `pattern_weekly_repair_${summary.id}`, {
              entry_id: summary.id,
              user_id: userId,
              cycle_id: summary.cycle_id,
              source_type: 'weekly_report',
              orchestrator_job_id: jobId
            });
          }
        }
      }
    } catch (err: any) {
      console.error('[Scheduler] Error verifying weekly pattern snapshots:', err.message);
    }
  }

  /**
   * Run Monthly Maintenance checks and repairs.
   * Checks assessment eligibility and monthly report availability.
   */
  public static async runMonthlyMaintenance(userId: string): Promise<void> {
    console.log(`[Scheduler] Running Monthly Maintenance for user ${userId}`);

    const { queueRegistry } = await import('../queue/registry');

    // 1. Assessment eligibility check
    let activeCycleId = '';
    try {
      const { data: activeCycle } = await supabase
        .from('cycles')
        .select('id, start_date, status, assessment_completed, assessment_available')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (activeCycle) {
        activeCycleId = activeCycle.id;

        const { data: maxEntry } = await supabase
          .from('entries')
          .select('cycle_day')
          .eq('user_id', userId)
          .eq('cycle_id', activeCycle.id)
          .order('cycle_day', { ascending: false })
          .limit(1)
          .maybeSingle();

        const startDateMs = new Date(activeCycle.start_date).getTime();
        const calculatedDay = Math.max(1, Math.floor((Date.now() - startDateMs) / (1000 * 60 * 60 * 24)) + 1);
        const cycleDay = Math.max(maxEntry?.cycle_day || 0, calculatedDay);

        const isCycleCompleted = activeCycle.status === 'COMPLETED' || activeCycle.status === 'completed' || activeCycle.assessment_completed;
        const isDay28Eligible = Boolean(activeCycle.assessment_available) && (maxEntry?.cycle_day || 0) >= 28;
        const isAssessmentDue = isCycleCompleted || isDay28Eligible;

        if (isAssessmentDue) {
          // Check if assessment already exists
          const { data: existingAssessment } = await supabase
            .from('assessments')
            .select('id')
            .eq('cycle_id', activeCycle.id)
            .maybeSingle();

          if (!existingAssessment) {
            console.log(`[Scheduler] Assessment is overdue for cycle ${activeCycle.id}. Scheduling...`);
            const { count } = await supabase
              .from('assessments')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', userId);
            const monthNum = (count || 0) + 1;

            const { data: assessment } = await supabase
              .from('assessments')
              .insert({
                user_id: userId,
                cycle_id: activeCycle.id,
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
              .select()
              .single();

            if (assessment) {
              const jobId = await IntelligenceOrchestrator.enqueueJob(userId, 'assessment', 'MonthlyMaintenance:AssessmentOverdue');
              await queueRegistry.addJob('monthly_report_generation', `assessment_${assessment.id}`, {
                cycle_id: activeCycle.id,
                user_id: userId,
                assessment_id: assessment.id,
                month_number: monthNum,
                orchestrator_job_id: jobId
              });
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[Scheduler] Error checking monthly assessment eligibility:', err.message);
    }

    // 2. Monthly report eligibility check (re-enqueueing failed or missing report generation jobs)
    try {
      if (activeCycleId) {
        const { data: assessments } = await supabase
          .from('assessments')
          .select('id, generation_status')
          .eq('cycle_id', activeCycleId);

        if (assessments) {
          for (const ass of assessments) {
            if (ass.generation_status === 'pending' || ass.generation_status === 'failed') {
              console.log(`[Scheduler] Monthly report for assessment ${ass.id} is in status "${ass.generation_status}". Re-scheduling generation...`);
              
              const { count } = await supabase
                .from('assessments')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId);
              const monthNum = count || 1;

              const jobId = await IntelligenceOrchestrator.enqueueJob(userId, 'assessment', `MonthlyMaintenance:AssessmentRepair:${ass.id}`);
              await queueRegistry.addJob('monthly_report_generation', `assessment_repair_${ass.id}`, {
                cycle_id: activeCycleId,
                user_id: userId,
                assessment_id: ass.id,
                month_number: monthNum,
                orchestrator_job_id: jobId
              });
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[Scheduler] Error checking monthly report eligibility:', err.message);
    }
  }

  /**
   * Run All Maintenance schedules for a user.
   */
  public static async runAllMaintenance(userId: string): Promise<void> {
    await this.runDailyMaintenance(userId);
    await this.runWeeklyMaintenance(userId);
    await this.runMonthlyMaintenance(userId);
  }

  /**
   * Run System Maintenance for ALL users across the platform automatically.
   */
  public static async runSystemMaintenanceForAllUsers(): Promise<void> {
    console.log('[Scheduler] Running System Maintenance for ALL platform users...');
    const { data: users } = await supabase.from('users').select('id');
    if (users) {
      for (const user of users) {
        try {
          await this.runAllMaintenance(user.id);
        } catch (err: any) {
          console.error(`[Scheduler] Error running maintenance for user ${user.id}:`, err.message);
        }
      }
    }
  }
}
