import { Link } from 'react-router-dom';
import { useCategoryStats } from '@/hooks/useProgress';
import { activeDays } from '@/lib/gameRules';
import { addDays } from '@/lib/practiceCalendar';
import '@/components/game/game.css';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function Ring({ value }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <svg className="dash-ring" width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
      <circle cx="38" cy="38" r={r} fill="none" stroke="var(--track-bg)" strokeWidth="6" />
      {value > 0 && (
        <circle cx="38" cy="38" r={r} fill="none" stroke="var(--apple-blue)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${c * value} ${c}`} transform="rotate(-90 38 38)" />
      )}
    </svg>
  );
}

/** The four figures that open the overview: due reviews, streak, level and mastery. `game` is useGameProgress. */
export default function TodayTiles({ questions, game }) {
  const stats = useCategoryStats(questions);
  const mastered = Object.values(stats).reduce((sum, s) => sum + s.mastered, 0);
  const days = new Set(activeDays(game.attempts));
  const week = Array.from({ length: 7 }, (_, i) => addDays(game.today, i - 6));
  const { level, streak } = game;

  return (
    <section className="dash-tiles" aria-label="今天">
      <article className="surface-card dash-tile">
        <h2 className="dash-tile-label">今日巡检</h2>
        <p className="dash-figure">{game.dueCount}<small>道题到期</small></p>
        {game.dueCount
          ? <Link to="/patrol" className="btn-blue dash-tile-action">开始巡检</Link>
          : <Link to="/random-practice" className="btn-neutral dash-tile-action">随机来一题</Link>}
      </article>

      <article className="surface-card dash-tile">
        <h2 className="dash-tile-label">连续答题</h2>
        <p className="dash-figure">{streak.streak}<small>天{streak.freezes ? ` · 补签卡 ${streak.freezes} 张` : ''}</small></p>
        <ol className="dash-week" aria-label="最近 7 天">
          {week.map((day) => (
            <li key={day} className={days.has(day) ? 'is-on' : ''} aria-label={`${day}${days.has(day) ? '，答过题' : ''}`}>
              <span aria-hidden="true" />
              {WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()]}
            </li>
          ))}
        </ol>
      </article>

      <article className="surface-card dash-tile">
        <h2 className="dash-tile-label">职级</h2>
        <div className="dash-level">
          <span className="dash-ring-wrap">
            <Ring value={level.progress} />
            <span className="dash-ring-value">{Math.round(level.progress * 100)}%</span>
          </span>
          <span className="dash-level-text">
            <strong>{level.name}</strong>
            <small>{level.next ? `${level.xp.toLocaleString()} / ${level.next.xp.toLocaleString()} 经验` : `${level.xp.toLocaleString()} 经验 · 已满级`}</small>
          </span>
        </div>
        <Link to="/map" className="dash-tile-link">闯关地图 →</Link>
      </article>

      <article className="surface-card dash-tile">
        <h2 className="dash-tile-label">已掌握</h2>
        <p className="dash-figure">{mastered}<small>/ {questions.length} 题</small></p>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${questions.length ? (mastered / questions.length) * 100 : 0}%` }} /></div>
        <Link to="/review/due" className="dash-tile-link">今日复习 →</Link>
      </article>
    </section>
  );
}
