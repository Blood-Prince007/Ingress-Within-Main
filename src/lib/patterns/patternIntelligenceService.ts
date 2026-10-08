import { supabase } from '../db';
import { getBackfillStatus, updateBackfillStatus } from './patternBackfillStatus';
import { decrypt } from '../encryption';


// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface Milestone {
  id: string; // weekly_summaries.id OR cycles.id
  type: 'weekly_report' | 'cycle_summary';
  cycleId: string; // the cycle ID it belongs to
  weekNumber?: number; // only for weekly_report
  cycleNumber: number; // the cycle number
  createdAt: string;
  isCompleted: boolean;
}

export type PatternLifecycleStatus = 'emerging' | 'active' | 'quiet' | 're_emerging';

export interface PatternCard {
  id: string;
  name: string;
  status: 'present' | 'shifting' | 'quiet' | 'new' | 'returned' | 'emerging' | 'active' | 're_emerging' | 'absent';
  lifecycleStatus: PatternLifecycleStatus;
  body: string;
  meta: string;
  orientation: string;
  timeline: string[];
  firstAppeared: string;
  firstObservedCycle: number;
  lastActiveCycle: number;
  quietSinceCycle?: number;
  reEmergedCycle?: number;
  historicalStrength: 'strong' | 'moderate' | 'emerging';
  currentActivity: 'high' | 'moderate' | 'low';
  confidence: number;
  totalOccurrences: number;
  connectedPatterns: string[];
}

export interface LifecycleGroup {
  active: PatternCard[];
  emerging: PatternCard[];
  reEmerging: PatternCard[];
  quiet: PatternCard[];
}

export interface PatternDetail {
  name: string;
  status: string;
  lifecycleStatus: PatternLifecycleStatus;
  badgeClass: string;
  body: string;
  meta: string;
  orientation: string;
  historicalStrength: 'strong' | 'moderate' | 'emerging';
  currentActivity: 'high' | 'moderate' | 'low';
  firstObservedCycle: number;
  lastActiveCycle: number;
  quietSinceCycle?: number;
  reEmergedCycle?: number;
  connected: boolean;
  connectedBody: string;
  connectedLinks: { label: string; id: string }[];
  timeline: { n: number; s: string; l: string; milestoneLabel?: string }[];
  cycleData: Record<number, { obs: string; entries: { t: string; m: string }[] }>;
}

export interface SummaryStrip {
  sentence: string;
  present: number;
  shifting: number;
  quiet: number;
  new: number;
  returned: number;
  active?: number;
  emerging?: number;
  reEmerging?: number;
}

export interface ConnectedPattern {
  name: string;
  coOccurrences: number;
}

export interface PatternTransition {
  patternName: string;
  from: string;
  to: string;
  cycleNumber: number;
}

export interface PatternOverview {
  patterns: PatternCard[];
  lifecycle: LifecycleGroup;
  hasHistoricalPatterns: boolean;
  summary: SummaryStrip;
  totalCyclesObserved: number;
  isAvailable: boolean;
  snapshots?: any[];
  userState?: PatternUserState;
}

export type PatternUserStateType = 'new_user' | 'backfill_pending' | 'active';

export interface PatternUserState {
  state: PatternUserStateType;
  reason: string;
  hasSnapshots: boolean;
  backfillCompleted: boolean;
  backfillStatus?: any;
}


