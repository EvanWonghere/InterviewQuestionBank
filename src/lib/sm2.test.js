import { describe, expect, it } from 'vitest';
import { nextSm2State } from './sm2';

describe('SM-2 schedule', () => {
  const now = new Date('2026-08-29T12:00:00.000Z');

  it('uses 1 and 6 days for the first two successful reviews', () => {
    const first = nextSm2State({}, 4, now);
    const second = nextSm2State(first, 4, now);
    expect(first.intervalDays).toBe(1);
    expect(second.intervalDays).toBe(6);
  });

  it('resets repetitions and records a lapse after failure', () => {
    const failed = nextSm2State({ repetitions: 4, intervalDays: 30, easeFactor: 2.5, lapseCount: 2 }, 0, now);
    expect(failed).toMatchObject({ repetitions: 0, intervalDays: 1, lapseCount: 3, lastQuality: 0 });
    expect(failed.dueAt).toBe('2026-08-30T12:00:00.000Z');
  });

  it('never reduces ease below 1.3', () => {
    let state = { easeFactor: 1.3 };
    for (let i = 0; i < 10; i += 1) state = nextSm2State(state, 0, now);
    expect(state.easeFactor).toBe(1.3);
  });
});
