import { requireSupabase } from '@/lib/supabase';

// The RPC rejects larger deltas; anything above is sent on the next sync.
export const MAX_BONUS_DELTA = 10000;

/** Merge local game state into the administrator's game_progress row and return the merged row. */
export async function mergeGameProgress({ records, bestStars, bonusDelta, seen }) {
  const { data, error } = await requireSupabase().rpc('game_progress_merge', {
    p_records: records,
    p_best_stars: bestStars,
    p_bonus_delta: bonusDelta,
    p_seen: seen,
  });
  if (error) throw error;
  return data;
}
