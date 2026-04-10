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

  const touched = total.mastered + total.review + total.wrong;
  const overallPct = total.total ? Math.round((touched / total.total) * 100) : 0;

  const summaryItems = [
    { label: '总题数', value: total.total },
    { label: '已掌握', value: total.mastered },
    { label: '需复习', value: total.review },
    { label: '错题', value: total.wrong },
  ];

  return (
    <div className="space-y-10">
      {/* Overall progress */}
      <section>
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="type-display-sm" style={{ color: 'var(--text-primary)' }}>
            总体进度
          </h2>
          <span className="type-caption" style={{ color: 'var(--text-tertiary)' }}>
            {touched} / {total.total} · {overallPct}%
          </span>
        </div>

        <div className="surface-card-elevated p-7">
          <div className="mb-6">
            <div className="progress-track">
              <div
                className={`progress-fill${overallPct >= 100 ? ' is-complete' : ''}`}
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            {summaryItems.map((item) => (
              <div key={item.label}>
                <p
                  className="type-display-md"
                  style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
                >
                  {item.value}
                </p>
                <p className="type-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category breakdown */}
      <section>
        <h2 className="type-display-sm mb-5" style={{ color: 'var(--text-primary)' }}>
          各分类进度
        </h2>

        <ul className="grid gap-3 sm:grid-cols-2">
          {sortedCategories.map((cat) => {
            const s = stats[cat.id] ?? { mastered: 0, review: 0, wrong: 0, total: 0 };
            const done = s.mastered + s.review + s.wrong;
            const pct = s.total ? Math.round((done / s.total) * 100) : 0;
            return (
              <li key={cat.id}>
                <Link
                  to={`/quiz/${cat.id}`}
                  className="surface-card block p-5 transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <p
                      className="type-body-emphasis truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {cat.name}
                    </p>
                    <span
                      className="type-caption-bold shrink-0"
                      style={{ color: pct >= 100 ? 'var(--success-fg)' : 'var(--apple-blue)' }}
                    >
                      {pct}%
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="progress-track">
                      <div
                        className={`progress-fill${pct >= 100 ? ' is-complete' : ''}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <p className="type-micro" style={{ color: 'var(--text-tertiary)' }}>
                    已掌握 {s.mastered} · 需复习 {s.review} · 错题 {s.wrong} · 共 {s.total}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
