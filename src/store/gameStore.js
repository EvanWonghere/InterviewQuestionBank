import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const GAME_STORAGE_KEY = 'iqb:game';

/**
 * Local state of the stage game. Stars, XP and levels are derived from review data
 * (src/lib/gameRules.js); this store only keeps what cannot be derived:
 * stage run results, the best-star high-water mark per question, combo bonus XP and quiet mode.
 */
export const useGameStore = create(
  persist(
    (set) => ({
      records: {},
      bestStars: {},
      bonusXp: 0,
      quiet: false,
      setQuiet: (quiet) => set({ quiet }),
      mergeBestStars: (bestStars) => set((state) => {
        const changed = Object.entries(bestStars).some(([id, stars]) => stars > (state.bestStars[id] ?? 0));
        return changed ? { bestStars: { ...state.bestStars, ...bestStars } } : state;
      }),
      addBonusXp: (xp) => set((state) => ({ bonusXp: state.bonusXp + xp })),
      recordRun: ({ key, cleared, flawless }) => set((state) => {
        const previous = state.records[key] ?? { cleared: false, flawless: false, runs: 0 };
        return {
          records: {
            ...state.records,
            [key]: {
              cleared: previous.cleared || cleared,
              flawless: previous.flawless || (cleared && flawless),
              runs: previous.runs + 1,
              lastRunAt: new Date().toISOString(),
            },
          },
        };
      }),
    }),
    { name: GAME_STORAGE_KEY },
  ),
);
