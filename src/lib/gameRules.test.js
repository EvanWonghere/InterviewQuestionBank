import { describe, expect, it } from 'vitest';
import {
  answerStars, answerXp, buildStages, chapterProgress, currentStars, levelFor, mergeBestStars, nextCombo, questionXp, totalXp,
} from './gameRules';

const q = (id, difficulty = 'medium', order = 0, extra = {}) => ({ id, categoryId: 'c', difficulty, order, status: 'published', ...extra });
const many = (n) => Array.from({ length: n }, (_, i) => q(`q${i}`, 'medium', i));

describe('buildStages', () => {
  it('splits into ceil(n / 6) balanced stages', () => {
    expect(buildStages(many(11), 'c').map((s) => s.questions.length)).toEqual([6, 5]);
    expect(buildStages(many(40), 'c').map((s) => s.questions.length)).toEqual([6, 6, 6, 6, 6, 5, 5]);
    expect(buildStages(many(19), 'c').map((s) => s.questions.length)).toEqual([5, 5, 5, 4]);
    expect(buildStages(many(6), 'c').map((s) => s.questions.length)).toEqual([6]);
    expect(buildStages([], 'c')).toEqual([]);
  });

  it('orders by difficulty, then order, and skips drafts and other categories', () => {
    const stages = buildStages([
      q('hard', 'hard', 0), q('easy2', 'easy', 2), q('easy1', 'easy', 1), q('mid', 'medium', 0),
      q('draft', 'easy', 0, { status: 'draft' }), q('other', 'easy', 0, { categoryId: 'x' }),
    ], 'c');
    expect(stages[0].questions.map((x) => x.id)).toEqual(['easy1', 'easy2', 'mid', 'hard']);
    expect(stages[0]).toMatchObject({ key: 'c:1', index: 1 });
  });
});

describe('stars', () => {
  it('maps one answer to stars', () => {
    expect(answerStars({ quality: 0 })).toBe(0);
    expect(answerStars({ quality: 3 })).toBe(1);
    expect(answerStars({ quality: 4, assisted: true })).toBe(1);
    expect(answerStars({ quality: 5 })).toBe(2);
  });

  it('derives current stars from SM-2 state, legacy ids and the latest attempt', () => {
    const question = q('uuid', 'easy', 0, { legacyId: 'old' });
    expect(currentStars(question, {}, [])).toBe(0);
    expect(currentStars(question, { old: { lastQuality: 0, repetitions: 0 } }, [])).toBe(0);
    expect(currentStars(question, { uuid: { lastQuality: 3, repetitions: 1 } }, [])).toBe(1);
    expect(currentStars(question, { uuid: { lastQuality: 4, repetitions: 1 } }, [])).toBe(2);
    expect(currentStars(question, { uuid: { lastQuality: 5, repetitions: 2 } }, [])).toBe(3);
    const assisted = [{ question_id: 'old', quality: 5, assistance_used: true }, { question_id: 'old', quality: 5, assistance_used: false }];
    expect(currentStars(question, { uuid: { lastQuality: 5, repetitions: 2 } }, assisted)).toBe(1);
  });

  it('lights the third star only when the passing streak spans two days', () => {
    const question = q('a');
    const state = { a: { lastQuality: 5, repetitions: 2 } };
    const at = (day, quality = 5) => ({ question_id: 'a', quality, answered_at: `2026-09-${day}T04:00:00Z` });
    expect(currentStars(question, state, [at(26), at(26)])).toBe(2);
    expect(currentStars(question, state, [at(26), at(25)])).toBe(3);
    // a lapse before today's two passes does not count as the earlier day
    expect(currentStars(question, state, [at(26), at(26), at(20, 0)])).toBe(2);
    // older passes fell out of the 500-attempt window: trust SM-2
    expect(currentStars(question, { a: { lastQuality: 5, repetitions: 3 } }, [at(26), at(26)])).toBe(3);
  });
});

