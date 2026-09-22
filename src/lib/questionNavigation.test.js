import { describe, expect, it } from 'vitest';
import { findQuestionByStableId, questionHref, stableQuestionId } from './questionNavigation';

const questions = [
  { id: '4F5C', legacyId: 'q-040', title: '虚调用' },
  { id: 'q-002', legacyId: 'q-002', title: 'GC' },
];

describe('question navigation', () => {
  it('resolves both database and legacy identifiers without keyword matching', () => {
    expect(findQuestionByStableId(questions, '4f5c')).toBe(questions[0]);
    expect(findQuestionByStableId(questions, 'Q-040')).toBe(questions[0]);
    expect(findQuestionByStableId(questions, 'missing')).toBeNull();
  });

  it('uses the database ID as the canonical link value', () => {
    expect(stableQuestionId(questions[0])).toBe('4F5C');
    expect(questionHref(questions[0])).toBe('/quiz?questionId=4F5C');
    expect(questionHref('q-002')).toBe('/quiz?questionId=q-002');
  });
});
