import { useMemo } from 'react';
import { useProgressStore } from '@/store/progressStore';

/**
 * @param {Array<{ id: string, categoryId: string }>} questions
 * @returns {Record<string, { mastered: number, review: number, wrong: number, total: number }>} stats by categoryId
 */
export function useCategoryStats(questions) {
  const progress = useProgressStore((s) => s.progress);
  return useMemo(() => {
    const byCategory = {};
    for (const q of questions || []) {
      const cid = q.categoryId;
      if (!byCategory[cid]) byCategory[cid] = { mastered: 0, review: 0, wrong: 0, total: 0 };
      byCategory[cid].total++;
      const status = progress[q.id];
      if (status === 'mastered') byCategory[cid].mastered++;
      else if (status === 'review') byCategory[cid].review++;
      else if (status === 'wrong') byCategory[cid].wrong++;
    }
    return byCategory;
  }, [questions, progress]);
}

export function useProgress() {
  const setProgress = useProgressStore((s) => s.setProgress);
  const getProgress = useProgressStore((s) => s.getProgress);
  return { setProgress, getProgress };
}
