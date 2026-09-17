import { describe, it, expect } from 'vitest';
import {
  aggregateWeaknesses, constrainRating, extractJson, parseEvaluation, parseInterviewReport, parseWeaknessReport, validateEvaluateInput, MAX_ROUNDS,
} from '../../supabase/functions/ai-tutor/evaluation.js';
import { buildEvaluationMessages, buildInterviewReportMessages, buildWeaknessReportMessages } from '../../supabase/functions/ai-tutor/evaluationPrompts.js';

const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const full = {
  score: 72, verdict: '思路正确但遗漏边界', suggestedRating: 'hard',
  dimensions: [{ name: '正确性', score: 4, comment: '主体正确' }, { name: '', score: 3 }],
  strengths: ['说明了复杂度'],
  weaknesses: [
    { tag: '边界条件', point: '没有处理空数组', errorReason: 'boundary_case', severity: 'high' },
    { tag: '术语', point: '混淆了协程和线程', errorReason: 'made_up', severity: 'extreme' },
    { tag: '', point: '无标签' },
  ],
  followUp: { question: '输入为空时会发生什么？', targets: '边界条件' },
  summaryMd: '**总体不错**',
};

describe('extractJson / parseEvaluation', () => {
  it('accepts fenced JSON with surrounding prose', () => {
    const parsed = parseEvaluation(`好的，评估如下：\n\`\`\`json\n${JSON.stringify(full)}\n\`\`\`\n以上。`);
    expect(parsed.score).toBe(72);
    expect(parsed.suggestedRating).toBe('hard');
    expect(parsed.dimensions).toEqual([{ name: '正确性', score: 4, comment: '主体正确' }]);
    expect(parsed.weaknesses).toEqual([
      { tag: '边界条件', point: '没有处理空数组', errorReason: 'boundary_case', severity: 'high' },
      { tag: '术语', point: '混淆了协程和线程', errorReason: null, severity: 'mid' },
    ]);
    expect(parsed.followUp).toEqual({ question: '输入为空时会发生什么？', targets: '边界条件' });
  });

  it('rejects non-JSON and missing scores', () => {
    expect(() => extractJson('抱歉，我无法评估')).toThrow('evaluation_parse');
    expect(() => extractJson('{not json}')).toThrow('evaluation_parse');
    expect(() => parseEvaluation(JSON.stringify({ verdict: 'x' }))).toThrow('evaluation_parse');
  });

  it('clamps values, derives missing ratings and truncates text', () => {
    const parsed = parseEvaluation(JSON.stringify({ score: 140.4, verdict: 'x'.repeat(500), dimensions: [{ name: 'a', score: 9 }], weaknesses: 'bad', strengths: [1, 'ok'] }));
    expect(parsed.score).toBe(100);
    expect(parsed.verdict).toHaveLength(200);
    expect(parsed.dimensions[0].score).toBe(5);
    expect(parsed.weaknesses).toEqual([]);
    expect(parsed.strengths).toEqual(['ok']);
    expect(parsed.suggestedRating).toBe('easy');
    expect(parseEvaluation('{"score": 30}').suggestedRating).toBe('again');
  });

  it('drops follow-ups at the round limit and respects objective grading', () => {
    expect(parseEvaluation(JSON.stringify(full), { allowFollowUp: false }).followUp).toBeNull();
    expect(parseEvaluation(JSON.stringify({ ...full, suggestedRating: 'easy' }), { correct: false }).suggestedRating).toBe('again');
    expect(parseEvaluation(JSON.stringify({ ...full, suggestedRating: 'again' }), { correct: true }).suggestedRating).toBe('hard');
  });
});

describe('constrainRating', () => {
  it.each([
    ['easy', false, 'again'], ['again', true, 'hard'], ['good', true, 'good'], ['again', null, 'again'], ['weird', null, 'good'],
  ])('%s with correct=%s → %s', (rating, correct, expected) => expect(constrainRating(rating, correct)).toBe(expected));
});

describe('validateEvaluateInput', () => {
  const base = { questionId: id(1), requestId: id(2), mode: 'practice', submission: { answerMd: 'x' } };
  it('accepts initial and follow-up requests', () => {
    expect(() => validateEvaluateInput(base)).not.toThrow();
    expect(() => validateEvaluateInput({ ...base, parentId: id(3), answerMd: '因为…' })).not.toThrow();
    expect(() => validateEvaluateInput({ ...base, mode: 'interview', sessionId: id(4) })).not.toThrow();
  });
  it.each([
    [{ ...base, requestId: 'nope' }, '无效题目'],
    [{ ...base, mode: 'exam' }, '无效评估模式'],
    [{ ...base, mode: 'interview' }, '场次'],
    [{ ...base, parentId: id(3), answerMd: ' ' }, '追问回答'],
    [{ ...base, submission: { answerMd: 'x'.repeat(20001) } }, '作答过长'],
  ])('rejects invalid input %#', (input, message) => expect(() => validateEvaluateInput(input)).toThrow(message));
});

