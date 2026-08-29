import { describe, expect, it } from 'vitest';
import { gradeObjective, normalizeFill } from './grading';

describe('objective grading', () => {
  it('grades single choice exactly', () => {
    const question = { type: 'single_choice', solution: { correctOptionIds: ['b'] } };
    expect(gradeObjective(question, { optionId: 'b' })).toBe(true);
    expect(gradeObjective(question, { optionId: 'a' })).toBe(false);
  });

  it('grades multiple choice without depending on order', () => {
    const question = { type: 'multiple_choice', solution: { correctOptionIds: ['a', 'c'] } };
    expect(gradeObjective(question, { optionIds: ['c', 'a'] })).toBe(true);
    expect(gradeObjective(question, { optionIds: ['a'] })).toBe(false);
  });

  it('normalizes fill answers without fuzzy matching', () => {
    const question = {
      type: 'fill_blank',
      payload: { blanks: [{ id: 'one', label: '答案' }] },
      solution: { caseSensitive: false, acceptedAnswers: { one: ['Hello World', '你好'] } },
    };
    expect(normalizeFill('  HELLO   WORLD ')).toBe('hello world');
    expect(gradeObjective(question, { answers: { one: ' hello  world ' } })).toBe(true);
    expect(gradeObjective(question, { answers: { one: 'hello worlds' } })).toBe(false);
  });
});
