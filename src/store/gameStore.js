import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const GAME_STORAGE_KEY = 'iqb:game';

/**
 * Local state of the stage game. Stars, XP and levels are derived from review data
 * (src/lib/gameRules.js); this store only keeps what cannot be derived:
 * stage and patrol run results, the best-star high-water mark per question, combo bonus XP,
 * achievements already announced and quiet mode.
 */
export const useGameStore = create(
  persist(
    (set) => ({
      records: {},
      bestStars: {},
      bonusXp: 0,
      quiet: false,
      seenAchievements: [],
      setQuiet: (quiet) => set({ quiet }),
      mergeBestStars: (bestStars) => set((state) => {
        const changed = Object.entries(bestStars).some(([id, stars]) => stars > (state.bestStars[id] ?? 0));
        return changed ? { bestStars: { ...state.bestStars, ...bestStars } } : state;
      }),
      addBonusXp: (xp) => set((state) => ({ bonusXp: state.bonusXp + xp })),
      recordRun: ({ key, cleared, flawless, unassisted = false, maxCombo = 0 }) => set((state) => {
        const previous = state.records[key] ?? { cleared: false, flawless: false, unassisted: false, maxCombo: 0, runs: 0 };
        return {
          records: {
            ...state.records,
            [key]: {
              cleared: previous.cleared || cleared,
              flawless: previous.flawless || (cleared && flawless),
              // Same run as flawless, so 零 GC needs one run that was both.
              unassisted: previous.unassisted || (cleared && flawless && unassisted),
              maxCombo: Math.max(previous.maxCombo ?? 0, maxCombo),
              completed: true,
              runs: previous.runs + 1,
              lastRunAt: new Date().toISOString(),
            },
          },
        };
      }),
      markAchievementsSeen: (ids) => set((state) => {
        const fresh = ids.filter((id) => !state.seenAchievements.includes(id));
        return fresh.length ? { seenAchievements: [...state.seenAchievements, ...fresh] } : state;
      }),
    }),
    { name: GAME_STORAGE_KEY },
  ),
);
