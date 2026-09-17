import { describe, it, expect } from 'vitest';
import {
  addDays, aggregateLocalAttempts, buildCalendarGrid, computeStreaks, dayKey, describeDay, levelFor, rangeFor, scaleFor, weekday,
} from './practiceCalendar';

describe('calendar grid', () => {
  it('aligns weeks to Sunday and pads out-of-range cells', () => {
    const { from, to } = rangeFor('recent', '2026-09-17');
    expect(from).toBe('2025-09-18');
    const { weeks } = buildCalendarGrid(new Map(), { from, to });
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weekday(weeks[0][0].key)).toBe(0);
    expect(weeks.flat().filter((c) => c.inRange)).toHaveLength(365);
    expect(weeks.flat().find((c) => c.inRange).key).toBe(from);
    expect(weeks.at(-1).filter((c) => c.inRange).at(-1).key).toBe(to);
  });

  it('covers leap years and places month labels without collisions', () => {
    const { weeks, months } = buildCalendarGrid(new Map([['2028-02-29', { attempts: 1 }]]), rangeFor('2028', '2028-06-01'));
    expect(weeks.flat().filter((c) => c.inRange)).toHaveLength(366);
    expect(weeks.flat().find((c) => c.key === '2028-02-29').row).toEqual({ attempts: 1 });
    expect(months[0]).toEqual({ index: 0, label: '1月' });
    expect(months.map((m) => m.label)).toContain('12月');
    months.slice(1).forEach((m, i) => expect(m.index - months[i].index).toBeGreaterThanOrEqual(2));
  });

  it('crosses year boundaries in date arithmetic', () => {
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('levels', () => {
  it('is empty without attempts and scales relative to the 90th percentile', () => {
    expect(levelFor('attempts', null, 10)).toBe(0);
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100];
    const scale = scaleFor(values);
    expect(scale).toBe(100);
    expect(scaleFor([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 100])).toBe(19);
    expect(scaleFor([2, 2, 2])).toBe(2);
    expect(levelFor('attempts', { attempts: 2 }, 2)).toBe(4);
    expect(levelFor('attempts', { attempts: 1 }, 8)).toBe(1);
    expect(levelFor('attempts', { attempts: 50 }, 8)).toBe(4);
    expect(scaleFor([])).toBe(0);
  });

  it('colors quality on the absolute SM-2 scale', () => {
    expect(levelFor('quality', { attempts: 1, avg_quality: 0 }, 0)).toBe(1);
    expect(levelFor('quality', { attempts: 1, avg_quality: 3 }, 0)).toBe(2);
    expect(levelFor('quality', { attempts: 1, avg_quality: 4 }, 0)).toBe(3);
    expect(levelFor('quality', { attempts: 1, avg_quality: '5.00' }, 0)).toBe(4);
  });
});

describe('streaks', () => {
  const set = (...keys) => new Set(keys);
  it('does not break the current streak before today ends', () => {
    expect(computeStreaks(set('2026-09-15', '2026-09-16'), '2026-09-17')).toEqual({ current: 2, longest: 2 });
    expect(computeStreaks(set('2026-09-15', '2026-09-16', '2026-09-17'), '2026-09-17')).toEqual({ current: 3, longest: 3 });
  });
  it('resets on gaps and counts across months', () => {
    const keys = set('2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02', '2026-09-10', '2026-09-17');
    expect(computeStreaks(keys, '2026-09-17')).toEqual({ current: 1, longest: 4 });
    expect(computeStreaks(set('2026-09-14'), '2026-09-17')).toEqual({ current: 0, longest: 1 });
    expect(computeStreaks(set(), '2026-09-17')).toEqual({ current: 0, longest: 0 });
  });
});

describe('local aggregation', () => {
  it('groups by the viewer time zone', () => {
    const attempts = [
      { question_id: 'a', answered_at: '2026-09-16T23:30:00Z', is_correct: true, quality: 5 },
      { question_id: 'a', answered_at: '2026-09-17T01:00:00Z', is_correct: false, quality: 0 },
      { question_id: 'b', answered_at: '2026-09-17T02:00:00Z', is_correct: null, quality: 4 },
    ];
    expect(aggregateLocalAttempts(attempts, 'UTC')).toEqual([
      { day: '2026-09-16', attempts: 1, questions: 1, objective: 1, correct: 1, avg_quality: 5 },
      { day: '2026-09-17', attempts: 2, questions: 2, objective: 1, correct: 0, avg_quality: 2 },
    ]);
    const shanghai = aggregateLocalAttempts(attempts, 'Asia/Shanghai');
    expect(shanghai).toHaveLength(1);
    expect(shanghai[0]).toMatchObject({ day: '2026-09-17', attempts: 3, questions: 2, objective: 2, correct: 1, avg_quality: 3 });
    expect(dayKey('2026-09-16T23:30:00Z', 'America/Los_Angeles')).toBe('2026-09-16');
  });

  it('describes days with optional metrics', () => {
    expect(describeDay('2026-09-17', null)).toBe('2026-09-17 · 未刷题');
    expect(describeDay('2026-09-17', { attempts: 12, questions: 9, objective: 4, correct: 3, avg_quality: 4, ai_avg_score: 81.6, interviews: 1 }))
      .toBe('2026-09-17 · 12 次 · 9 题 · 正确率 75% · 平均评分 4.0 · AI 均分 82 · 模拟面试 1 场');
  });
});
