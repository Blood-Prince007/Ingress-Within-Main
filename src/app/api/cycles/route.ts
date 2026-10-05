import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/db';
import { getAuthenticatedUser } from '../../../lib/auth-helper';

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

    // 1. Fetch all cycles metadata, ordered by cycle_number descending
    const { data: cycles, error: cyclesErr } = await supabase
      .from('cycles')
      .select('id, user_id, status, total_days, created_at, start_date, end_date, assessment_completed, assessment_available, entries_count, days_completed, current_day, cycle_number')
      .eq('user_id', userId)
      .order('cycle_number', { ascending: false });

    let cyclesToProcess: any[] = cycles || [];

    if (cyclesErr) {
      console.warn('Querying with cycle_number failed, falling back to number:', cyclesErr.message);
      const fallbackRes = await supabase
        .from('cycles')
        .select('id, user_id, number, status, total_days, created_at, start_date, end_date, assessment_completed, assessment_available, entries_count, days_completed, current_day')
        .eq('user_id', userId)
        .order('number', { ascending: false });
      
      if (fallbackRes.error) {
        throw new Error(`Failed to fetch cycles: ${fallbackRes.error.message}`);
      }
      
      cyclesToProcess = fallbackRes.data || [];
    }

    const clientDateStr = request.headers.get('x-client-date');
    let todayMidnight: Date;
    if (clientDateStr) {
      todayMidnight = new Date(clientDateStr + 'T00:00:00Z');
    } else {
      const today = new Date();
      todayMidnight = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    }

    // Authoritatively compute actual entries count from the entries table
    const cycleIds = cyclesToProcess.map((c: any) => c.id);
    const countsMap: Record<string, number> = {};
    if (cycleIds.length > 0) {
      const { data: entriesForCycles } = await supabase
        .from('entries')
        .select('cycle_id')
        .eq('user_id', userId)
        .in('cycle_id', cycleIds);

      (entriesForCycles || []).forEach((e: any) => {
        if (e.cycle_id) {
          countsMap[e.cycle_id] = (countsMap[e.cycle_id] || 0) + 1;
        }
      });
    }

    // Check existing assessments table for user
    const { data: userAssessments } = await supabase
      .from('assessments')
      .select('cycle_id, generation_status')
      .eq('user_id', userId);

    const assessmentCycleMap = new Set<string>(
      (userAssessments || []).map((a: any) => String(a.cycle_id))
    );

    const cyclesMetadata = cyclesToProcess.map((cy: any) => {
      let activeDay = cy.current_day || 1;
      const isCycleActive = cy.status?.toUpperCase() === 'ACTIVE' || cy.status?.toUpperCase() === 'ARCHIVED';
      if (isCycleActive && cy.start_date && !cy.end_date) {
        const startDateStr = cy.start_date.split('T')[0];
        const startMidnight = new Date(startDateStr + 'T00:00:00Z');
        const diffTime = todayMidnight.getTime() - startMidnight.getTime();
        const calculatedDay = Math.floor(diffTime / (24 * 60 * 60 * 1000)) + 1;
        activeDay = Math.min(cy.total_days || 30, Math.max(cy.current_day || 1, calculatedDay));
      }
      const progressPercentage = Math.round((activeDay / (cy.total_days || 30)) * 100);
      const actualEntriesCount = countsMap[cy.id] !== undefined ? countsMap[cy.id] : (cy.entries_count || 0);

      const cycleNum = cy.cycle_number !== undefined ? cy.cycle_number : cy.number;
      const hasAssessment = assessmentCycleMap.has(String(cy.id)) || assessmentCycleMap.has(String(cycleNum));
      const isCompleted = Boolean(cy.assessment_completed || hasAssessment || cy.status?.toLowerCase() === 'completed');
      const isAvailable = Boolean(cy.assessment_available || hasAssessment || isCompleted || activeDay >= 28);
      
      return {
        id: cy.id,
        cycle_number: cycleNum,
        status: cy.status,
        current_day: activeDay,
        total_days: cy.total_days || 30,
        progress_percentage: Math.min(100, progressPercentage),
        entries_count: actualEntriesCount,
        open_threads_count: 0, // Loaded on-demand
        weekly_summaries_count: 0, // Loaded on-demand
        vocabulary_count: 0, // Loaded on-demand
        start_date: cy.start_date || cy.started_at,
        end_date: cy.end_date || cy.ended_at,
        assessment_completed: isCompleted,
        assessment_available: isAvailable,
        has_assessment: hasAssessment,
        entries: null // Loaded on-demand
      };
    });

    return NextResponse.json({
      success: true,
      cycles: cyclesMetadata
    });

  } catch (error: any) {
    console.error('[API Cycles List] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