describe('evaluation prompts', () => {
  const question = { title: '协程', type: 'short_answer', prompt_md: '解释协程', payload: {} };
  it('carries reference, objective result and the chain; limits follow-ups by round', () => {
    const chain = [
      { round: 1, submission: { answerMd: '初答' }, score: 60, result: { verdict: '一般', weaknesses: [{ tag: 'a' }] } },
      { round: 2, follow_up_question: '追问一', submission: { answerMd: '二答' }, score: 70, result: { verdict: '好些' } },
    ];
    const messages = buildEvaluationMessages({ question, solution: { referenceAnswerMd: '参考' }, correct: true, mode: 'interview', chain, current: { followUpQuestion: '追问二', answer: { answerMd: '三答' } } });
    expect(messages).toHaveLength(2);
    expect(messages[0].content).toContain('不得透露参考答案');
    const material = JSON.parse(messages[1].content.slice(messages[1].content.indexOf('\n') + 1));
    expect(material).toMatchObject({ mode: 'interview', allowFollowUp: false, objectiveCorrect: true, reference: { referenceAnswerMd: '参考' } });
    expect(material.rounds.map((r) => [r.round, r.followUp, r.answer.answerMd])).toEqual([[1, undefined, '初答'], [2, '追问一', '二答'], [3, '追问二', '三答']]);
    expect(material.rounds[0].evaluation).toEqual({ score: 60, verdict: '一般', weaknesses: [{ tag: 'a' }] });
    const first = buildEvaluationMessages({ question, solution: null, correct: null, mode: 'practice', chain: [], current: { answer: {} } });
    expect(JSON.parse(first[1].content.slice(first[1].content.indexOf('\n') + 1))).not.toHaveProperty('objectiveCorrect');
    expect(MAX_ROUNDS.practice).toBe(4);
  });

  it.each(['single_choice', 'multiple_choice', 'fill_blank', 'short_answer', 'algorithm', 'engineering'])('builds context for %s', (type) => {
    const messages = buildEvaluationMessages({ question: { ...question, type }, solution: {}, correct: null, mode: 'practice', chain: [], current: { answer: { answerMd: 'x' } } });
    expect(messages[1].content).toContain(`"type":"${type}"`);
  });

  it('bounds context size', () => {
    expect(() => buildEvaluationMessages({ question, solution: { referenceAnswerMd: 'x'.repeat(41000) }, mode: 'practice', chain: [], current: { answer: {} } })).toThrow('过长');
    expect(() => buildInterviewReportMessages([{ title: 'x'.repeat(41000) }])).toThrow('过长');
    expect(buildWeaknessReportMessages({ weaknesses: [], candidates: [] })[0].content).toContain('candidates');
  });
});

describe('reports', () => {
  it('filters interview report question ids to the session', () => {
    const report = parseInterviewReport(JSON.stringify({ overallScore: 77, summaryMd: 'ok', weaknesses: [{ tag: 'GC', detail: 'd', questionIds: [id(1), 'hacked', id(1)] }], studyPlan: ['练习'] }), [id(1)]);
    expect(report.weaknesses[0].questionIds).toEqual([id(1)]);
    expect(report.overallScore).toBe(77);
    expect(() => parseInterviewReport('{"summaryMd":"x"}', [])).toThrow('evaluation_parse');
  });
  it('filters weakness report ids to candidates', () => {
    const report = parseWeaknessReport(JSON.stringify({ summaryMd: '总结', focusAreas: [{ tag: '边界', diagnosis: 'd', drills: ['a'], questionIds: [id(2), id(9)] }] }), [id(2)]);
    expect(report.focusAreas[0]).toEqual({ tag: '边界', diagnosis: 'd', drills: ['a'], questionIds: [id(2)] });
    expect(() => parseWeaknessReport('{"focusAreas":[]}', [])).toThrow('evaluation_parse');
  });
});

describe('aggregateWeaknesses', () => {
  const e = (questionId, score, tags, createdAt, status = 'complete') => ({
    question_id: questionId, score, status, created_at: createdAt,
    result: { weaknesses: tags.map((tag) => ({ tag, point: `${tag}@${questionId}` })) },
  });
  it('counts each question once per tag, keeps the lowest score and sorts', () => {
    const result = aggregateWeaknesses([
      e('q1', 60, ['边界条件'], '2026-09-03'),
      e('q1', 40, ['边界条件 '], '2026-09-02'),
      e('q2', 80, ['边界条件', 'GC'], '2026-09-01'),
      e('q3', 30, ['gc'], '2026-09-04'),
      e('q4', 10, ['忽略'], '2026-09-05', 'failed'),
    ]);
    expect(result.map((w) => [w.tag, w.count, w.avgScore])).toEqual([['GC', 2, 55], ['边界条件', 2, 60]]);
    expect(result[1].questionIds).toEqual(['q1', 'q2']);
    expect(result[0].lastSeen).toBe('2026-09-04');
    expect(result[1].points).toEqual(['边界条件@q1', '边界条件 @q1', '边界条件@q2']);
  });
});
