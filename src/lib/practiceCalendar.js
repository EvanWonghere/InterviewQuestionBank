// Date keys are local calendar days ('YYYY-MM-DD'); arithmetic runs in UTC to avoid DST drift.
const DAY_MS = 86400000;

export function localTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function dayKey(date, timeZone = localTimeZone()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(date));
}

const toUtc = (key) => Date.parse(`${key}T00:00:00Z`);
export const addDays = (key, days) => new Date(toUtc(key) + days * DAY_MS).toISOString().slice(0, 10);
export const weekday = (key) => new Date(toUtc(key)).getUTCDay();
export const diffDays = (a, b) => Math.round((toUtc(a) - toUtc(b)) / DAY_MS);

export function rangeFor(range, today) {
  if (range === 'recent') return { from: addDays(today, -364), to: today };
  return { from: `${range}-01-01`, to: `${range}-12-31` };
}

/** Columns are Sunday-first weeks; cells outside [from, to] stay as placeholders. */
export function buildCalendarGrid(rowsByDay, { from, to }) {
  const start = addDays(from, -weekday(from));
  const end = addDays(to, 6 - weekday(to));
  const weeks = [];
  const months = [];
  for (let key = start, index = 0; key <= end; index += 1) {
    const week = [];
    for (let d = 0; d < 7; d += 1, key = addDays(key, 1)) {
      const inRange = key >= from && key <= to;
      week.push({ key, inRange, row: inRange ? rowsByDay.get(key) ?? null : null });
      if (inRange && (key === from || key.endsWith('-01'))) {
        const month = Number(key.slice(5, 7));
        // A label needs about two columns; skip one that would collide with the previous.
        if (!months.length || index - months.at(-1).index >= 2) months.push({ index, label: `${month}月` });
      }
    }
    weeks.push(week);
  }
  return { weeks, months };
}

export const METRICS = {
  attempts: { label: '次数', value: (row) => row?.attempts ?? 0 },
  questions: { label: '题数', value: (row) => row?.questions ?? 0 },
  quality: { label: '掌握质量', value: (row) => (row?.attempts ? Number(row.avg_quality) : 0) },
};

/** Relative intensity like GitHub: scale to the 90th percentile so one outlier day does not flatten the rest. */
export function scaleFor(values) {
  const active = values.filter((v) => v > 0).sort((a, b) => a - b);
  if (!active.length) return 0;
  return active[Math.min(active.length - 1, Math.floor(active.length * 0.9))];
}

export function levelFor(metric, row, scale) {
  if (!row?.attempts) return 0;
  if (metric === 'quality') {
    // SM-2 quality is absolute (0–5): again, hard, good, easy.
    const q = Number(row.avg_quality);
    return q < 2 ? 1 : q < 3.5 ? 2 : q < 4.5 ? 3 : 4;
  }
  const value = METRICS[metric].value(row);
  if (!scale) return 0;
  return Math.max(1, Math.min(4, Math.ceil((value / scale) * 4)));
}

export function computeStreaks(activeKeys, today) {
  const sorted = [...activeKeys].sort();
  let longest = 0;
  let run = 0;
  let previous = null;
  for (const key of sorted) {
    run = previous && diffDays(key, previous) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = key;
  }
  // An unfinished today does not break the streak yet.
  let cursor = activeKeys.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (activeKeys.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  return { current, longest };
}

export function aggregateLocalAttempts(attempts, timeZone = localTimeZone()) {
  const days = new Map();
  for (const attempt of attempts) {
    const key = dayKey(attempt.answered_at, timeZone);
    const day = days.get(key) ?? { day: key, attempts: 0, questionIds: new Set(), objective: 0, correct: 0, qualitySum: 0 };
    day.attempts += 1;
    day.questionIds.add(attempt.question_id);
    if (typeof attempt.is_correct === 'boolean') {
      day.objective += 1;
      if (attempt.is_correct) day.correct += 1;
    }
    day.qualitySum += attempt.quality ?? 0;
    days.set(key, day);
  }
  return [...days.values()]
    .map(({ questionIds, qualitySum, ...day }) => ({ ...day, questions: questionIds.size, avg_quality: Math.round((qualitySum / day.attempts) * 100) / 100 }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

export function describeDay(key, row) {
  if (!row?.attempts) return `${key} · 未刷题`;
  const parts = [key, `${row.attempts} 次`, `${row.questions} 题`];
  if (row.objective) parts.push(`正确率 ${Math.round((row.correct / row.objective) * 100)}%`);
  parts.push(`平均评分 ${Number(row.avg_quality).toFixed(1)}`);
  if (row.ai_avg_score != null) parts.push(`AI 均分 ${Math.round(row.ai_avg_score)}`);
  if (row.interviews) parts.push(`模拟面试 ${row.interviews} 场`);
  return parts.join(' · ');
}
