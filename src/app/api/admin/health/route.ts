import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { IntelligenceOrchestrator } from '../../../../lib/orchestrator/intelligenceOrchestrator';
import { requireAuthorizedAdmin } from '../../../../lib/auth/adminAuthHelper';

/**
 * GET /api/admin/health: Production Health Dashboard & Pipeline Audit API
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuthorizedAdmin(request);
    const userId = request.nextUrl.searchParams.get('userId');

    // 1. Queue Status & Failed Jobs
    const { data: queuedJobs } = await supabase
      .from('orchestrator_jobs')
      .select('*')
      .eq('status', 'queued');

    const { data: runningJobs } = await supabase
      .from('orchestrator_jobs')
      .select('*')
      .eq('status', 'running');

    const { data: failedJobs } = await supabase
      .from('orchestrator_jobs')
      .select('*')
      .eq('status', 'failed')
      .order('queued_at', { ascending: false })
      .limit(50);

    // 2. Engine Health Metrics for specified user or system-wide sample
    const engines = ['crisis_detection', 'reflection', 'scoring', 'vocabulary', 'patterns', 'knowledge', 'weekly_report'];
    const engineHealthMap: Record<string, any> = {};

    if (userId) {
      for (const eng of engines) {
        engineHealthMap[eng] = await IntelligenceOrchestrator.getEngineHealth(userId, eng);
      }
    } else {
      // Return general system status
      for (const eng of engines) {
        const { data: jobs } = await supabase
          .from('orchestrator_jobs')
          .select('status, attempts, last_error')
          .eq('engine', eng)
          .order('queued_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        engineHealthMap[eng] = {
          engine: eng,
          status: jobs ? (jobs.status === 'failed' ? 'Failed' : jobs.status === 'running' ? 'Processing' : 'Healthy') : 'Healthy',
          last_error: jobs?.last_error || null
        };
      }
    }

    // 3. Pending Reports
    const { count: pendingWeeklyReports } = await supabase
      .from('weekly_summaries')
      .select('id', { count: 'exact', head: true })
      .in('status', ['PENDING', 'pending', 'WAITING_FOR_PROCESSING', 'GRACE_PERIOD']);

    // 4. Missing Snapshots Audit
    const { count: totalEntries } = await supabase.from('entries').select('id', { count: 'exact', head: true });
    const { count: totalReflections } = await supabase.from('reflections').select('id', { count: 'exact', head: true });
    const { count: totalScores } = await supabase.from('journal_scores').select('id', { count: 'exact', head: true });
    const { count: totalVocab } = await supabase.from('vocab_extractions').select('id', { count: 'exact', head: true });

    const missingReflectionsCount = Math.max(0, (totalEntries || 0) - (totalReflections || 0));
    const missingScoresCount = Math.max(0, (totalEntries || 0) - (totalScores || 0));
    const missingVocabCount = Math.max(0, (totalEntries || 0) - (totalVocab || 0));

    // 5. Recent System Events
    const { data: recentEvents } = await supabase
      .from('orchestrator_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        status: (failedJobs && failedJobs.length > 5) ? 'DEGRADED' : 'HEALTHY',
        activeQueuedCount: queuedJobs?.length || 0,
        activeRunningCount: runningJobs?.length || 0,
        failedJobCount: failedJobs?.length || 0,
        missingArtifacts: {
          reflections: missingReflectionsCount,
          scores: missingScoresCount,
          vocabulary: missingVocabCount
        },
        pendingReports: {
          weekly: pendingWeeklyReports || 0
        }
      },
      engineHealth: engineHealthMap,
      recentEvents: recentEvents || [],
      failedJobs: failedJobs || []
    });

  } catch (error: any) {
    console.error('Health API Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