describe('xp and levels', () => {
  it('never takes XP away after a lapse and pays 5 XP per lapse', () => {
    const question = q('a', 'hard');
    const questions = [question];
    const lapsed = { a: { lastQuality: 0, repetitions: 0, lapseCount: 1 } };
    const best = mergeBestStars(questions, lapsed, [], { a: 3 });
    expect(best.a).toBe(3);
    expect(questionXp(question, 3, 1)).toBe(Math.round(35 * 2.5) + 5);
    expect(totalXp(questions, lapsed, best, 12)).toBe(88 + 5 + 12);
  });

  it('adds the combo bonus only to two-star answers, capped at +50%', () => {
    const question = q('a', 'medium');
    expect(answerXp(question, 2, 1)).toEqual({ xp: 20, bonus: 0 });
    expect(answerXp(question, 2, 3)).toEqual({ xp: 20, bonus: 4 });
    expect(answerXp(question, 2, 20)).toEqual({ xp: 20, bonus: 10 });
    expect(answerXp(question, 1, 5)).toEqual({ xp: 12, bonus: 0 });
    expect(answerXp(question, 0, 5)).toEqual({ xp: 5, bonus: 0 });
  });

  it('keeps or resets the combo', () => {
    expect(nextCombo(2, { stars: 2 })).toBe(3);
    expect(nextCombo(2, { stars: 1, assisted: true })).toBe(2);
    expect(nextCombo(2, { stars: 1, assisted: false })).toBe(0);
    expect(nextCombo(2, { stars: 0 })).toBe(0);
  });

  it('finds the level and progress', () => {
    expect(levelFor(0)).toMatchObject({ index: 0, name: '实习生', progress: 0 });
    expect(levelFor(600)).toMatchObject({ index: 1, name: '初级客户端', progress: 0.5 });
    expect(levelFor(20000)).toMatchObject({ name: '主程', next: null, progress: 1 });
  });
});

describe('chapterProgress', () => {
  const questions = many(11); // stages of 6 and 5

  it('unlocks the first stage only and counts no stars at the start', () => {
    const chapter = chapterProgress(questions, 'c', { records: {}, reviewStates: {}, attempts: [] });
    expect(chapter.stages.map((s) => s.unlocked)).toEqual([true, false]);
    expect(chapter).toMatchObject({ currentIndex: 1, stars: 0, maxStars: 6, bossReady: false });
  });

  it('uses run records for stage stars and lights the third star from reviews', () => {
    const reviewStates = Object.fromEntries(questions.slice(0, 6).map((x) => [x.id, { lastQuality: 5, repetitions: 2 }]));
    const chapter = chapterProgress(questions, 'c', { records: { 'c:1': { cleared: true, flawless: false } }, reviewStates, attempts: [] });
    expect(chapter.stages[0]).toMatchObject({ cleared: true, stars: 3 });
    expect(chapter.stages[1]).toMatchObject({ unlocked: true, cleared: false });
    expect(chapter.currentIndex).toBe(2);
  });

  it('treats a never-run stage as cleared once every question is at two stars', () => {
    const reviewStates = Object.fromEntries(questions.slice(0, 6).map((x) => [x.id, { lastQuality: 4, repetitions: 1 }]));
    const chapter = chapterProgress(questions, 'c', { records: {}, reviewStates, attempts: [] });
    expect(chapter.stages[0]).toMatchObject({ cleared: true, stars: 1 });
    expect(chapter.stages[1].unlocked).toBe(true);
  });

  it('gives two stage stars for a flawless clear and marks the boss ready', () => {
    const records = { 'c:1': { cleared: true, flawless: true }, 'c:2': { cleared: true, flawless: true } };
    const chapter = chapterProgress(questions, 'c', { records, reviewStates: {}, attempts: [] });
    expect(chapter.stages.map((s) => s.stars)).toEqual([2, 2]);
    expect(chapter).toMatchObject({ currentIndex: null, bossReady: true });
  });
});
