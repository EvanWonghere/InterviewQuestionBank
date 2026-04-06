import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEY_PROGRESS, DEFAULT_PROGRESS } from '@/constants/storageKeys';

/** @typedef {'mastered'|'review'|'wrong'} ProgressStatus */

/**
 * @type {import('zustand').UseBoundStore<import('zustand').StoreApi<{
 *   progress: Record<string, ProgressStatus>,
 *   setProgress: (questionId: string, status: ProgressStatus | null) => void,
 *   getProgress: (questionId: string) => ProgressStatus | undefined,
 * }>>}
 */
export const useProgressStore = create(
  persist(
    (set, get) => ({
      progress: DEFAULT_PROGRESS,

      setProgress(questionId, status) {
        set((state) => {
          const next = { ...state.progress };
          if (status == null) {
            delete next[questionId];
          } else {
            next[questionId] = status;
          }
          return { progress: next };
        });
      },

      /** Overwrite the entire progress map (used by cloud sync pull). */
      setProgressBulk(progressMap) {
        set({ progress: progressMap });
      },

      getProgress(questionId) {
        return get().progress[questionId];
      },
    }),
    {
      name: STORAGE_KEY_PROGRESS,
      partialize: (state) => ({ progress: state.progress }),
    }
  )
);
