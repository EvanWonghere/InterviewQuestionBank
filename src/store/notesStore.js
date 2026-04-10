import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Per-question personal notes. Mirrors progressStore: a flat
 * Record<questionId, string> persisted to localStorage and synced via Gist.
 *
 * @type {import('zustand').UseBoundStore<import('zustand').StoreApi<{
 *   notes: Record<string, string>,
 *   setNote: (questionId: string, text: string) => void,
 *   setNotesBulk: (map: Record<string, string>) => void,
 *   getNote: (questionId: string) => string,
 * }>>}
 */
export const useNotesStore = create(
  persist(
    (set, get) => ({
      notes: {},

      setNote(questionId, text) {
        set((state) => {
          const next = { ...state.notes };
          if (!text || !text.trim()) {
            delete next[questionId];
          } else {
            next[questionId] = text;
          }
          return { notes: next };
        });
      },

      /** Overwrite the entire notes map (used by cloud sync pull). */
      setNotesBulk(map) {
        set({ notes: map ?? {} });
      },

      getNote(questionId) {
        return get().notes[questionId] ?? '';
      },
    }),
    {
      name: 'iqb:notes',
      partialize: (state) => ({ notes: state.notes }),
    }
  )
);
