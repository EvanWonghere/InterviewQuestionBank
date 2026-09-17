import { describe, it, expect } from 'vitest';
import { followUpScore, parseGeneratedQuestion, validateDraftInput } from '../../supabase/functions/ai-tutor/questionDraft.js';
import { parseEvaluation } from '../../supabase/functions/ai-tutor/evaluation.js';
import { buildQuestionDraftMessages } from '../../supabase/functions/ai-tutor/evaluationPrompts.js';
import { parseQuestion } from './questionSchema';

const categoryId = 'cat';
const base = { title: '观察者模式的退订', promptMd: '题干', difficulty: 'hard', tags: ['设计模式', '设计模式', ' C# '] };
const sol = { referenceAnswerMd: '参考', rubricMd: '- 要点', explanationMd: '解析' };
const valid = (q) => parseQuestion({ ...q, categoryId, status: 'draft', visibility: 'private', originEvaluationId: '00000000-0000-4000-8000-000000000001' });

describe('parseGeneratedQuestion', () => {
  it('remaps option ids and keeps single choice to exactly one answer', () => {
    const q = parseGeneratedQuestion(JSON.stringify({ ...base, type: 'single_choice', payload: { options: [{ id: 'x', text: 'A' }, { id: 'y', text: 'B' }, { id: 'z', text: '' }] }, solution: { correctOptionIds: ['y'], ...sol } }));
    expect(q.payload.options).toEqual([{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }]);
    expect(q.solution.correctOptionIds).toEqual(['b']);
    expect(q.tags).toEqual(['设计模式', 'C#']);
    expect(() => valid(q)).not.toThrow();
    expect(() => parseGeneratedQuestion(JSON.stringify({ ...base, type: 'single_choice', payload: { options: [{ id: 'x', text: 'A' }, { id: 'y', text: 'B' }] }, solution: { correctOptionIds: ['x', 'y'] } }))).toThrow('evaluation_parse');
  });

  it('requires at least two answers for multiple choice', () => {
    const payload = { options: [{ id: '1', text: 'A' }, { id: '2', text: 'B' }, { id: '3', text: 'C' }] };
    const q = parseGeneratedQuestion(JSON.stringify({ ...base, type: 'multiple_choice', payload, solution: { correctOptionIds: ['1', '3'] } }));
    expect(q.solution.correctOptionIds).toEqual(['a', 'c']);
    expect(() => valid(q)).not.toThrow();
    expect(() => parseGeneratedQuestion(JSON.stringify({ ...base, type: 'multiple_choice', payload, solution: { correctOptionIds: ['1'] } }))).toThrow('evaluation_parse');
  });

  it('normalizes fill-in blanks and their accepted answers', () => {
    const q = parseGeneratedQuestion(JSON.stringify({ ...base, type: 'fill_blank', payload: { blanks: [{ id: 'k', label: '填空1' }] }, solution: { acceptedAnswers: { k: ['OnDisable', ' '] }, caseSensitive: true } }));
    expect(q.payload.blanks).toEqual([{ id: 'b1', label: '填空1' }]);
    expect(q.solution.acceptedAnswers).toEqual({ b1: ['OnDisable'] });
    expect(q.solution.caseSensitive).toBe(true);
    expect(() => valid(q)).not.toThrow();
    expect(() => parseGeneratedQuestion(JSON.stringify({ ...base, type: 'fill_blank', payload: { blanks: [{ id: 'k', label: 'x' }] }, solution: {} }))).toThrow('evaluation_parse');
  });

  it('keeps code implementation details and requires a reference for subjective types', () => {
    const q = parseGeneratedQuestion(JSON.stringify({ ...base, type: 'algorithm', payload: { language: 'C#', starterCode: 'class Subject {}' }, solution: sol }));
    expect(q.payload).toEqual({ language: 'C#', starterCode: 'class Subject {}' });
    expect(() => valid({ ...q, status: 'published' })).not.toThrow();
    expect(() => parseGeneratedQuestion(JSON.stringify({ ...base, type: 'engineering', solution: {} }))).toThrow('evaluation_parse');
  });

  it('honours the requested type and falls back for unknown auto types', () => {
    expect(parseGeneratedQuestion(JSON.stringify({ ...base, type: 'single_choice', solution: sol }), { requestedType: 'short_answer' }).type).toBe('short_answer');
    expect(parseGeneratedQuestion(JSON.stringify({ ...base, type: 'essay', solution: sol })).type).toBe('short_answer');
    expect(() => parseGeneratedQuestion(JSON.stringify({ promptMd: 'x', solution: sol }))).toThrow('evaluation_parse');
  });
});

