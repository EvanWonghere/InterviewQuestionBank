import { useEffect, useRef } from 'react';
import { useSyncStore } from '@/store/syncStore';
import { useProgressStore } from '@/store/progressStore';
import { findOrCreateGist, pullGist, pushGist } from '@/lib/gistApi';

const PUSH_DEBOUNCE_MS = 1500;

/**
 * Mount once at the app root. Handles:
 * - Pull on startup (when token is configured)
 * - Debounced push on every progress change
 */
export function useGistSync() {
  const token = useSyncStore((s) => s.token);
  const gistId = useSyncStore((s) => s.gistId);
  const setGistId = useSyncStore((s) => s.setGistId);
  const setSyncStatus = useSyncStore((s) => s.setSyncStatus);

  const progress = useProgressStore((s) => s.progress);
  const setProgressBulk = useProgressStore((s) => s.setProgressBulk);

  // True while a pull is in progress — suppresses the push effect for that cycle
  const isPullingRef = useRef(false);
  const pushTimerRef = useRef(null);
  // Track whether we've completed the initial pull this session
  const initialPullDoneRef = useRef(false);

  // ── Initial pull when token is available ─────────────────────────────────
  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setSyncStatus('syncing');
    isPullingRef.current = true;

    (async () => {
      try {
        let id = gistId;
        if (!id) {
          id = await findOrCreateGist(token);
          if (cancelled) return;
          setGistId(id);
        }
        const data = await pullGist(token, id);
        if (cancelled) return;
        if (data.progress && typeof data.progress === 'object') {
          setProgressBulk(data.progress);
        }
        setSyncStatus('synced');
      } catch (e) {
        if (!cancelled) setSyncStatus('error', e.message);
      } finally {
        if (!cancelled) {
          isPullingRef.current = false;
          initialPullDoneRef.current = true;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // Re-run only when the token itself changes (e.g., user saves a new token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Debounced push on progress changes ───────────────────────────────────
  useEffect(() => {
    // Skip if not configured, pull is in flight, or initial pull hasn't finished
    if (!token || !gistId || isPullingRef.current || !initialPullDoneRef.current) return;

    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    setSyncStatus('syncing');

    pushTimerRef.current = setTimeout(async () => {
      try {
        await pushGist(token, gistId, progress);
        setSyncStatus('synced');
      } catch (e) {
        setSyncStatus('error', e.message);
      }
    }, PUSH_DEBOUNCE_MS);

    return () => clearTimeout(pushTimerRef.current);
    // progress is the only trigger; token/gistId changes are handled by the pull effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);
}
