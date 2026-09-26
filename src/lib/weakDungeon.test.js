import { describe, expect, it } from 'vitest';
import { pickDungeon, weakTagWeights } from './weakDungeon';

const q = (id, tags, overrides = {}) => ({
  id, title: id, categoryId: 'c', difficulty: 'easy', order: overrides.order ?? 0, status: 'published', tags, ...overrides,
});

describe('weakTagWeights', () => {
  it('sums lapse counts per tag', () => {
    const questions = [q('q1', ['closures']), q('q2', ['closures', 'scope'])];
    const reviewStates = { q1: { lapseCount: 2 }, q2: { lapseCount: 1 } };
    const weights = weakTagWeights(questions, reviewStates);
    expect(weights.get('closures')).toBe(3);
    expect(weights.get('scope')).toBe(1);
  });

  it('lets evaluation weaknesses outweigh a single lapse', () => {
    const questions = [q('q1', ['closures'])];
    const reviewStates = { q1: { lapseCount: 1 } };
    const weights = weakTagWeights(questions, reviewStates, [{ tag: 'promises', count: 3 }]);
    expect(weights.get('closures')).toBe(1);
    expect(weights.get('promises')).toBe(6);
  });

  it('ignores questions without lapses', () => {
    const questions = [q('q1', ['closures'])];
    const weights = weakTagWeights(questions, {});
    expect(weights.size).toBe(0);
  });
});

describe('pickDungeon', () => {
  it('picks the heaviest tag with at least 3 published questions', () => {
    const questions = [
      q('q1', ['closures']), q('q2', ['closures']), q('q3', ['closures']),
      q('q4', ['scope']), q('q5', ['scope']),
    ];
    const reviewStates = {
      q1: { lapseCount: 1 }, q2: { lapseCount: 1 }, q3: { lapseCount: 1 },
      q4: { lapseCount: 5 }, q5: { lapseCount: 5 },
    };
    // scope has a higher weight (10 vs 3) but only 2 questions, so it is skipped.
    const result = pickDungeon(questions, { reviewStates });
    expect(result.tag).toBe('closures');
    expect(result.questions.map((it) => it.id).sort()).toEqual(['q1', 'q2', 'q3']);
  });

  it('excludes drafts from the tag count and the run', () => {
    const questions = [
      q('q1', ['closures']), q('q2', ['closures']), q('q3', ['closures'], { status: 'draft' }),
    ];
    const reviewStates = { q1: { lapseCount: 1 }, q2: { lapseCount: 1 }, q3: { lapseCount: 1 } };
    expect(pickDungeon(questions, { reviewStates })).toBeNull();
  });

  it('returns null when nothing is weak', () => {
    const questions = [q('q1', ['closures']), q('q2', ['closures']), q('q3', ['closures'])];
    expect(pickDungeon(questions, { reviewStates: {} })).toBeNull();
  });

  it('orders questions weakest-first: lowest current stars, then most lapses, then order', () => {
    const questions = [
      q('q1', ['closures'], { order: 1 }),
      q('q2', ['closures'], { order: 2 }),
      q('q3', ['closures'], { order: 3 }),
    ];
    const reviewStates = {
      // q1: 2 stars (lastQuality 4), q2: 0 stars (never passed), q3: 0 stars but more lapses.
      q1: { lastQuality: 4, repetitions: 1, lapseCount: 1 },
      q2: { lapseCount: 1 },
      q3: { lapseCount: 4 },
    };
    const result = pickDungeon(questions, { reviewStates, size: 5 });
    expect(result.questions.map((it) => it.id)).toEqual(['q3', 'q2', 'q1']);
  });

  it('caps the run at `size`', () => {
    const questions = Array.from({ length: 6 }, (_, i) => q(`q${i}`, ['closures'], { order: i }));
    const reviewStates = Object.fromEntries(questions.map((it) => [it.id, { lapseCount: 1 }]));
    const result = pickDungeon(questions, { reviewStates, size: 5 });
    expect(result.questions).toHaveLength(5);
  });
});
