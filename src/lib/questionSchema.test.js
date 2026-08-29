import { describe, expect, it } from 'vitest';
import { defaultQuestion, parseQuestion } from './questionSchema';

describe('question schema', () => {
  it.each(['short_answer', 'algorithm', 'engineering'])('accepts published %s with a reference answer', (type) => {
    expect(parseQuestion({ ...defaultQuestion(), categoryId: 'category', type, title: '题目', promptMd: '题干', status: 'published', solution: { referenceAnswerMd: '答案' } }).type).toBe(type);
  });

  it('requires valid choices', () => {
    expect(() => parseQuestion({ ...defaultQuestion(), categoryId: 'category', type: 'single_choice', title: '题目', promptMd: '题干', payload: { options: [{ id: 'a', text: 'A' }] }, solution: { correctOptionIds: [] } })).toThrow();
  });

  it('requires accepted values for every blank', () => {
    expect(() => parseQuestion({ ...defaultQuestion(), categoryId: 'category', type: 'fill_blank', title: '题目', promptMd: '题干', payload: { blanks: [{ id: 'b', label: '第一空' }] }, solution: { acceptedAnswers: {} } })).toThrow();
  });
});
