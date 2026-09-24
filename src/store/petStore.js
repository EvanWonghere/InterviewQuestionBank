import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const PET_STORAGE_KEY = 'iqb:pet';

/**
 * Shared state for the floating study pet. The tutor panel reports what it is
 * doing (`mood`); the question page registers how to open the tutor (`opener`).
 * Only `hidden` is persisted.
 */
export const usePetStore = create(
  persist(
    (set, get) => ({
      hidden: false,
      mood: 'idle',
      panelOpen: false,
      opener: null,
      setHidden: (hidden) => set({ hidden }),
      setMood: (mood) => set({ mood }),
      setPanelOpen: (panelOpen) => set(panelOpen ? { panelOpen } : { panelOpen, mood: 'idle' }),
      registerOpener: (opener) => {
        set({ opener });
        return () => { if (get().opener === opener) set({ opener: null }); };
      },
    }),
    { name: PET_STORAGE_KEY, partialize: (state) => ({ hidden: state.hidden }) },
  ),
);
