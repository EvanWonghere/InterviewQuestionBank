import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useQuestions } from '@/context/QuestionsContext';
import { useReviewStore } from '@/store/reviewStore';
import { REVIEW_RATINGS } from '@/lib/sm2';
import { loadFirstAttemptAt, loadPracticeCalendar, loadPracticeDay } from '@/data/calendarRepository';
import {
  METRICS, addDays, aggregateLocalAttempts, buildCalendarGrid, computeStreaks, dayKey, describeDay, levelFor, localTimeZone, rangeFor, scaleFor,
} from '@/lib/practiceCalendar';

const WEEKDAY_LABELS = ['', '一', '', '三', '', '五', ''];
const RATING_LABELS = Object.fromEntries(Object.values(REVIEW_RATINGS).map((r) => [r.quality, r.label]));

export default function PracticeHeatmap() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  if (authLoading) return null;
  const cloudUserId = user && isAdmin ? user.id : null;
  return <HeatmapState key={cloudUserId ?? 'local'} cloudUserId={cloudUserId} />;
}

function HeatmapState({ cloudUserId }) {
  const [timeZone] = useState(localTimeZone);
  const [today] = useState(() => dayKey(Date.now(), timeZone));
  const localAttempts = useReviewStore((state) => state.attempts);
  const { questions } = useQuestions();
  const questionMap = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);

  const [range, setRange] = useState('recent');
  const [metric, setMetric] = useState('attempts');
  const [cloud, setCloud] = useState({ rows: [], loading: Boolean(cloudUserId), error: '' });
  const [recentCloudRows, setRecentCloudRows] = useState([]);
  const [firstYear, setFirstYear] = useState(null);
  const [focusKey, setFocusKey] = useState(today);
  const [hoverKey, setHoverKey] = useState(null);
  const [selected, setSelected] = useState(null);
  const [cloudDay, setCloudDay] = useState({ key: null, attempts: [], loading: false, error: '' });
  const scroller = useRef(null);
  const grid = useRef(null);

  const { from, to } = rangeFor(range, today);

  useEffect(() => {
    if (!cloudUserId) return;
    let alive = true;
    loadFirstAttemptAt(cloudUserId)
      .then((at) => { if (alive && at) setFirstYear(Number(dayKey(at, timeZone).slice(0, 4))); })
      .catch(() => {});
    return () => { alive = false; };
  }, [cloudUserId, timeZone]);

  useEffect(() => {
    if (!cloudUserId) return;
    let alive = true;
    setCloud((c) => ({ ...c, loading: true, error: '' }));
    loadPracticeCalendar({ timeZone, from, to })
      .then((rows) => {
        if (!alive) return;
        setCloud({ rows, loading: false, error: '' });
        if (range === 'recent') setRecentCloudRows(rows);
      })
      .catch(() => { if (alive) setCloud({ rows: [], loading: false, error: '刷题日历加载失败，请稍后刷新。' }); });
    return () => { alive = false; };
  }, [cloudUserId, timeZone, from, to, range]);

  const localRows = useMemo(() => (cloudUserId ? [] : aggregateLocalAttempts(localAttempts, timeZone)), [cloudUserId, localAttempts, timeZone]);
  const allRows = cloudUserId ? cloud.rows : localRows;
  const rows = useMemo(() => allRows.filter((row) => row.day >= from && row.day <= to), [allRows, from, to]);
  const rowsByDay = useMemo(() => new Map(rows.map((row) => [row.day, row])), [rows]);
  const { weeks, months } = useMemo(() => buildCalendarGrid(rowsByDay, { from, to }), [rowsByDay, from, to]);
  const scale = useMemo(() => scaleFor(rows.map(METRICS[metric].value)), [rows, metric]);

  const earliestYear = cloudUserId ? firstYear : localRows[0] ? Number(localRows[0].day.slice(0, 4)) : null;
  const years = [];
  for (let y = Number(today.slice(0, 4)); earliestYear && y >= earliestYear; y -= 1) years.push(y);

  // Streaks always look back from today over the recent year, independent of the displayed year.
  const streakRows = cloudUserId ? recentCloudRows : localRows;
  const streaks = useMemo(() => computeStreaks(new Set(streakRows.filter((r) => r.attempts > 0).map((r) => r.day)), today), [streakRows, today]);
  const totals = { attempts: rows.reduce((s, r) => s + r.attempts, 0), activeDays: rows.filter((r) => r.attempts > 0).length };

  useEffect(() => {
    // Most recent weeks sit on the right; show them first on narrow screens.
    if (scroller.current && range === 'recent') scroller.current.scrollLeft = scroller.current.scrollWidth;
  }, [range, weeks.length, cloud.loading]);

  const inRangeFocus = focusKey >= from && focusKey <= to ? focusKey : to;

  const moveFocus = (event) => {
    const step = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = addDays(inRangeFocus, step);
    if (next < from || next > to) return;
    setFocusKey(next);
    grid.current?.querySelector(`[data-day="${next}"]`)?.focus();
  };

  const selectDay = (key) => {
    const next = selected === key ? null : key;
    setSelected(next);
    setFocusKey(key);
    if (!next || !cloudUserId || !rowsByDay.get(key)?.attempts) return;
    setCloudDay({ key, attempts: [], loading: true, error: '' });
    loadPracticeDay({ timeZone, day: key })
      .then((attempts) => setCloudDay((d) => (d.key === key ? { key, attempts, loading: false, error: '' } : d)))
      .catch(() => setCloudDay((d) => (d.key === key ? { key, attempts: [], loading: false, error: '当天记录加载失败。' } : d)));
  };

  const infoKey = hoverKey ?? selected;
  const dayAttempts = !selected ? [] : cloudUserId
    ? (cloudDay.key === selected ? cloudDay.attempts : [])
    : localAttempts.filter((a) => dayKey(a.answered_at, timeZone) === selected);

  return (
    <section className="mb-12" aria-labelledby="practice-heatmap-title">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="practice-heatmap-title" className="type-display-sm" style={{ color: 'var(--text-primary)' }}>刷题日历</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1" role="group" aria-label="着色指标">
            {Object.entries(METRICS).map(([key, { label }]) => (
              <button key={key} type="button" aria-pressed={metric === key} className={`filter-pill ${metric === key ? 'is-active' : ''}`} onClick={() => setMetric(key)}>{label}</button>
            ))}
          </div>
          <select className="input-apple heatmap-range" aria-label="时间范围" value={range} onChange={(event) => { setRange(event.target.value); setSelected(null); }}>
            <option value="recent">最近一年</option>
            {years.map((y) => <option key={y} value={String(y)}>{y} 年</option>)}
          </select>
        </div>
      </div>

      <div className="surface-card-elevated p-6">
        <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {[
            [range === 'recent' ? '一年内作答' : `${range} 年作答`, totals.attempts],
            ['活跃天数', totals.activeDays],
            ['当前连续', `${streaks.current} 天`],
            ['一年内最长连续', `${streaks.longest} 天`],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="type-display-md" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</p>
              <p className="type-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
            </div>
          ))}
        </div>

        <p className="type-caption mb-2 heatmap-info" aria-live="polite" style={{ color: 'var(--text-secondary)' }}>
          {cloud.loading ? '正在加载…' : infoKey ? describeDay(infoKey, rowsByDay.get(infoKey)) : '悬停或用方向键查看每天的刷题情况，点击查看明细'}
        </p>

        <div ref={scroller} className="heatmap-scroll">
          <div className="heatmap" style={{ '--weeks': weeks.length }}>
            <div className="heatmap-months" aria-hidden="true">
              {months.map((m) => <span key={`${m.index}-${m.label}`} style={{ gridColumn: `${m.index + 1} / span 3` }}>{m.label}</span>)}
            </div>
            <div className="heatmap-weekdays" aria-hidden="true">
              {WEEKDAY_LABELS.map((label, i) => <span key={i}>{label}</span>)}
            </div>
            <div ref={grid} className="heatmap-grid" role="group" aria-label="每日刷题热力图" onKeyDown={moveFocus} onMouseLeave={() => setHoverKey(null)}>
              {weeks.map((week) => week.map((cell) => {
                if (!cell.inRange) return <span key={cell.key} className="heat-cell is-empty" aria-hidden="true" />;
                const label = describeDay(cell.key, cell.row);
                return (
                  <button
                    key={cell.key}
                    type="button"
                    data-day={cell.key}
                    data-level={levelFor(metric, cell.row, scale)}
                    className={`heat-cell${cell.key === today ? ' is-today' : ''}${cell.key === selected ? ' is-selected' : ''}${cell.row?.interviews ? ' has-interview' : ''}`}
                    tabIndex={cell.key === inRangeFocus ? 0 : -1}
                    aria-label={label}
                    aria-pressed={cell.key === selected}
                    title={label}
                    onMouseEnter={() => setHoverKey(cell.key)}
                    onFocus={() => { setFocusKey(cell.key); setHoverKey(cell.key); }}
                    onBlur={() => setHoverKey(null)}
                    onClick={() => selectDay(cell.key)}
                  />
                );
              }))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 type-micro" style={{ color: 'var(--text-tertiary)' }}>
          <span>{cloudUserId ? '云端作答记录' : '仅本设备最近 500 次作答'}{metric === 'quality' ? ' · 颜色表示当天平均自评' : ''}</span>
          <span className="heatmap-legend" aria-hidden="true">
            {metric === 'quality' ? '低' : '少'}
            {[0, 1, 2, 3, 4].map((level) => <span key={level} className="heat-cell" data-level={level} />)}
            {metric === 'quality' ? '高' : '多'}
          </span>
        </div>
        {cloud.error && <p className="type-caption mt-3" style={{ color: 'var(--error-fg)' }}>{cloud.error}</p>}

        {selected && (
          <DayDetail
            day={selected}
            row={rowsByDay.get(selected)}
            attempts={dayAttempts}
            loading={Boolean(cloudUserId) && cloudDay.key === selected && cloudDay.loading}
            error={cloudDay.key === selected ? cloudDay.error : ''}
            questionMap={questionMap}
          />
        )}
      </div>
    </section>
  );
}

