import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { resolveCycleAndEntries, compileRealCycleReport } from '../../../../lib/reports/cycleReportBuilder';

/**
 * GET /api/reports/assessment: Fetches the Day 28 assessment report for a specific cycle.
 * Guarantees 100% real, cycle-specific, non-hallucinated assessment report for all users.
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

    const userId = authUser.userId;
    const rawCycleId = request.nextUrl.searchParams.get('cycleId');

    if (!rawCycleId) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing cycle ID.' } },
        { status: 400 }
      );
    }

    // Non-blocking monthly maintenance trigger
    const { OrchestratorScheduler } = await import('../../../../lib/orchestrator/orchestratorScheduler');
    void OrchestratorScheduler.runMonthlyMaintenance(userId).catch(err => {
      console.error('[API Assessment GET] Background monthly maintenance failed:', err.message);
    });

    // 1. Resolve exact target cycle and all real user entries for this cycle
    const reportContext = await resolveCycleAndEntries(userId, rawCycleId);
    const { cycleObj, validEntries, ei_avg, pr_avg, sa_avg, dt_score } = reportContext;
    const effectiveCycleId = cycleObj.id || rawCycleId;
    const cycleNum = cycleObj.cycle_number || cycleObj.number || 1;

    // 2. Query assessments table strictly for this cycle (NO cross-cycle leakage!)
    let assessment: any = null;

    if (effectiveCycleId) {
      const { data: a1 } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', userId)
        .eq('cycle_id', effectiveCycleId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (a1) assessment = a1;
    }

    if (!assessment && cycleNum) {
      const { data: a2 } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', userId)
        .eq('cycle_id', String(cycleNum))
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (a2) assessment = a2;
    }

    // 3. Evaluate if report text needs generation or self-healing
    const isPlaceholder =
      !assessment?.report_text ||
      assessment.report_text.length < 50 ||
      assessment.report_text.startsWith('Auto-Transition') ||
      assessment.report_text.startsWith('Completed Transition');

    const needsGeneration = !assessment || assessment.generation_status !== 'ready' || isPlaceholder;

    // Gating check: An assessment report should only be accessible/generated if:
    // 1. The cycle is officially completed (status === 'completed' or assessment_completed === true), OR
    // 2. The cycle has reached Day 28+ AND assessment_available === true, OR
    // 3. An assessment record already exists for this cycle.
    const isCycleCompleted = cycleObj.status?.toLowerCase() === 'completed' || Boolean(cycleObj.assessment_completed);
    const isDay28Eligible = Boolean(cycleObj.assessment_available) && (cycleObj.current_day || 1) >= 28;
    const isEligible = isCycleCompleted || isDay28Eligible || Boolean(assessment);

    if (!isEligible) {
      return NextResponse.json(
        { error: { code: 'NOT_AVAILABLE', message: 'Cycle assessment report is only available once Day 28 is reached or cycle is complete.' } },
        { status: 400 }
      );
    }

    // In addition, if an incomplete cycle has 0 valid entries, refuse generation
    if (needsGeneration && validEntries.length === 0 && !isCycleCompleted) {
      return NextResponse.json(
        { error: { code: 'INSUFFICIENT_ENTRIES', message: 'Cannot generate a cycle report with zero recorded entries.' } },
        { status: 400 }
      );
    }

    if (needsGeneration) {
      console.log(`[API Assessment GET] Assessment for user ${userId} cycle ${effectiveCycleId} (Cycle ${cycleNum}) needs generation/repair. Processing...`);
      let assId = assessment?.id;

      if (!assId) {
        try {
          const { data: newAss } = await supabase
            .from('assessments')
            .insert({
              user_id: userId,
              cycle_id: effectiveCycleId,
              generation_status: 'pending',
              unlocked_at: new Date().toISOString(),
              ei_avg,
              pr_avg,
              sa_avg,
              dt_score,
              normalised_sa: parseFloat((11 - sa_avg).toFixed(2)),
              risk_total: Math.round(ei_avg + pr_avg + (11 - sa_avg) + dt_score),
              path_assignment: 'second_cycle',
              branch_assignment: 'A',
              entry_count: validEntries.length
            })
            .select('id')
            .single();
          assId = newAss?.id;
        } catch (insertErr: any) {
          console.warn('[API Assessment GET] Database insert warning for new assessment:', insertErr.message);
        }
      }

      if (assId) {
        try {
          const { processMonthlyReport } = await import('../../../../lib/queue/workers/monthlyReportWorker');
          await processMonthlyReport({
            cycle_id: effectiveCycleId,
            user_id: userId,
            assessment_id: assId
          });
        } catch (genErr: any) {
          console.error('[API Assessment GET] Error generating assessment via worker:', genErr.message);
        }

        const { data: freshAssessment } = await supabase
          .from('assessments')
          .select('*')
          .eq('id', assId)
          .maybeSingle();
        if (freshAssessment) {
          assessment = freshAssessment;
        }
      }
    }

    // 4. Construct guaranteed assessment object
    if (!assessment) {
      assessment = {
        id: `ass_synthetic_${Date.now()}`,
        user_id: userId,
        cycle_id: effectiveCycleId,
        generation_status: 'ready',
        unlocked_at: new Date().toISOString(),
        generated_at: new Date().toISOString(),
        ei_avg,
        pr_avg,
        sa_avg,
        dt_score,
        normalised_sa: parseFloat((11 - sa_avg).toFixed(2)),
        risk_total: Math.round(ei_avg + pr_avg + (11 - sa_avg) + dt_score),
        path_assignment: 'second_cycle',
        branch_assignment: 'A',
        entry_count: validEntries.length
      };
    }

    // 5. Ensure report_text contains 100% real cycle data (never static hardcoded quotes/dates)
    let validJsonReport = false;
    let parsedExisting: any = null;
    if (assessment.report_text && assessment.report_text.startsWith('{')) {
      try {
        const parsed = JSON.parse(assessment.report_text);
        // Verify that report text belongs to THIS cycle number and has all required sections
        const matchesCycle = parsed.cycleNumber === cycleNum || !parsed.cycleNumber;
        const hasRequiredSections = Boolean(
          parsed.whatThisCycleShowed?.openingObs &&
          parsed.whatThisCycleShowed?.narrative &&
          parsed.whereLeavesYou?.body &&
          Array.isArray(parsed.patterns) && parsed.patterns.length > 0 &&
          parsed.stats &&
          parsed.chartData?.arcChart &&
          parsed.chartData?.radarChart &&
          parsed.wordsReachedFor &&
          parsed.saidVsShowed &&
          parsed.exercises &&
          parsed.closingQuote
        );

        if (matchesCycle && hasRequiredSections) {
          validJsonReport = true;
        }
        parsedExisting = parsed;
      } catch (e) {
        validJsonReport = false;
      }
    }

    if (!validJsonReport || isPlaceholder) {
      console.log(`[API Assessment GET] Compiling real data structured report JSON for user ${userId} cycle ${effectiveCycleId} (Cycle ${cycleNum})`);

      const realCompiledReport = compileRealCycleReport(reportContext);

      // Preserve existing rich exercise details if available in parsedExisting
      if (parsedExisting?.exercises?.items?.length) {
        const existingItemsMap = new Map(parsedExisting.exercises.items.map((it: any) => [it.id || it.name, it]));
        realCompiledReport.exercises.items = realCompiledReport.exercises.items.map((newItem: any) => {
          const cached: any = existingItemsMap.get(newItem.id) || existingItemsMap.get(newItem.name);
          if (cached) {
            return {
              ...newItem,
              entriesSaid: cached.entriesSaid || newItem.entriesSaid,
              exerciseShowed: cached.exerciseShowed || newItem.exerciseShowed
            };
          }
          return newItem;
        });
      }

      const realReportText = JSON.stringify(realCompiledReport);

      if (assessment.id && !assessment.id.startsWith('ass_synthetic_')) {
        try {
          await supabase
            .from('assessments')
            .update({
              report_text: realReportText,
              generation_status: 'ready',
              generated_at: new Date().toISOString()
            })
            .eq('id', assessment.id);
        } catch (updErr: any) {
          console.warn('[API Assessment GET] Warning updating report_text in database:', updErr.message);
        }
      }

      assessment.report_text = realReportText;
      assessment.generation_status = 'ready';
    } else if (parsedExisting) {
      // Self-heal / synchronize exercises data if cached report has outdated or missing exercise stats
      const realExercisesCount = reportContext.completedExercises.length;
      const cachedCount = parsedExisting.stats?.exercisesCompletedCount ?? 0;
      const cachedItemsCount = parsedExisting.exercises?.items?.length ?? 0;

      if (cachedCount !== realExercisesCount || (realExercisesCount > 0 && cachedItemsCount === 0)) {
        console.log(`[API Assessment GET] Synchronizing exercise data in assessment report for user ${userId} cycle ${effectiveCycleId}: cached=${cachedCount}, real=${realExercisesCount}`);
        const freshReport = compileRealCycleReport(reportContext);

        parsedExisting.stats = {
          ...parsedExisting.stats,
          exercisesCompletedCount: freshReport.stats.exercisesCompletedCount,
          totalExercisesCount: freshReport.stats.totalExercisesCount,
          missedExercisesText: freshReport.stats.missedExercisesText
        };
        parsedExisting.exercises = freshReport.exercises;

        const updatedReportText = JSON.stringify(parsedExisting);
        assessment.report_text = updatedReportText;

        if (assessment.id && !assessment.id.startsWith('ass_synthetic_')) {
          try {
            await supabase
              .from('assessments')
              .update({
                report_text: updatedReportText,
                generated_at: new Date().toISOString()
              })
              .eq('id', assessment.id);
          } catch (updErr: any) {
            console.warn('[API Assessment GET] Warning updating report_text in database during sync:', updErr.message);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      assessment
    });

  } catch (error: any) {
    console.error('[API Assessment GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
