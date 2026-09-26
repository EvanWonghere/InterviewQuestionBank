import { useEffect, useMemo } from 'react';
import { useReviewStore } from '@/store/reviewStore';
import { useGameStore } from '@/store/gameStore';
import { levelFor, mergeBestStars, totalXp } from '@/lib/gameRules';

/** XP and level for the current question list, keeping the best-star high-water mark up to date. */
export function useGameProgress(questions) {
  const reviewStates = useReviewStore((s) => s.reviewStates);
  const attempts = useReviewStore((s) => s.attempts);
  const storedBest = useGameStore((s) => s.bestStars);
  const bonusXp = useGameStore((s) => s.bonusXp);
  const saveBest = useGameStore((s) => s.mergeBestStars);

  const bestStars = useMemo(
    () => mergeBestStars(questions, reviewStates, attempts, storedBest),
    [questions, reviewStates, attempts, storedBest],
  );
  useEffect(() => { saveBest(bestStars); }, [bestStars, saveBest]);

  const xp = useMemo(() => totalXp(questions, reviewStates, bestStars, bonusXp), [questions, reviewStates, bestStars, bonusXp]);
  return { reviewStates, attempts, bestStars, xp, level: levelFor(xp) };
}
