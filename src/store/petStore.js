import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { REACTIONS, REACTION_MS } from '@/components/pet/petLines';

export const PET_STORAGE_KEY = 'iqb:pet';

/**
 * Shared state for the floating study pet (小芽).
 * - The tutor panel reports what it is doing (`mood`); the question page registers how to open the
 *   tutor (`opener`); a stage run says why the tutor is closed (`tutorBlocked`, e.g. no hint cards).
 * - Games call `react(event, data)`; tips call `speak(...)`. Either sets `speech`, which the pet
 *   shows for its duration. `speech.key` restarts the motion animation.
 * Persisted: `hidden`, the dragged position (`side`, `height` and `across`, each a 0–1 share of the
 * free height / width), whether it snaps to the nearest side (`snap`), the reminder switch and which
 * reminder was shown on which day.
 */
export const usePetStore = create(
  persist(
    (set, get) => ({
      hidden: false,
      side: 'right',
      height: 0,
      across: 1,
      snap: true,
      tipsEnabled: true,
      tipsShown: {},
      mood: 'idle',
      panelOpen: false,
      opener: null,
      tutorBlocked: null,
      speech: null,
      setHidden: (hidden) => set({ hidden }),
      setPosition: (side, height, across = side === 'left' ? 0 : 1) => set({
        side, height: Math.max(0, Math.min(1, height)), across: Math.max(0, Math.min(1, across)),
      }),
      // Turning snapping on moves the pet to the side it is nearer to; turning it off starts the
      // free position at the side it is on, so it does not jump.
      setSnap: (snap) => set((state) => (snap
        ? { snap, side: state.across < 0.5 ? 'left' : 'right' }
        : { snap, across: state.side === 'left' ? 0 : 1 })),
      setTipsEnabled: (tipsEnabled) => set({ tipsEnabled }),
      setMood: (mood) => set({ mood }),
      setPanelOpen: (panelOpen) => set(panelOpen ? { panelOpen } : { panelOpen, mood: 'idle' }),
      setTutorBlocked: (tutorBlocked) => set({ tutorBlocked }),
      registerOpener: (opener) => {
        set({ opener });
        return () => { if (get().opener === opener) set({ opener: null }); };
      },
      speak: ({ text, mood = 'talking', motion = null, action = null, ms = REACTION_MS, tipId = null, day = null }) => set((state) => ({
        speech: { text, mood, motion, action, until: Date.now() + ms, key: (state.speech?.key ?? 0) + 1 },
        tipsShown: tipId ? { ...state.tipsShown, [tipId]: day } : state.tipsShown,
      })),
      react: (event, data) => {
        const line = REACTIONS[event]?.(data);
        if (line) get().speak({ ...line, ms: line.ms ?? REACTION_MS });
      },
      clearSpeech: () => set({ speech: null }),
    }),
    {
      name: PET_STORAGE_KEY,
      partialize: (state) => ({ hidden: state.hidden, side: state.side, height: state.height, across: state.across, snap: state.snap, tipsEnabled: state.tipsEnabled, tipsShown: state.tipsShown }),
    },
  ),
);
