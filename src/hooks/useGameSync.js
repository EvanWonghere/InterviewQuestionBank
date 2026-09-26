import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGameStore } from '@/store/gameStore';
import { useReviewStore } from '@/store/reviewStore';
import { MAX_BONUS_DELTA, mergeGameProgress } from '@/data/gameRepository';

const DEBOUNCE_MS = 1500;

/**
 * Keeps an administrator's stage game in step with game_progress: one merge once their cloud
 * learning data has loaded, then one after local changes settle. Failures stay local and are
 * retried with the next change or sign-in; they never interrupt play. Visitors stay local-only.
 */
export function useGameSync() {
  const { user, isAdmin } = useAuth();
  const hydratedUserId = useReviewStore((s) => s.hydratedUserId);
  const ready = Boolean(user && isAdmin && hydratedUserId === user.id);

  useEffect(() => {
    if (!ready) return undefined;
    let timer = 0;
    let running = false;
    let cancelled = false;

    const sync = async () => {
      if (running || cancelled) return;
      const state = useGameStore.getState();
      running = true;
      let ok = false;
      const sentRev = state.localRev;
      const sentBonus = Math.min(state.pendingBonus, MAX_BONUS_DELTA);
      try {
        const row = await mergeGameProgress({
          records: state.records,
          bestStars: state.bestStars,
          bonusDelta: sentBonus,
          seen: state.seenAchievements,
        });
        if (!cancelled) useGameStore.getState().adoptCloud(row, { sentBonus, sentRev });
        ok = true;
      } catch {
        // Offline or refused: keep playing locally; the next change retries.
      } finally {
        running = false;
      }
      // Changes made while the request was in flight (or bonus above the per-call cap) go out next.
      const after = useGameStore.getState();
      if (ok && !cancelled && (after.localRev !== after.syncedRev || after.pendingBonus > 0)) schedule();
    };
    function schedule() {
      window.clearTimeout(timer);
      timer = window.setTimeout(sync, DEBOUNCE_MS);
    }

    sync();
    const unsubscribe = useGameStore.subscribe((state, previous) => {
      if (state.localRev !== previous.localRev) schedule();
    });
    return () => { cancelled = true; window.clearTimeout(timer); unsubscribe(); };
  }, [ready]);
}
