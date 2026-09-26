import { useEffect, useMemo, useState } from 'react';
import { useReviewStore } from '@/store/reviewStore';
import { useGameStore } from '@/store/gameStore';
import {
  activeDays, dueQuestions, levelFor, mergeBestStars, petForm, streakFrom, totalXp, unlockedAchievements,
} from '@/lib/gameRules';
import { dayKey } from '@/lib/practiceCalendar';

/** XP, level, streak, due reviews, pet form and achievements, keeping the best-star high-water mark up to date. */
export function useGameProgress(questions, categories = []) {
  const reviewStates = useReviewStore((s) => s.reviewStates);
  const attempts = useReviewStore((s) => s.attempts);
  const storedBest = useGameStore((s) => s.bestStars);
  const bonusXp = useGameStore((s) => s.bonusXp);
  const records = useGameStore((s) => s.records);
  const saveBest = useGameStore((s) => s.mergeBestStars);
  const [now] = useState(() => Date.now());

  const bestStars = useMemo(
    () => mergeBestStars(questions, reviewStates, attempts, storedBest),
    [questions, reviewStates, attempts, storedBest],
  );
  useEffect(() => { saveBest(bestStars); }, [bestStars, saveBest]);

  const xp = useMemo(() => totalXp(questions, reviewStates, bestStars, bonusXp), [questions, reviewStates, bestStars, bonusXp]);
  const level = levelFor(xp);
  const today = dayKey(now);
  const streak = useMemo(() => streakFrom(activeDays(attempts), today), [attempts, today]);
  const due = useMemo(() => dueQuestions(questions, reviewStates, now, Infinity), [questions, reviewStates, now]);
  const achievements = useMemo(
    () => unlockedAchievements({ questions, categories, reviewStates, attempts, bestStars, records, streak }),
    [questions, categories, reviewStates, attempts, bestStars, records, streak],
  );

  return {
    reviewStates, attempts, bestStars, xp, level, today, streak,
    dueCount: due.length, petForm: petForm(level.index, due.length), achievements,
  };
}