// In-memory cache for connected patterns
const connectedPatternsCache = new Map<string, { data: ConnectedPattern[]; expires: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

// ─── Main Service ────────────────────────────────────────────────────────────

export class PatternIntelligenceService {
  /**
   * Generates a unique URL-friendly slug/id for a pattern name.
   */
  /**
   * Evaluates historical strength based on total occurrences and cycle observation depth.
   */
  public static calculateHistoricalStrength(occurrences: number, cyclesObserved: number): 'strong' | 'moderate' | 'emerging' {
    if (occurrences >= 4 || cyclesObserved >= 3) return 'strong';
    if (occurrences >= 2 || cyclesObserved >= 2) return 'moderate';
    return 'emerging';
  }

  /**
   * Evaluates current activity based on recency, confidence, and observation gaps.
   */
  public static calculateCurrentActivity(currentScore: number, confidence: number, weeksAbsent: number): 'high' | 'moderate' | 'low' {
    if (weeksAbsent === 0 && currentScore >= 6.0 && confidence >= 0.7) return 'high';
    if (weeksAbsent === 0 && currentScore >= 3.5) return 'moderate';
    if (weeksAbsent === 1 && currentScore >= 5.0) return 'moderate';
    return 'low';
  }

  public static getPatternSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Retrieves overview data of all patterns.
   * Pure read-only. NEVER calls AI. NEVER writes.
   */
  /**
   * Determines what user state the Pattern Engine should present.
   * Returns 'new_user', 'backfill_pending', or 'active'.
   * This is the single authoritative decision point for user state routing.
   */
  public static async determinePatternUserState(userId: string): Promise<PatternUserState> {
    // 1. Check database backfill status
    const status = (await getBackfillStatus(userId)) || {
      user_id: userId,
      status: 'NOT_STARTED' as const,
      progress_total_cycles: 0,
      progress_processed_cycles: 0,
      progress_total_entries: 0,
      progress_processed_entries: 0,
      snapshot_created: false,
      error_message: null,
      queued_at: null,
      started_at: null,
      completed_at: null,
      failed_at: null
    };

    // 2. Fetch snapshot count excluding dummy snapshot
    let snapshotCount = 0;
    try {
      const { count, error: snapErr } = await supabase
        .from('pattern_snapshots')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .neq('cycle_id', '00000000-0000-0000-0000-000000000000');

      if (!snapErr) {
        snapshotCount = count || 0;
      }
    } catch {}

    // If backfill is completed, state is active
    if (status.status === 'COMPLETED') {
      return {
        state: 'active',
        reason: 'Pattern backfill completed.',
        hasSnapshots: snapshotCount > 0,
        backfillCompleted: true,
        backfillStatus: status
      };
    }

    // If backfill is in progress / queued
    if (status.status === 'QUEUED' || status.status === 'PROCESSING') {
      return {
        state: 'backfill_pending',
        reason: `Pattern backfill state is ${status.status}.`,
        hasSnapshots: snapshotCount > 0,
        backfillCompleted: false,
        backfillStatus: status
      };
    }

    // If backfill failed
    if (status.status === 'FAILED') {
      return {
        state: 'backfill_pending', // Treat as pending/failed to allow retry on frontend
        reason: 'Pattern backfill failed.',
        hasSnapshots: snapshotCount > 0,
        backfillCompleted: false,
        backfillStatus: status
      };
    }

    // Otherwise status is NOT_STARTED
    // Check if snapshots exist from some other source (e.g. prior runs)
    if (snapshotCount > 0) {
      // Auto-mark status as completed in DB to stay in sync
      await updateBackfillStatus(userId, { status: 'COMPLETED', snapshot_created: true });
      return {
        state: 'active',
        reason: 'Pattern snapshots exist.',
        hasSnapshots: true,
        backfillCompleted: true,
        backfillStatus: { ...status, status: 'COMPLETED', snapshot_created: true }
      };
    }

    // Check profiles flag
    let backfillCompletedFlag = false;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('pattern_backfill_completed')
        .eq('id', userId)
        .maybeSingle();

      backfillCompletedFlag = profile?.pattern_backfill_completed === true;
    } catch {}

    if (backfillCompletedFlag) {
      await updateBackfillStatus(userId, { status: 'COMPLETED', snapshot_created: snapshotCount > 0 });
      return {
        state: 'active',
        reason: 'Backfill already completed flag set.',
        hasSnapshots: snapshotCount > 0,
        backfillCompleted: true,
        backfillStatus: { ...status, status: 'COMPLETED', snapshot_created: snapshotCount > 0 }
      };
    }

    // Check historical evidence
    let hasEvidence = false;
    try {
      // Check weekly reports first (strongest signal for "existing user").
      const { count: reportCount } = await supabase
        .from('weekly_summaries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['READY', 'ready']);

      if (reportCount && reportCount > 0) {
        hasEvidence = true;
      } else {
        // Fall back: check raw entry count.
        const { count: entryCount } = await supabase
          .from('entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .neq('entry_type', 'empty');

        hasEvidence = (entryCount || 0) >= 5;
      }
    } catch {
      hasEvidence = false;
    }

    if (hasEvidence) {
      return {
        state: 'new_user', // Frontend should trigger/queue the backfill
        reason: 'User has historical data eligible for backfill.',
        hasSnapshots: false,
        backfillCompleted: false,
        backfillStatus: status
      };
    }

    return {
      state: 'new_user',
      reason: 'No completed weekly reports or sufficient entries found.',
      hasSnapshots: false,
      backfillCompleted: false,
      backfillStatus: status
    };
  }

  /**
   * Retrieves overview data of all patterns.
   * Pure read-only. NEVER calls AI. NEVER writes. NEVER triggers backfill.
   * State routing must be handled by the caller using determinePatternUserState().
   */
  public static async getPatternOverview(userId: string): Promise<PatternOverview> {
    // 1. Fetch all snapshots for the user ordered by cycle_number ascending
    let snapshots: any[] = [];
    try {
      const { data, error: snapshotsErr } = await supabase
        .from('pattern_snapshots')
        .select('*')
        .eq('user_id', userId)
        .neq('cycle_id', '00000000-0000-0000-0000-000000000000')
        .order('cycle_number', { ascending: true });

      if (snapshotsErr) {
        if (snapshotsErr.code === 'PGRST205' || snapshotsErr.message?.includes('pattern_snapshots')) {
          console.warn('[PatternIntelligenceService] Table "pattern_snapshots" does not exist in schema. Returning empty overview.');
          return this.getEmptyOverview();
        }
        console.error('[PatternIntelligenceService] Error fetching snapshots:', snapshotsErr.message);
        throw snapshotsErr;
      }
      snapshots = data || [];
    } catch (err: any) {
      if (err.code === 'PGRST205' || err.message?.includes('pattern_snapshots')) {
        console.warn('[PatternIntelligenceService] Table "pattern_snapshots" does not exist in schema. Returning empty overview.');
        return this.getEmptyOverview();
      }
      throw err;
    }

    if (!snapshots || snapshots.length === 0) {
      return this.getEmptyOverview();
    }

    const orderedSnapshots = await this.resolveActualCycleSnapshots(userId, snapshots);

    const latestSnapshot = orderedSnapshots[orderedSnapshots.length - 1];
    const totalCycles = orderedSnapshots.length;
    const latestData = latestSnapshot.snapshot_data || {};
    const latestPatterns = latestData.patterns || [];

    // Gather all unique pattern slugs and their cleanest display names ever observed to build full history
    const patternSlugMap = new Map<string, string>();
    orderedSnapshots.forEach(snap => {
      const snapPatterns = snap.snapshot_data?.patterns || [];
      snapPatterns.forEach((p: any) => {
        const pName = p.pattern_name || p.name;
        if (pName && typeof pName === 'string' && pName.trim()) {
          const cleanName = pName.trim();
          const slug = this.getPatternSlug(cleanName);
          if (!slug) return;
          if (!patternSlugMap.has(slug)) {
            patternSlugMap.set(slug, cleanName);
          } else {
            // Prefer clean formatting without enclosing quotes
            const currentName = patternSlugMap.get(slug)!;
            const currentHasQuotes = /^["'].*["']$/.test(currentName);
            const newHasQuotes = /^["'].*["']$/.test(cleanName);
            if (currentHasQuotes && !newHasQuotes) {
              patternSlugMap.set(slug, cleanName);
            }
          }
        }
      });
    });

    const cards: PatternCard[] = [];

    patternSlugMap.forEach((name, slug) => {
      // Find this pattern in the latest snapshot by slug
      const currentPat = latestPatterns.find((p: any) => {
        const pName = p.pattern_name || p.name;
        return pName && this.getPatternSlug(pName) === slug;
      });
      
      let status: 'present' | 'shifting' | 'quiet' | 'new' | 'returned' | 'emerging' | 'active' | 're_emerging' | 'absent' = 'quiet';
      let lifecycleStatus: PatternLifecycleStatus = 'quiet';
      let body = '';
      let orientation = '';
      let totalOccurrences = 0;
      let firstAppearedCycle = totalCycles;
      let lastAppearedCycle = 1;
      let lastActiveCycle = 1;
      let quietSinceCycle: number | undefined = undefined;
      let reEmergedCycle: number | undefined = undefined;
      let connected: string[] = [];
      let latestConfidence = 0.8;
      let latestEvidenceScore = 0.0;
      let cyclesObservedCount = 0;

      // Find first/last appearance and gather stats
      orderedSnapshots.forEach(snap => {
        const snapPat = (snap.snapshot_data?.patterns || []).find((p: any) => {
          const pName = p.pattern_name || p.name;
          return pName && this.getPatternSlug(pName) === slug;
        });
        if (snapPat && snapPat.status !== 'absent' && snapPat.status !== 'quiet' && snapPat.lifecycle_status !== 'quiet') {
          if (snap.cycle_number < firstAppearedCycle) {
            firstAppearedCycle = snap.cycle_number;
          }
          if (snap.cycle_number > lastAppearedCycle) {
            lastAppearedCycle = snap.cycle_number;
            lastActiveCycle = snap.cycle_number;
          }
          totalOccurrences += 1;
          cyclesObservedCount += 1;
        }
      });

      if (currentPat) {
        status = currentPat.status || 'present';
        lifecycleStatus = currentPat.lifecycle_status || (
          status === 'quiet' || status === 'absent' ? 'quiet' :
          status === 'returned' ? 're_emerging' :
          status === 'new' ? (totalOccurrences >= 2 ? 'active' : 'emerging') :
          'active'
        );
        body = currentPat.summary || currentPat.body || '';
        orientation = currentPat.why_it_matters || currentPat.orientation || '';
        connected = currentPat.connected_patterns || [];
        latestConfidence = currentPat.confidence ?? 0.8;
        latestEvidenceScore = currentPat.evidence_score ?? (lifecycleStatus === 'quiet' ? 0.0 : 5.0);
        quietSinceCycle = currentPat.quiet_since || (lifecycleStatus === 'quiet' ? (currentPat.week_number || lastActiveCycle) : undefined);
        reEmergedCycle = currentPat.re_emerged_at;
      } else {
        lifecycleStatus = 'quiet';
        status = 'quiet';
        body = 'Observed in earlier entries. Currently quiet in your recent writing.';
        orientation = `This pattern was observed earlier and has been quieter in your recent entries (last active Cycle ${lastActiveCycle}).`;
        quietSinceCycle = lastActiveCycle + 1;
      }

      // Build timeline array across ALL cycles chronologically
      const timeline: string[] = [];
      for (let c = 1; c <= totalCycles; c++) {
        const cycleSnap = orderedSnapshots.find(s => s.cycle_number === c);
        const cyclePat = (cycleSnap?.snapshot_data?.patterns || []).find((p: any) => {
          const pName = p.pattern_name || p.name;
          return pName && this.getPatternSlug(pName) === slug;
        });
        if (cyclePat) {
          timeline.push(cyclePat.lifecycle_status || cyclePat.status || 'absent');
        } else {
          timeline.push('absent');
        }
      }

      const weeksAbsent = lifecycleStatus === 'quiet' ? Math.max(1, totalCycles - lastActiveCycle) : 0;
      const historicalStrength = PatternIntelligenceService.calculateHistoricalStrength(totalOccurrences, cyclesObservedCount);
      const currentActivity = PatternIntelligenceService.calculateCurrentActivity(latestEvidenceScore, latestConfidence, weeksAbsent);

      const firstSeenLabel = `Cycle ${firstAppearedCycle}`;
      const lastSeenLabel = `Cycle ${lastActiveCycle}`;

      let meta = '';
      if (lifecycleStatus === 'quiet') {
        meta = `Observed: ${firstSeenLabel} · Quieter recently (last active ${lastSeenLabel})`;
      } else if (lifecycleStatus === 're_emerging') {
        meta = `Observed: ${firstSeenLabel} · Re-appearing in recent entries`;
      } else if (lifecycleStatus === 'emerging') {
        meta = `First observed: ${firstSeenLabel}`;
      } else {
        meta = `Observed: ${firstSeenLabel} · Active across ${totalOccurrences} cycles`;
      }

      cards.push({
        id: this.getPatternSlug(name),
        name,
        status,
        lifecycleStatus,
        body,
        meta,
        orientation,
        timeline,
        firstAppeared: firstSeenLabel,
        firstObservedCycle: firstAppearedCycle,
        lastActiveCycle: lastActiveCycle,
        quietSinceCycle,
        reEmergedCycle,
        historicalStrength,
        currentActivity,
        confidence: latestConfidence,
        totalOccurrences,
        connectedPatterns: connected
      });
    });

    // Count states
    let activeCount = 0;
    let emergingCount = 0;
    let reEmergingCount = 0;
    let quietCount = 0;
    let presentCount = 0;
    let shiftingCount = 0;
    let newCount = 0;
    let returnedCount = 0;

    cards.forEach(c => {
      if (c.lifecycleStatus === 'active') activeCount++;
      else if (c.lifecycleStatus === 'emerging') emergingCount++;
      else if (c.lifecycleStatus === 're_emerging') reEmergingCount++;
      else if (c.lifecycleStatus === 'quiet') quietCount++;

      if (c.status === 'present') presentCount++;
      else if (c.status === 'shifting') shiftingCount++;
      else if (c.status === 'quiet') quietCount++;
      else if (c.status === 'new') newCount++;
      else if (c.status === 'returned') returnedCount++;
    });

    const hasHistoricalPatterns = patternSlugMap.size > 0;

    let summarySentence = '';
    if (cards.length === 0) {
      summarySentence = 'No patterns have emerged yet.';
    } else if (activeCount === 0 && reEmergingCount === 0 && emergingCount === 0) {
      summarySentence = `You don't have any active patterns right now. ${quietCount} previously observed pattern${quietCount === 1 ? ' is' : 's are'} currently quiet in your recent writing.`;
    } else {
      summarySentence = `You have ${cards.length} pattern${cards.length === 1 ? '' : 's'} identified across ${totalCycles} cycles. ${activeCount} active, ${emergingCount > 0 ? emergingCount + ' emerging, ' : ''}${reEmergingCount > 0 ? reEmergingCount + ' re-emerging, ' : ''}${quietCount} currently quiet. Patterns quiet and re-emerge naturally based on your current focus.`;
    }

    const lifecycle: LifecycleGroup = {
      active: cards.filter(c => c.lifecycleStatus === 'active'),
      reEmerging: cards.filter(c => c.lifecycleStatus === 're_emerging'),
      emerging: cards.filter(c => c.lifecycleStatus === 'emerging'),
      quiet: cards.filter(c => c.lifecycleStatus === 'quiet')
    };

    return {
      patterns: cards,
      lifecycle,
      hasHistoricalPatterns,
      summary: {
        sentence: summarySentence,
        present: presentCount,
        shifting: shiftingCount,
        quiet: quietCount,
        new: newCount,
        returned: returnedCount,
        active: activeCount,
        emerging: emergingCount,
        reEmerging: reEmergingCount
      },
      totalCyclesObserved: totalCycles,
      isAvailable: true,
      snapshots: orderedSnapshots
    };
  }

  /**
   * Retrieves detail data of a specific pattern.
   * Pure read-only.
   */
  public static async getPatternDetail(userId: string, patternName: string): Promise<PatternDetail | null> {
    let snapshots: any[] = [];
    try {
      const { data, error: snapshotsErr } = await supabase
        .from('pattern_snapshots')
        .select('*')
        .eq('user_id', userId)
        .neq('cycle_id', '00000000-0000-0000-0000-000000000000')
        .order('cycle_number', { ascending: true });

      if (snapshotsErr) {
        if (snapshotsErr.code === 'PGRST205' || snapshotsErr.message?.includes('pattern_snapshots')) {
          console.warn('[PatternIntelligenceService] Table "pattern_snapshots" does not exist in schema. Returning empty details.');
          return null;
        }
        console.error('[PatternIntelligenceService] Error fetching snapshots:', snapshotsErr.message);
        throw snapshotsErr;
      }
      snapshots = data || [];
    } catch (err: any) {
      if (err.code === 'PGRST205' || err.message?.includes('pattern_snapshots')) {
        console.warn('[PatternIntelligenceService] Table "pattern_snapshots" does not exist in schema. Returning empty details.');
        return null;
      }
      throw err;
    }

    if (!snapshots || snapshots.length === 0) {
      return null;
    }

    const orderedSnapshots = await this.resolveActualCycleSnapshots(userId, snapshots);

    const totalCycles = orderedSnapshots.length;
    
    // Find pattern name by match (case-insensitive)
    let matchedName = '';
    orderedSnapshots.forEach(snap => {
      const snapPatterns = snap.snapshot_data?.patterns || [];
      snapPatterns.forEach((p: any) => {
        const pName = p.pattern_name || p.name;
        if (pName) {
          if (pName.toLowerCase() === patternName.toLowerCase() || this.getPatternSlug(pName) === patternName.toLowerCase()) {
            matchedName = pName;
          }
        }
      });
    });

    if (!matchedName) return null;

    // Fetch latest pattern state
    const latestSnapshot = orderedSnapshots[orderedSnapshots.length - 1];
    const latestPatterns = latestSnapshot.snapshot_data?.patterns || [];
    const latestPat = latestPatterns.find((p: any) => (p.pattern_name || p.name) === matchedName);

    let status = 'quiet';
    let body = 'Active in early weeks. Has not appeared in recent reports.';
    let orientation = '';
    let firstAppearedCycle = totalCycles;
    let lastAppearedCycle = 1;
    let totalOccurrences = 0;
    const connectedPatternsSet = new Set<string>();

    orderedSnapshots.forEach(snap => {
      const snapPatterns = snap.snapshot_data?.patterns || [];
      const snapPat = snapPatterns.find((p: any) => (p.pattern_name || p.name) === matchedName);
      if (snapPat && snapPat.status !== 'absent' && snapPat.status !== 'quiet') {
        if (snap.cycle_number < firstAppearedCycle) {
          firstAppearedCycle = snap.cycle_number;
        }
        if (snap.cycle_number > lastAppearedCycle) {
          lastAppearedCycle = snap.cycle_number;
        }
        totalOccurrences += 1;
        // Find co-occurring active patterns
        snapPatterns.forEach((other: any) => {
          const otherName = other.pattern_name || other.name;
          if (otherName.toLowerCase() !== matchedName.toLowerCase() && other.status !== 'quiet' && other.status !== 'absent') {
            connectedPatternsSet.add(otherName);
          }
        });
      }
    });

    if (latestPat) {
      status = latestPat.status || 'present';
      body = latestPat.summary || latestPat.body || '';
      orientation = latestPat.why_it_matters || latestPat.orientation || '';
    } else {
      orientation = `This pattern went quiet in Cycle ${lastAppearedCycle}.`;
    }

    const firstSeenLabel = `Cycle ${firstAppearedCycle}`;
    const lastSeenLabel = `Cycle ${lastAppearedCycle}`;
    const nextSeenLabel = `Cycle ${lastAppearedCycle + 1}`;

    let meta = '';
    if (status === 'quiet') {
      meta = `Last appeared ${lastSeenLabel} · not surfacing since ${nextSeenLabel}`;
    } else if (status === 'new') {
      meta = `First appeared ${firstSeenLabel}`;
    } else {
      meta = `First appeared ${firstSeenLabel}`;
    }

    let lifecycleStatus: PatternLifecycleStatus = 'quiet';
    if (latestPat) {
      lifecycleStatus = latestPat.lifecycle_status || (
        latestPat.status === 'quiet' || latestPat.status === 'absent' ? 'quiet' :
        latestPat.status === 'returned' ? 're_emerging' :
        latestPat.status === 'new' ? (totalOccurrences >= 2 ? 'active' : 'emerging') :
        'active'
      );
    } else {
      lifecycleStatus = 'quiet';
    }

    const weeksAbsent = lifecycleStatus === 'quiet' ? Math.max(1, totalCycles - lastAppearedCycle) : 0;
    const historicalStrength = PatternIntelligenceService.calculateHistoricalStrength(totalOccurrences, totalCycles);
    const currentActivity = PatternIntelligenceService.calculateCurrentActivity(
      latestPat?.evidence_score ?? (lifecycleStatus === 'quiet' ? 0.0 : 5.0),
      latestPat?.confidence ?? 0.8,
      weeksAbsent
    );

    // Badge styling mapping
    let badgeClass = 'badge quiet';
    if (lifecycleStatus === 'active') badgeClass = 'badge present';
    else if (lifecycleStatus === 'emerging') badgeClass = 'badge new';
    else if (lifecycleStatus === 're_emerging') badgeClass = 'badge returned';
    else if (lifecycleStatus === 'quiet') badgeClass = 'badge quiet';

    // Build timeline details
    const timeline: any[] = [];
    for (let c = 1; c <= totalCycles; c++) {
      const snap = orderedSnapshots.find(s => s.cycle_number === c);
      const pat = (snap?.snapshot_data?.patterns || []).find((p: any) => (p.pattern_name || p.name) === matchedName);
      const rawState = pat ? (pat.lifecycle_status || pat.status) : 'absent';
      
      let label = 'Not observed';
      let state = 'absent';
      if (rawState === 'active' || rawState === 'present') {
        label = 'Active';
        state = 'active';
      } else if (rawState === 'emerging' || rawState === 'new') {
        label = 'Emerging';
        state = 'emerging';
      } else if (rawState === 're_emerging' || rawState === 'returned') {
        label = 'Re-emerging';
        state = 're_emerging';
      } else if (rawState === 'quiet') {
        label = 'Quiet';
        state = 'quiet';
      } else if (rawState === 'shifting') {
        label = 'Shifting';
        state = 'shifting';
      }

      timeline.push({
        n: c,
        s: state,
        l: label,
        milestoneLabel: `Cycle ${c}`
      });
    }

    const cycleData: Record<number, { obs: string; entries: { t: string; m: string }[] }> = {};

    for (let c = 1; c <= totalCycles; c++) {
      const snap = orderedSnapshots.find(s => s.cycle_number === c);
      const pat = (snap?.snapshot_data?.patterns || []).find((p: any) => (p.pattern_name || p.name) === matchedName);
      const milestoneLabel = `Cycle ${c}`;
      
      const entries: { t: string; m: string }[] = [];
      if (pat) {
        const vocab = pat.supporting_vocabulary || [];
        const journalQuotes = pat.supporting_entries || pat.evidence || [];
        const threadQuotes = pat.supporting_threads || [];

        journalQuotes.forEach((q: any) => {
          const text = typeof q === 'string' ? q : (q.quote || q.supporting_sentence || '');
          if (text) {
            entries.push({
              t: `"${text}"`,
              m: `${milestoneLabel} · Journal`
            });
          }
        });

        threadQuotes.forEach((q: any) => {
          const text = typeof q === 'string' ? q : (q.quote || q.supporting_sentence || '');
          if (text) {
            entries.push({
              t: `"${text}"`,
              m: `${milestoneLabel} · Guide Conversation`
            });
          }
        });

        let obs = pat.summary || pat.body || 'No explanation provided.';
        if (vocab.length > 0) {
          obs += ` Supporting language: ${vocab.join(', ')}.`;
        }

        cycleData[c] = {
          obs,
          entries
        };
      } else {
        cycleData[c] = {
          obs: 'No evidence for this week.',
          entries: []
        };
      }
    }

    const connectedPatterns = Array.from(connectedPatternsSet).slice(0, 3);
    const connected = connectedPatterns.length > 0;
    const connectedLinks = connectedPatterns.map(name => ({
      label: name,
      id: this.getPatternSlug(name)
    }));

    const connectedBody = connected 
      ? `This pattern and ${connectedPatterns[0]} frequently appear together. They may be connected or represent adjacent coping strategies.`
      : '';

    return {
      name: matchedName,
      status: lifecycleStatus,
      lifecycleStatus,
      badgeClass,
      body,
      meta,
      orientation,
      historicalStrength,
      currentActivity,
      firstObservedCycle: firstAppearedCycle,
      lastActiveCycle: lastAppearedCycle,
      quietSinceCycle: latestPat?.quiet_since,
      reEmergedCycle: latestPat?.re_emerged_at,
      connected,
      connectedBody,
      connectedLinks,
      timeline,
      cycleData
    };
  }

  /**
   * Calculates patterns co-occurring in the same entry_id.
   */
  public static async getConnectedPatterns(userId: string, patternName: string): Promise<ConnectedPattern[]> {
    const cacheKey = `${userId}_${patternName}`;
    const cached = connectedPatternsCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // 1. Find entry_ids where this pattern appeared
    const { data: occurrences } = await supabase
      .from('pattern_extractions')
      .select('entry_id')
      .eq('user_id', userId)
      .eq('pattern_name', patternName)
      .not('entry_id', 'is', null);

    if (!occurrences || occurrences.length === 0) {
      return [];
    }

    const entryIds = occurrences.map(o => o.entry_id);

    // 2. Fetch other patterns appearing in those same entries
    const { data: coOccurrences } = await supabase
      .from('pattern_extractions')
      .select('pattern_name')
      .eq('user_id', userId)
      .in('entry_id', entryIds)
      .neq('pattern_name', patternName);

    if (!coOccurrences || coOccurrences.length === 0) {
      return [];
    }

    const counts = new Map<string, number>();
    coOccurrences.forEach(co => {
      counts.set(co.pattern_name, (counts.get(co.pattern_name) || 0) + 1);
    });

    const result: ConnectedPattern[] = Array.from(counts.entries())
      .map(([name, count]) => ({ name, coOccurrences: count }))
      .filter(item => item.coOccurrences >= 2)
      .sort((a, b) => b.coOccurrences - a.coOccurrences)
      .slice(0, 3);

    connectedPatternsCache.set(cacheKey, { data: result, expires: Date.now() + CACHE_TTL_MS });
    return result;
  }

  /**
   * Retrieves chronological list of milestones (weekly reports and cycle completions) for a user.
   */
  public static async getMilestones(userId: string): Promise<Milestone[]> {
    // 1. Fetch all cycles for this user, ordered by created_at ascending
    const { data: cycles, error: cyclesErr } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (cyclesErr || !cycles || cycles.length === 0) {
      return [];
    }

    // 2. Fetch all weekly summaries for this user
    const { data: weeklySummaries, error: wsErr } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    const milestones: Milestone[] = [];

    // Map each cycle to its index (1-based cycleNumber)
    cycles.forEach((cycle, cycleIdx) => {
      const cycleNumber = cycleIdx + 1;

      // Find all weekly summaries belonging to this cycle
      const cycleSummaries = (weeklySummaries || [])
        .filter(ws => ws.cycle_id === cycle.id)
        .sort((a, b) => a.week_number - b.week_number);

      cycleSummaries.forEach(ws => {
        const isCompleted = ws.status?.toUpperCase() === 'READY';
        milestones.push({
          id: ws.id,
          type: 'weekly_report',
          cycleId: cycle.id,
          weekNumber: ws.week_number,
          cycleNumber,
          createdAt: ws.created_at,
          isCompleted
        });
      });

      // If the cycle itself is completed/archived, add a cycle completion milestone
      const cycleCompleted = cycle.status?.toLowerCase() === 'completed' || 
                             cycle.status?.toLowerCase() === 'complete' || 
                             cycle.status?.toLowerCase() === 'archived';
      if (cycleCompleted) {
        milestones.push({
          id: cycle.id,
          type: 'cycle_summary',
          cycleId: cycle.id,
          cycleNumber,
          createdAt: cycle.updated_at || cycle.created_at,
          isCompleted: true
        });
      } else if (cycle.status?.toUpperCase() === 'ACTIVE') {
        milestones.push({
          id: cycle.id,
          type: 'cycle_summary',
          cycleId: cycle.id,
          cycleNumber,
          createdAt: new Date().toISOString(),
          isCompleted: false
        });
      }
    });

    return milestones;
  }

  /**
   * Generates or updates the snapshot for a given milestone.
   * Incremental, event-driven, tenant-safe.
   */
  public static async generatePatternSnapshotForMilestone(
    userId: string,
    milestone: Milestone,
    sequenceNumber: number,
    forceRebuild: boolean = false
  ): Promise<void> {
    // 1. Check if snapshot already exists and is completed
    const { data: existingSnap } = await supabase
      .from('pattern_snapshots')
      .select('id, snapshot_status')
      .eq('user_id', userId)
      .eq('cycle_id', milestone.id)
      .maybeSingle();

    if (!forceRebuild && existingSnap?.snapshot_status === 'completed') {
      console.log(`[PatternIntelligenceService] Milestone snapshot ${milestone.id} is completed and frozen. Aborting.`);
      return;
    }

    // 2. Fetch the weekly report summary
    const { data: weeklySummary, error: wsErr } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('id', milestone.id)
      .maybeSingle();

    if (wsErr || !weeklySummary) {
      console.warn(`[PatternIntelligenceService] Weekly summary not found for milestone ${milestone.id}. Skipping snapshot.`);
      return;
    }

    // 3. Fetch journal entries written during this week and decrypt them
    const { data: dbEntries } = await supabase
      .from('entries')
      .select('id, content, new_entry_text_encrypted, new_entry_text_iv, cycle_day, created_at')
      .eq('user_id', userId)
      .eq('cycle_id', milestone.cycleId)
      .gte('cycle_day', weeklySummary.day_start)
      .lte('cycle_day', weeklySummary.day_end);

    const decryptedEntries: string[] = [];
    if (dbEntries) {
      for (const entry of dbEntries) {
        let entryText = '';
        if (entry.new_entry_text_encrypted || entry.new_entry_text_iv) {
          try {
            entryText = (await decrypt(entry.new_entry_text_encrypted, entry.new_entry_text_iv)) || entry.content || '';
          } catch {
            entryText = entry.content || '';
          }
        } else {
          entryText = entry.content || '';
        }
        if (entryText.trim()) {
          decryptedEntries.push(entryText.trim());
        }
      }
    }

    const reportData = weeklySummary.report_data || {};

    // 4. Gather vocabulary from report_data or database
    let vocabThisWeek = reportData.vocabThisWeek || [];
    if (vocabThisWeek.length === 0 && dbEntries && dbEntries.length > 0) {
      const entryIds = dbEntries.map(e => e.id);
      const { data: dbVocab } = await supabase
        .from('vocab_extractions')
        .select('word, normalized_word, confidence, sentence')
        .in('entry_id', entryIds);
      if (dbVocab) {
        vocabThisWeek = dbVocab.map(v => ({
          word: v.word,
          normalized_word: v.normalized_word,
          frequency: 1,
          sentence: v.sentence
        }));
      }
    }

    // 5. Gather scores from report_data or database
    let scores = reportData.scores || [];
    if (scores.length === 0 && dbEntries && dbEntries.length > 0) {
      const { data: dbScores } = await supabase
        .from('entries')
        .select('cycle_day, day_ei, day_pr, day_sa')
        .eq('user_id', userId)
        .eq('cycle_id', milestone.cycleId)
        .gte('cycle_day', weeklySummary.day_start)
        .lte('cycle_day', weeklySummary.day_end);
      if (dbScores) {
        scores = dbScores.map(s => ({
          cycle_day: s.cycle_day,
          ei: s.day_ei,
          pr: s.day_pr,
          sa: s.day_sa
        }));
      }
    }

    // 6. Gather thread responses
    let threadResponses = reportData.threadResponses || [];
    if (threadResponses.length === 0) {
      const { data: dbThreads } = await supabase
        .from('thread_responses')
        .select('id, response_text, created_at')
        .eq('user_id', userId)
        .eq('cycle_id', milestone.cycleId);
      if (dbThreads) {
        threadResponses = dbThreads.map(t => ({
          id: t.id,
          response_text: t.response_text,
          question: 'Reflective prompt'
        }));
      }
    }

    // 7. Call LLM to detect patterns from multi-source evidence
    const prompt = `You are a precise pattern-detection system for Ingress Within, a therapeutic writing application. Your task is to identify recurring cognitive, emotional, and behavioral patterns for the user based ONLY on the evidence from this week.

WEEKLY SUMMARY EVIDENCE:
- Title: ${weeklySummary.title || 'Weekly Report'}
- Narrative Summary: ${weeklySummary.body || 'None'}
- Notable Insights: ${weeklySummary.why || 'None'}

VOCABULARY DETECTED:
${JSON.stringify(vocabThisWeek, null, 2)}

SCORES HISTORY (Emotional Intensity [EI], Processing Depth [PR], Self-Agency [SA]):
${JSON.stringify(scores, null, 2)}

THREAD RESPONSES:
${JSON.stringify(threadResponses, null, 2)}

JOURNAL ENTRIES WRITEUPS:
${decryptedEntries.map((txt, i) => `Entry ${i+1}:\n"""\n${txt}\n"""`).join('\n\n')}

INSTRUCTIONS:
1. Detect up to 5 distinct cognitive, emotional, or behavioral patterns present in this week's writing and metrics.
2. Ground each pattern in the actual text. Never make up quotes or invent patterns.
3. Every pattern name must be a concise, standard pattern (1-4 words).
   Good Examples: Avoidance, Self-pressure, Overthinking, Seeking reassurance, Work identity, Perfectionism, Fear of disappointing others, Emotional exhaustion, Difficulty asking for help, Need for control, Boundary building.
4. For each pattern, you must:
   - Provide a concise name under "pattern_name".
   - Under "summary", summarize the evidence for this week (e.g. how it manifested, citing actual themes/behaviors from the week). ALWAYS write in the first-person ("I", "my") or address the user directly ("you", "your"). NEVER use third-person terms like "the user", "the writer", "he/she", or "they".
   - Under "why_it_matters", write a 1-2 sentence therapeutic orientation/context. ALWAYS write in the first-person ("I", "my") or address the user directly ("you", "your"). NEVER use third-person terms like "the user", "the writer", or "they".
   - Under "confidence", provide a confidence score between 0.0 and 1.0.
   - Under "evidence_score", provide a score between 1.0 and 10.0 representing the intensity or frequency of the pattern.
   - Under "supporting_vocabulary", list vocabulary words/phrases from the VOCABULARY DETECTED list that evidence this pattern.
   - Under "supporting_journal_quotes", extract EXACT quotes or sentences from the JOURNAL ENTRIES WRITEUPS that evidence this pattern.
   - Under "supporting_thread_quotes", extract EXACT quotes or sentences from the THREAD RESPONSES that evidence this pattern.
   - Under "meaning_or_intensity_changed", set to true if the pattern shows a shift in how it's expressed, its meaning, or its intensity compared to previous weeks. Otherwise set to false.

RESPONSE FORMAT:
Return a JSON array of pattern objects only. Do not include markdown code block formatting (e.g. \`\`\`json), do not include a preamble, and do not include explanation.
If no patterns are found, return: []`;

    let aiResponse = '';
    let parsedPatterns: any[] = [];
    let actualProvider = process.env.AI_PROVIDER || 'claude';
    let fallbackUsed = false;
    let primaryProvider = 'claude';
    const synthStartTime = Date.now();

    try {
      const { aiProvider } = await import('../ai/factory');
      aiResponse = await aiProvider.callRaw(prompt);
      actualProvider = (aiProvider as any).lastProviderUsed || actualProvider;
      fallbackUsed = (aiProvider as any).lastFallbackUsed || false;
      primaryProvider = (aiProvider as any).lastPrimaryProvider || 'claude';
      
      let cleaned = aiResponse.trim();
      if (cleaned.startsWith('```')) {
        const lines = cleaned.split('\n');
        if (lines[0].startsWith('```')) {
          lines.shift();
        }
        if (lines[lines.length - 1].startsWith('```')) {
          lines.pop();
        }
        cleaned = lines.join('\n').trim();
      }
      
      parsedPatterns = JSON.parse(cleaned);
      if (!Array.isArray(parsedPatterns)) {
        parsedPatterns = [];
      }
    } catch (err: any) {
      console.error('[PatternIntelligenceService] AI call or parse failed:', err.message);
      parsedPatterns = [];
    }

    // 8. Fetch all previous snapshots to calculate trends
    const { data: previousSnapshots, error: prevErr } = await supabase
      .from('pattern_snapshots')
      .select('*')
      .eq('user_id', userId)
      .neq('cycle_id', '00000000-0000-0000-0000-000000000000')
      .lt('cycle_number', sequenceNumber)
      .order('cycle_number', { ascending: true });

    if (prevErr) {
      console.error('[PatternIntelligenceService] Error fetching previous snapshots:', prevErr.message);
    }

    const previousSnaps = previousSnapshots || [];
    const activePatterns: any[] = [];
    const historicalPatternNames = new Set<string>();
    
    // Collect all historical pattern names
    previousSnaps.forEach(snap => {
      const snapPatterns = snap.snapshot_data?.patterns || [];
      snapPatterns.forEach((p: any) => {
        const pName = p.pattern_name || p.name;
        if (pName) {
          historicalPatternNames.add(pName);
        }
      });
    });

    // Process current week's patterns with deterministic longitudinal lifecycle transitions
    parsedPatterns.forEach((detected: any) => {
      const name = detected.pattern_name;
      if (!name) return;

      let wasEverActive = false;
      let lastKnownLifecycleStatus: PatternLifecycleStatus | null = null;
      let wasQuietInPreviousWeek = false;
      let firstObservedWeek = sequenceNumber;
      let totalPriorOccurrences = 0;

      previousSnaps.forEach(snap => {
        const snapPatterns = snap.snapshot_data?.patterns || [];
        const snapPat = snapPatterns.find(
          (p: any) => (p.pattern_name || p.name).toLowerCase() === name.toLowerCase()
        );
        if (snapPat) {
          if (snap.cycle_number < firstObservedWeek) {
            firstObservedWeek = snap.cycle_number;
          }
          if (snapPat.status !== 'absent' && snapPat.status !== 'quiet' && snapPat.lifecycle_status !== 'quiet') {
            wasEverActive = true;
            totalPriorOccurrences += 1;
          }
          if (snapPat.lifecycle_status) {
            lastKnownLifecycleStatus = snapPat.lifecycle_status;
          } else if (snapPat.status === 'quiet') {
            lastKnownLifecycleStatus = 'quiet';
          } else if (snapPat.status === 'returned') {
            lastKnownLifecycleStatus = 're_emerging';
          } else if (snapPat.status === 'new') {
            lastKnownLifecycleStatus = 'emerging';
          } else if (snapPat.status === 'present' || snapPat.status === 'shifting') {
            lastKnownLifecycleStatus = 'active';
          }
          if (snap.cycle_number === sequenceNumber - 1) {
            wasQuietInPreviousWeek = (snapPat.lifecycle_status === 'quiet' || snapPat.status === 'quiet' || snapPat.status === 'absent');
          }
        }
      });

      const confidence = Number(detected.confidence ?? 0.8);
      const evidenceScore = Number(detected.evidence_score ?? 5.0);
      let lifecycleStatus: PatternLifecycleStatus = 'active';
      let legacyStatus: 'new' | 'present' | 'shifting' | 'returned' | 'quiet' = 'present';
      let reEmergedAt: number | undefined = undefined;

      if (!wasEverActive) {
        // Brand new pattern: check if strong enough for active vs emerging
        if (evidenceScore >= 6.5 && confidence >= 0.8) {
          lifecycleStatus = 'active';
          legacyStatus = 'new';
        } else {
          lifecycleStatus = 'emerging';
          legacyStatus = 'new';
        }
      } else if (wasQuietInPreviousWeek || lastKnownLifecycleStatus === 'quiet') {
        // Was quiet: check for re-emergence with hysteresis
        if (evidenceScore >= 6.5 && confidence >= 0.8) {
          // Extremely strong return -> straight to active
          lifecycleStatus = 'active';
          legacyStatus = 'returned';
          reEmergedAt = sequenceNumber;
        } else if (evidenceScore >= 4.5 && confidence >= 0.65) {
          // Meaningful new evidence -> transitions to re_emerging
          lifecycleStatus = 're_emerging';
          legacyStatus = 'returned';
          reEmergedAt = sequenceNumber;
        } else {
          // Noisy or very weak evidence (< 4.0) -> stays quiet, does not flutter
          lifecycleStatus = 'quiet';
          legacyStatus = 'quiet';
        }
      } else if (lastKnownLifecycleStatus === 're_emerging') {
        // Sustained evidence after re-emergence -> transitions to active
        if (evidenceScore >= 5.0 && confidence >= 0.65) {
          lifecycleStatus = 'active';
          legacyStatus = 'present';
        } else {
          lifecycleStatus = 're_emerging';
          legacyStatus = 'present';
        }
      } else if (lastKnownLifecycleStatus === 'emerging') {
        // Emerging with repeated/strong evidence -> transitions to active
        if (evidenceScore >= 5.0 && confidence >= 0.65) {
          lifecycleStatus = 'active';
          legacyStatus = 'present';
        } else {
          lifecycleStatus = 'emerging';
          legacyStatus = 'present';
        }
      } else {
        // Was active
        lifecycleStatus = 'active';
        legacyStatus = detected.meaning_or_intensity_changed ? 'shifting' : 'present';
      }

      const historicalStrength = PatternIntelligenceService.calculateHistoricalStrength(totalPriorOccurrences + 1, sequenceNumber);
      const currentActivity = PatternIntelligenceService.calculateCurrentActivity(evidenceScore, confidence, 0);

      activePatterns.push({
        id: this.getPatternSlug(name),
        pattern_name: name,
        name,
        status: legacyStatus,
        lifecycle_status: lifecycleStatus,
        confidence,
        evidence_score: evidenceScore,
        historical_strength: historicalStrength,
        current_activity: currentActivity,
        first_observed_at: firstObservedWeek,
        last_active_at: sequenceNumber,
        re_emerged_at: reEmergedAt,
        summary: detected.summary || '',
        why_it_matters: detected.why_it_matters || '',
        supporting_vocabulary: detected.supporting_vocabulary || [],
        supporting_entries: detected.supporting_journal_quotes || [],
        supporting_threads: detected.supporting_thread_quotes || [],
        generated_at: new Date().toISOString(),
        week_number: sequenceNumber
      });
    });

    // Carry forward absent historical patterns without deleting them
    historicalPatternNames.forEach(name => {
      if (activePatterns.some(ap => ap.pattern_name.toLowerCase() === name.toLowerCase())) {
        return;
      }

      let wasEverActive = false;
      let lastActiveWeek = 0;
      let lastKnownLifecycleStatus: PatternLifecycleStatus | null = null;
      let totalOccurrences = 0;
      let firstObservedWeek = sequenceNumber;

      previousSnaps.forEach(snap => {
        const snapPatterns = snap.snapshot_data?.patterns || [];
        const snapPat = snapPatterns.find(
          (p: any) => (p.pattern_name || p.name).toLowerCase() === name.toLowerCase()
        );
        if (snapPat) {
          if (snap.cycle_number < firstObservedWeek) {
            firstObservedWeek = snap.cycle_number;
          }
          if (snapPat.status !== 'absent' && snapPat.status !== 'quiet' && snapPat.lifecycle_status !== 'quiet') {
            wasEverActive = true;
            lastActiveWeek = snap.cycle_number;
            totalOccurrences += 1;
          }
          if (snapPat.lifecycle_status) {
            lastKnownLifecycleStatus = snapPat.lifecycle_status;
          } else if (snapPat.status === 'quiet') {
            lastKnownLifecycleStatus = 'quiet';
          }
        }
      });

      if (!wasEverActive) return;

      const weeksAbsent = sequenceNumber - lastActiveWeek;
      let lifecycleStatus: PatternLifecycleStatus = 'quiet';
      let legacyStatus: 'quiet' | 'absent' | 'shifting' = 'quiet';
      let quietSince: number | undefined = undefined;

      if (lastKnownLifecycleStatus === 'quiet') {
        lifecycleStatus = 'quiet';
        legacyStatus = 'quiet';
        quietSince = lastActiveWeek + 1;
      } else if (weeksAbsent >= 2) {
        // Absent for 2+ weeks -> transitions to quiet
        lifecycleStatus = 'quiet';
        legacyStatus = 'quiet';
        quietSince = sequenceNumber;
      } else {
        // Absent for only 1 week: apply hysteresis (remains in current lifecycle status with decaying activity)
        lifecycleStatus = lastKnownLifecycleStatus || 'active';
        legacyStatus = 'shifting';
      }

      let lastWhy = '';
      for (let i = previousSnaps.length - 1; i >= 0; i--) {
        const snapPatterns = previousSnaps[i].snapshot_data?.patterns || [];
        const snapPat = snapPatterns.find(
          (p: any) => (p.pattern_name || p.name).toLowerCase() === name.toLowerCase()
        );
        if (snapPat) {
          lastWhy = snapPat.why_it_matters || snapPat.orientation || '';
          break;
        }
      }

      const historicalStrength = PatternIntelligenceService.calculateHistoricalStrength(totalOccurrences, sequenceNumber);
      const currentActivity = PatternIntelligenceService.calculateCurrentActivity(0, 0, weeksAbsent);

      activePatterns.push({
        id: this.getPatternSlug(name),
        pattern_name: name,
        name,
        status: legacyStatus,
        lifecycle_status: lifecycleStatus,
        confidence: 0.0,
        evidence_score: 0.0,
        historical_strength: historicalStrength,
        current_activity: currentActivity,
        first_observed_at: firstObservedWeek,
        last_active_at: lastActiveWeek,
        quiet_since: quietSince,
        summary: lifecycleStatus === 'quiet' 
          ? `This pattern was observed earlier and has been quieter in your recent entries (last active Week ${lastActiveWeek}).` 
          : `Absent in Week ${sequenceNumber}.`,
        why_it_matters: lastWhy || 'A recurring theme observed across past journal entries.',
        supporting_vocabulary: [],
        supporting_entries: [],
        supporting_threads: [],
        generated_at: new Date().toISOString(),
        week_number: sequenceNumber
      });
    });

    const finalSnapshotData = {
      patterns: activePatterns,
      total_cycles_observed: sequenceNumber,
      milestone_label: `Week ${milestone.weekNumber || sequenceNumber}`
    };

    const { error: upsertErr } = await supabase
      .from('pattern_snapshots')
      .upsert({
        user_id: userId,
        cycle_id: milestone.id,
        cycle_number: sequenceNumber,
        snapshot_status: milestone.isCompleted ? 'completed' : 'active',
        snapshot_data: finalSnapshotData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id, cycle_id'
      });

    if (upsertErr) {
      console.error('[PatternIntelligenceService] Snapshot upsert error:', upsertErr.message);
    }
  }

  /**
   * Wrapper for backwards compatibility.
   */
  public static async generatePatternSnapshot(userId: string, cycleId: string): Promise<void> {
    const milestones = await this.getMilestones(userId);
    const weeklyMilestones = milestones.filter(m => m.type === 'weekly_report');
    const milestoneIdx = weeklyMilestones.findIndex(m => m.id === cycleId || m.cycleId === cycleId);
    
    if (milestoneIdx === -1) {
      console.warn(`[PatternIntelligenceService] Milestone not found for ID ${cycleId}. Skipping.`);
      return;
    }

    const milestone = weeklyMilestones[milestoneIdx];
    await this.generatePatternSnapshotForMilestone(userId, milestone, milestoneIdx + 1);
  }

  /**
   * Updates current active milestone snapshot incrementally.
   */
  public static async updateActiveCycleSnapshot(userId: string, cycleId: string): Promise<void> {
    const milestones = await this.getMilestones(userId);
    const weeklyMilestones = milestones.filter(m => m.type === 'weekly_report');
    const activeMilestoneIdx = weeklyMilestones.findIndex(m => m.cycleId === cycleId && !m.isCompleted);

    if (activeMilestoneIdx === -1) {
      console.log(`[PatternIntelligenceService] No active/pending milestone found for cycle ${cycleId}. Skipping incremental snapshot update.`);
      return;
    }

    const activeMilestone = weeklyMilestones[activeMilestoneIdx];
    const sequenceNumber = activeMilestoneIdx + 1;

    await this.generatePatternSnapshotForMilestone(userId, activeMilestone, sequenceNumber);
  }

  /**
   * Generates and seals the snapshot for a completed weekly report.
   */
  public static async generateSnapshotForWeeklyReport(userId: string, weeklySummaryId: string): Promise<void> {
    const milestones = await this.getMilestones(userId);
    const weeklyMilestones = milestones.filter(m => m.type === 'weekly_report');
    const milestoneIdx = weeklyMilestones.findIndex(m => m.id === weeklySummaryId);
    
    if (milestoneIdx === -1) {
      console.error(`[PatternIntelligenceService] Milestone not found for weekly report ${weeklySummaryId}`);
      return;
    }

    const milestone = weeklyMilestones[milestoneIdx];
    const sequenceNumber = milestoneIdx + 1;

    // Force isCompleted = true for sealing the snapshot
    milestone.isCompleted = true;

    await this.generatePatternSnapshotForMilestone(userId, milestone, sequenceNumber);
  }

  /**
   * Seals a cycle snapshot (completed).
   */
  public static async sealCycleSnapshot(userId: string, cycleId: string): Promise<void> {
    const { error } = await supabase
      .from('pattern_snapshots')
      .update({
        snapshot_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('cycle_id', cycleId);

    if (error) {
      console.error('[PatternIntelligenceService] Error sealing cycle snapshot:', error.message);
      throw error;
    }
    console.log(`[PatternIntelligenceService] Sealed cycle snapshot: ${cycleId}`);
  }

  /**
   * Detects pattern transitions between the last 2 completed snapshots.
   */
  public static async detectPatternTransitions(userId: string): Promise<PatternTransition[]> {
    const { data: snapshots, error } = await supabase
      .from('pattern_snapshots')
      .select('*')
      .eq('user_id', userId)
      .neq('cycle_id', '00000000-0000-0000-0000-000000000000')
      .eq('snapshot_status', 'completed')
      .order('cycle_number', { ascending: false })
      .limit(2);

    if (error || !snapshots || snapshots.length < 2) {
      return [];
    }

    const latestSnap = snapshots[0];
    const prevSnap = snapshots[1];

    const latestPatterns = latestSnap.snapshot_data?.patterns || [];
    const prevPatterns = prevSnap.snapshot_data?.patterns || [];

    const transitions: PatternTransition[] = [];

    latestPatterns.forEach((lat: any) => {
      const prev = prevPatterns.find((p: any) => p.name === lat.name);
      const prevState = prev ? prev.cycle_state : 'absent';
      const latState = lat.cycle_state || 'absent';

      if (prevState !== latState) {
        transitions.push({
          patternName: lat.name,
          from: prevState,
          to: latState,
          cycleNumber: latestSnap.cycle_number
        });
      }
    });

    return transitions;
  }


  private static async resolveActualCycleSnapshots(userId: string, snapshots: any[]): Promise<any[]> {
    if (!snapshots || snapshots.length === 0) return [];

    // Fetch all user weekly summaries
    const { data: weeklySummaries } = await supabase
      .from('weekly_summaries')
      .select('id, cycle_id, week_number')
      .eq('user_id', userId);

    // Fetch all user cycles
    const { data: cycles } = await supabase
      .from('cycles')
      .select('id, cycle_number, status')
      .eq('user_id', userId)
      .order('cycle_number', { ascending: true });

    // Map each snapshot to its actual cycle number and week number
    const mappedSnapshots = snapshots.map(snap => {
      const ws = weeklySummaries?.find(w => w.id === snap.cycle_id);
      let actualCycleNum = snap.cycle_number;
      let actualCycleId = snap.cycle_id;
      let weekNum = ws?.week_number || 1;

      if (ws && cycles) {
        const cycle = cycles.find(c => c.id === ws.cycle_id);
        if (cycle) {
          actualCycleNum = cycle.cycle_number;
          actualCycleId = cycle.id;
        }
      }

      return {
        ...snap,
        actual_cycle_number: actualCycleNum,
        actual_cycle_id: actualCycleId,
        week_number: weekNum
      };
    });

    // Group mapped snapshots by actual cycle number
    const snapshotsByCycle = new Map<number, any[]>();
    mappedSnapshots.forEach(snap => {
      const arr = snapshotsByCycle.get(snap.actual_cycle_number) || [];
      arr.push(snap);
      snapshotsByCycle.set(snap.actual_cycle_number, arr);
    });

    // For each cycle, select the snapshot from the latest week (e.g. Week 4 or highest week_number)
    const cycleSnapshots: any[] = [];
    snapshotsByCycle.forEach((snapsInCycle, cycleNum) => {
      const sortedSnaps = snapsInCycle.sort((a, b) => b.week_number - a.week_number);
      const representativeSnap = sortedSnaps[0]; // latest week of this cycle

      cycleSnapshots.push({
        ...representativeSnap,
        cycle_number: cycleNum,
        cycle_id: representativeSnap.actual_cycle_id
      });
    });

    // Sort cycleSnapshots by cycle_number ascending
    return cycleSnapshots.sort((a, b) => a.cycle_number - b.cycle_number);
  }

  /**
   * Returns a canonical empty overview for users with no snapshots.
   */
  public static getEmptyOverview(): PatternOverview {
    return {
      patterns: [],
      lifecycle: {
        active: [],
        emerging: [],
        reEmerging: [],
        quiet: []
      },
      hasHistoricalPatterns: false,
      summary: {
        sentence: 'No patterns have emerged yet.',
        present: 0,
        shifting: 0,
        quiet: 0,
        new: 0,
        returned: 0,
        active: 0,
        emerging: 0,
        reEmerging: 0
      },
      totalCyclesObserved: 0,
      isAvailable: false
    };
  }

}
