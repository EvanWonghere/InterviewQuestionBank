import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { maxStars, mergeRecords } from '@/lib/gameRules';

export const GAME_STORAGE_KEY = 'iqb:game';

// Every local change bumps `localRev`; a sync sends the state at some revision and marks it synced,
// so changes made while a request is in flight are sent next time instead of being lost.
const touched = (state, patch) => ({ ...patch, localRev: state.localRev + 1 });

/**
 * Local state of the stage game. Stars, XP and levels are derived from review data
 * (src/lib/gameRules.js); this store only keeps what cannot be derived:
 * stage, patrol and boss run results, the best-star high-water mark per question, combo bonus XP,
 * achievements already announced and quiet mode. Administrators also sync it to game_progress
 * (useGameSync); `pendingBonus` is the bonus XP earned since the last successful sync.
 */
export const useGameStore = create(
  persist(
    (set) => ({
      records: {},
      bestStars: {},
      bonusXp: 0,
      pendingBonus: 0,
      quiet: false,
      seenAchievements: [],
      localRev: 0,
      syncedRev: 0,
      setQuiet: (quiet) => set({ quiet }),
      mergeBestStars: (bestStars) => set((state) => {
        const changed = Object.entries(bestStars).some(([id, stars]) => stars > (state.bestStars[id] ?? 0));
        return changed ? touched(state, { bestStars: { ...state.bestStars, ...bestStars } }) : state;
      }),
      addBonusXp: (xp) => set((state) => touched(state, { bonusXp: state.bonusXp + xp, pendingBonus: state.pendingBonus + xp })),
      recordRun: ({ key, cleared, flawless, unassisted = false, maxCombo = 0 }) => set((state) => {
        const previous = state.records[key] ?? { cleared: false, flawless: false, unassisted: false, maxCombo: 0, runs: 0 };
        return touched(state, {
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
        });
      }),
      /** Boss fight result; `day` is the local calendar day, used for the daily fight limit. */
      recordBoss: ({ key, defeated, damage, day }) => set((state) => {
        const previous = state.records[key] ?? {};
        return touched(state, {
          records: {
            ...state.records,
            [key]: {
              ...previous,
              defeated: Boolean(previous.defeated) || defeated,
              bestDamage: Math.max(previous.bestDamage ?? 0, damage),
              runs: (previous.runs ?? 0) + 1,
              fightDay: day,
              fightsToday: previous.fightDay === day ? (previous.fightsToday ?? 0) + 1 : 1,
              lastRunAt: new Date().toISOString(),
            },
          },
        });
      }),
      markAchievementsSeen: (ids) => set((state) => {
        const fresh = ids.filter((id) => !state.seenAchievements.includes(id));
        return fresh.length ? touched(state, { seenAchievements: [...state.seenAchievements, ...fresh] }) : state;
      }),
      /** Adopt the merged cloud row returned for a sync that sent `sentBonus` at revision `sentRev`. */
      adoptCloud: (row, { sentBonus, sentRev }) => set((state) => ({
        records: mergeRecords(state.records, row.records),
        bestStars: maxStars(state.bestStars, row.best_stars),
        bonusXp: row.bonus_xp + (state.pendingBonus - sentBonus),
        pendingBonus: state.pendingBonus - sentBonus,
        seenAchievements: [...new Set([...state.seenAchievements, ...(row.seen_achievements ?? [])])],
        syncedRev: sentRev,
      })),
    }),
    {
      name: GAME_STORAGE_KEY,
      version: 1,
      // Before cloud sync, bonus XP had no pending counter: send all of it with the first sync.
      migrate: (persisted, version) => (version < 1
        ? { ...persisted, pendingBonus: persisted?.bonusXp ?? 0, localRev: 1, syncedRev: 0 }
        : persisted),
    },
  ),
);
