import { Link } from 'react-router-dom';
import { useCategoryStats } from '@/hooks/useProgress';

/**
 * @param {{ categories: Array<{ id: string, name: string, order: number }>, questions: Array<{ id: string, categoryId: string }> }} props
 */
export default function ProgressPanel({ categories, questions }) {
  const stats = useCategoryStats(questions);

  const sortedCategories = [...(categories || [])].sort((a, b) => a.order - b.order);

  const total = {
    mastered: Object.values(stats).reduce((s, c) => s + c.mastered, 0),
    review: Object.values(stats).reduce((s, c) => s + c.review, 0),
    wrong: Object.values(stats).reduce((s, c) => s + c.wrong, 0),
    total: questions?.length ?? 0,
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">总体进度</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950/30">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{total.mastered}</p>
            <p className="text-sm text-green-600 dark:text-green-500">已掌握</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950/30">
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{total.review}</p>
            <p className="text-sm text-amber-600 dark:text-amber-500">需复习</p>
          </div>
          <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950/30">
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">{total.wrong}</p>
            <p className="text-sm text-red-600 dark:text-red-500">错题本</p>
          </div>
          <div className="rounded-lg bg-neutral-100 p-4 dark:bg-neutral-800">
            <p className="text-2xl font-bold text-neutral-700 dark:text-neutral-300">{total.total}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">总题数</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
          已完成 {total.mastered + total.review + total.wrong} / {total.total} 题
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">各分类进度</h2>
        <ul className="space-y-3">
          {sortedCategories.map((cat) => {
            const s = stats[cat.id] ?? { mastered: 0, review: 0, wrong: 0, total: 0 };
            const done = s.mastered + s.review + s.wrong;
            return (
              <li key={cat.id} className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
                <div className="flex-1">
                  <p className="font-medium text-neutral-900 dark:text-white">{cat.name}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    已掌握 {s.mastered} / 需复习 {s.review} / 错题 {s.wrong} — 共 {s.total} 题
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                    {s.total ? Math.round((done / s.total) * 100) : 0}%
                  </span>
                  <Link
                    to={`/quiz/${cat.id}`}
                    className="rounded-lg bg-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
                  >
                    去刷题
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