function DayDetail({ day, row, attempts, loading, error, questionMap }) {
  return (
    <div className="heatmap-detail mt-5 pt-5">
      <p className="type-body-emphasis">{describeDay(day, row)}</p>
      {loading && <p className="type-caption mt-2" role="status">正在加载当天记录…</p>}
      {error && <p className="type-caption mt-2" style={{ color: 'var(--error-fg)' }}>{error}</p>}
      {!loading && !error && row?.attempts > 0 && (
        <ul className="mt-3 space-y-2">
          {attempts.map((attempt) => {
            const question = questionMap.get(attempt.question_id);
            return (
              <li key={attempt.id} className="flex flex-wrap items-center justify-between gap-2 type-caption">
                {question
                  ? <Link to={`/quiz?q=${encodeURIComponent(question.title)}`} style={{ color: 'var(--accent)' }}>{question.title}</Link>
                  : <span style={{ color: 'var(--text-tertiary)' }}>已归档题目</span>}
                <span className="flex flex-wrap gap-2" style={{ color: 'var(--text-tertiary)' }}>
                  {typeof attempt.is_correct === 'boolean' && <span>{attempt.is_correct ? '正确' : '错误'}</span>}
                  <span className={`chip ${attempt.quality < 3 ? 'chip-difficulty-hard' : 'chip-difficulty-easy'}`}>{RATING_LABELS[attempt.quality] ?? `评分 ${attempt.quality}`}</span>
                  {attempt.ai_evaluation?.score != null && <span>AI {attempt.ai_evaluation.score}</span>}
                  {attempt.assistance_used === true && <span>AI辅助</span>}
                  <span>{new Date(attempt.answered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