describe('follow-up scoring', () => {
  it('records the follow-up answer score only for follow-up rounds', () => {
    const raw = JSON.stringify({ score: 80, followUpAnswerScore: 45 });
    expect(parseEvaluation(raw, { isFollowUp: true }).followUpAnswerScore).toBe(45);
    expect(parseEvaluation(raw).followUpAnswerScore).toBeNull();
    expect(parseEvaluation(JSON.stringify({ score: 80, followUpAnswerScore: null }), { isFollowUp: true }).followUpAnswerScore).toBeNull();
    expect(followUpScore({ score: 80, result: { followUpAnswerScore: 45 } })).toBe(45);
    expect(followUpScore({ score: 80, result: {} })).toBe(80);
  });
  it('validates draft requests and puts json in the prompt', () => {
    expect(() => validateDraftInput({ evaluationId: 'nope', type: 'auto' })).toThrow('无效追问');
    expect(() => validateDraftInput({ evaluationId: '00000000-0000-4000-8000-000000000001', type: 'essay' })).toThrow('无效题型');
    const messages = buildQuestionDraftMessages({ source: {}, followUp: '用 C# 实现', answer: '', evaluation: {}, requestedType: 'algorithm' });
    expect(messages[0].content).toContain('json');
    expect(messages[1].content).toContain('"requestedType":"algorithm"');
  });
});

describe('weakness question sets', () => {
  const single = { title: '单选', promptMd: 'p', type: 'single_choice', payload: { options: [{ id: '1', text: 'A' }, { id: '2', text: 'B' }] }, solution: { correctOptionIds: ['2'] } };
  const shortAnswer = { title: '简答', promptMd: 'p', type: 'short_answer', solution: { referenceAnswerMd: 'r' } };
  it('keeps valid items, drops malformed ones and applies per-item types', async () => {
    const { parseGeneratedQuestionSet } = await import('../../supabase/functions/ai-tutor/questionDraft.js');
    const raw = JSON.stringify({ questions: [single, { title: 'bad' }, shortAnswer, shortAnswer] });
    const auto = parseGeneratedQuestionSet(raw, { count: 3 });
    expect(auto.map((q) => q.type)).toEqual(['single_choice', 'short_answer']);
    const typed = parseGeneratedQuestionSet(JSON.stringify({ questions: [single, shortAnswer] }), { count: 2, types: ['single_choice', 'engineering'] });
    expect(typed.map((q) => q.type)).toEqual(['single_choice', 'engineering']);
    expect(() => parseGeneratedQuestionSet(JSON.stringify({ questions: [{ title: 'bad' }] }), { count: 1 })).toThrow('evaluation_parse');
    expect(() => parseGeneratedQuestionSet(JSON.stringify(single), { count: 1 })).toThrow('evaluation_parse');
  });
  it('validates tag, count and type list', async () => {
    const { validateWeaknessDraftInput } = await import('../../supabase/functions/ai-tutor/questionDraft.js');
    expect(() => validateWeaknessDraftInput({ tag: '事件退订', count: 2, types: 'auto' })).not.toThrow();
    expect(() => validateWeaknessDraftInput({ tag: '事件退订', count: 2, types: ['single_choice', 'algorithm'] })).not.toThrow();
    expect(() => validateWeaknessDraftInput({ tag: ' ', count: 1, types: 'auto' })).toThrow('无效薄弱点');
    expect(() => validateWeaknessDraftInput({ tag: 'x', count: 4, types: 'auto' })).toThrow('无效题目数量');
    expect(() => validateWeaknessDraftInput({ tag: 'x', count: 2, types: ['single_choice'] })).toThrow('无效题型');
  });
  it('accepts weakness provenance in the question schema', () => {
    expect(() => parseQuestion({ ...shortAnswer, promptMd: 'p', categoryId, difficulty: 'medium', originKind: 'weakness', originWeaknessTag: '事件退订' })).not.toThrow();
    expect(() => parseQuestion({ ...shortAnswer, categoryId, difficulty: 'medium', originKind: 'other' })).toThrow();
  });
});
