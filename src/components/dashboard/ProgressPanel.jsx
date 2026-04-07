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
      <div className="panel-surface rounded-xl p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">总体进度</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-emerald-200/70 bg-emerald-100/55 p-4 dark:border-emerald-500/25 dark:bg-emerald-500/10">
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{total.mastered}</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">已掌握</p>
          </div>
          <div className="rounded-lg border border-amber-200/70 bg-amber-100/55 p-4 dark:border-amber-500/25 dark:bg-amber-500/10">
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{total.review}</p>
            <p className="text-sm text-amber-600 dark:text-amber-400">需复习</p>
          </div>
          <div className="rounded-lg border border-rose-200/70 bg-rose-100/55 p-4 dark:border-rose-500/25 dark:bg-rose-500/10">
            <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{total.wrong}</p>
            <p className="text-sm text-rose-600 dark:text-rose-400">错题本</p>
          </div>
          <div className="rounded-lg border border-sky-200/70 bg-sky-100/55 p-4 dark:border-sky-500/25 dark:bg-sky-500/10">
            <p className="text-2xl font-bold text-sky-700 dark:text-sky-300">{total.total}</p>
            <p className="text-sm text-sky-600 dark:text-sky-400">总题数</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Progress: {total.mastered + total.review + total.wrong} / {total.total}
        </p>
      </div>

      <div className="panel-surface rounded-xl p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">各分类进度</h2>
        <ul className="space-y-3">
          {sortedCategories.map((cat) => {
            const s = stats[cat.id] ?? { mastered: 0, review: 0, wrong: 0, total: 0 };
            const done = s.mastered + s.review + s.wrong;
            return (
              <li key={cat.id} className="flex items-center justify-between rounded-lg border border-white/70 bg-white/65 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex-1">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{cat.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    已掌握 {s.mastered} / 需复习 {s.review} / 错题 {s.wrong} — 共 {s.total} 题
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {s.total ? Math.round((done / s.total) * 100) : 0}%
                  </span>
                  <Link
                    to={`/quiz/${cat.id}`}
                    className="rounded-lg border border-white/75 bg-white/75 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
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
