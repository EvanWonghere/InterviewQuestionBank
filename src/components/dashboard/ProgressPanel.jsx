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


  return (
    <section className="dash-ledger" aria-labelledby="dash-ledger-title">
      <div className="dash-ledger-head">
        <h2 id="dash-ledger-title" className="type-display-sm" style={{ color: 'var(--text-primary)' }}>各分类</h2>
        <span className="type-caption" style={{ color: 'var(--text-tertiary)' }}>
          做过 {touched} / {total.total} 题 · 已掌握 {total.mastered} · 需复习 {total.review} · 错题 {total.wrong}
        </span>
      </div>
      <ul className="dash-ledger-rows">
        {sortedCategories.map((cat) => {
          const s = stats[cat.id] ?? { mastered: 0, review: 0, wrong: 0, total: 0 };
          const done = s.mastered + s.review + s.wrong;
          const pct = s.total ? Math.round((done / s.total) * 100) : 0;
          const masteredPct = s.total ? (s.mastered / s.total) * 100 : 0;
          return (
            <li key={cat.id}>
              <Link to={`/quiz/${cat.id}`} className="dash-ledger-row">
                <span className="dash-ledger-name">{cat.name}</span>
                <span className="dash-ledger-bar" aria-hidden="true">
                  <span className="dash-ledger-done" style={{ width: `${pct}%` }} />
                  <span className="dash-ledger-mastered" style={{ width: `${masteredPct}%` }} />
                </span>
                <span className="dash-ledger-count">{s.mastered} / {s.total}</span>
                <span className="dash-ledger-meta">需复习 {s.review} · 错题 {s.wrong}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="type-micro" style={{ color: 'var(--text-tertiary)' }}>深色条是已掌握，浅色条是做过但还没掌握。</p>
    </section>
  );
}
