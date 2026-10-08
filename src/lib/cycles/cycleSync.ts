import { supabase } from '../db';

/**
 * CycleSync: Synchronizes cycle entry counters with the authoritative entries table.
 * Guarantees that historical entries are never hidden by stale denormalized counters.
 */
export class CycleSync {
  /**
   * Calculates actual count of entries for a specific cycle and updates the cycles table.
   */
  public static async syncCycleEntriesCount(cycleId: string, userId?: string): Promise<number> {
    try {
      let query = supabase
        .from('entries')
        .select('id', { count: 'exact', head: true })
        .eq('cycle_id', cycleId);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { count, error } = await query;
      if (error) {
        console.error('[CycleSync] Error counting entries for cycle', cycleId, error.message);
        return 0;
      }

      const actualCount = count || 0;

      // Update the denormalized counter in cycles table
      await supabase
        .from('cycles')
        .update({ entries_count: actualCount, updated_at: new Date().toISOString() })
        .eq('id', cycleId);

      return actualCount;
    } catch (err: any) {
      console.error('[CycleSync] Exception in syncCycleEntriesCount:', err.message);
      return 0;
    }
  }

  /**
   * Synchronizes entry counts for all cycles belonging to a user.
   * Returns a map of cycleId -> actual entry count.
   */
  public static async syncUserCycles(userId: string): Promise<Record<string, number>> {
    try {
      // 1. Fetch user cycles
      const { data: cycles, error: cycleErr } = await supabase
        .from('cycles')
        .select('id, entries_count')
        .eq('user_id', userId);

      if (cycleErr || !cycles || cycles.length === 0) {
        return {};
      }

      const cycleIds = cycles.map(c => c.id);

      // 2. Query entries grouped by cycle_id
      const { data: entries, error: entriesErr } = await supabase
        .from('entries')
        .select('cycle_id')
        .eq('user_id', userId)
        .in('cycle_id', cycleIds);

      if (entriesErr) {
        console.error('[CycleSync] Error fetching entries for user cycles:', entriesErr.message);
        return {};
      }

      const counts: Record<string, number> = {};
      cycleIds.forEach(id => { counts[id] = 0; });

      (entries || []).forEach((e: any) => {
        if (e.cycle_id) {
          counts[e.cycle_id] = (counts[e.cycle_id] || 0) + 1;
        }
      });

      // 3. Update any cycles whose stored count differs
      const updates = cycles.map(async (c) => {
        const actual = counts[c.id] ?? 0;
        if (c.entries_count !== actual) {
          await supabase
            .from('cycles')
            .update({ entries_count: actual, updated_at: new Date().toISOString() })
            .eq('id', c.id);
        }
      });

      await Promise.all(updates);
      return counts;
    } catch (err: any) {
      console.error('[CycleSync] Exception in syncUserCycles:', err.message);
      return {};
    }
  }

  /**
   * One-time system-wide backfill sync for all cycles across all users.
   */
  public static async syncAllCycles(): Promise<{ updated: number; total: number }> {
    const { data: cycles, error: cyclesErr } = await supabase
      .from('cycles')
      .select('id, user_id, entries_count');

    if (cyclesErr || !cycles) {
      console.error('[CycleSync] Failed to fetch cycles:', cyclesErr?.message);
      return { updated: 0, total: 0 };
    }

    let updated = 0;
    for (const c of cycles) {
      const { count } = await supabase
        .from('entries')
        .select('id', { count: 'exact', head: true })
        .eq('cycle_id', c.id);

      const actualCount = count || 0;
      if (c.entries_count !== actualCount) {
        await supabase
          .from('cycles')
          .update({ entries_count: actualCount, updated_at: new Date().toISOString() })
          .eq('id', c.id);
        updated++;
      }
    }

    return { updated, total: cycles.length };
  }
}
