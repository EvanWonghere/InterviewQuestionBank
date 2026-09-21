import { describe, it, expect, vi } from 'vitest';
import { handleEvaluate, handleInterviewReport, handleWeaknessReport } from '../../supabase/functions/ai-tutor/evaluate.ts';

const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const json = (data, status = 200) => ({ status, data });
const must = (r) => { if (r.error) throw new Error(r.error.message); return r.data; };

/** Minimal PostgREST-like fake: each table call resolves to tables[name](filters, op). */
function fakeDb(handlers) {
  const calls = [];
  const builder = (table) => {
    const q = { table, op: 'select', filters: [], payload: null };
    const chain = new Proxy({}, {
      get(_, key) {
        if (key === 'then') {
          calls.push(q);
          return (resolve, reject) => Promise.resolve().then(() => handlers[table](q)).then(resolve, reject);
        }
        return (...args) => {
          if (key === 'update' || key === 'insert') { q.op = key; q.payload = args[0]; }
          else if (key !== 'select' || q.op === 'select') q.filters.push([key, ...args]);
          return chain;
        };
      },
    });
    return chain;
  };
  return { calls, from: builder, rpc: vi.fn() };
}

const question = { id: id(1), title: '协程', prompt_md: 'p', type: 'short_answer', payload: {}, updated_at: 'v1' };

function setup({ modelReply, begin, chain = [], updateMatched = true }) {
  const db = fakeDb({
    questions: () => ({ data: question, error: null }),
    question_solutions: () => ({ data: { solution: { referenceAnswerMd: 'ref' } }, error: null }),
    ai_evaluations: (q) => {
      if (q.op === 'update') return { data: updateMatched && q.filters.some(([k, , v]) => k === 'eq' && v === 'running') ? [{ ...begin.evaluation, ...q.payload }] : [], error: null };
      return { data: chain, error: null };
    },
  });
  db.rpc.mockResolvedValue({ data: begin, error: null });
  const client = { rpc: vi.fn().mockResolvedValue({ data: { correct: null }, error: null }) };
  const callModel = vi.fn(async () => modelReply);
  return { db, client, callModel, ctx: { uid: 'u', client, db, model: 'm', json, must, callModel } };
}

const running = (extra = {}) => ({ duplicate: false, evaluation: { id: 'e1', round: 1, mode: 'practice', is_correct: null, root_id: null, follow_up_question: null, status: 'running', ...extra } });

describe('handleEvaluate', () => {
  it('grades with the user client, evaluates and stores the parsed result', async () => {
    const { ctx, db, client, callModel } = setup({ begin: running(), modelReply: JSON.stringify({ score: 81, suggestedRating: 'good', weaknesses: [{ tag: 'GC', point: 'p' }], followUp: { question: 'q?' } }) });
    const res = await handleEvaluate({ questionId: id(1), requestId: id(2), mode: 'practice', submission: { answerMd: 'a' } }, ctx);
    expect(res.status).toBe(200);
    expect(client.rpc).toHaveBeenCalledWith('grade_question', { p_question_id: id(1), p_submission: { answerMd: 'a' } });
    expect(db.rpc).toHaveBeenCalledWith('ai_begin_evaluation', expect.objectContaining({ p_user: 'u', p_parent: null, p_correct: null, p_model: 'm' }));
    const messages = callModel.mock.calls[0][0];
    expect(messages[1].content).toContain('"reference":{"referenceAnswerMd":"ref"}');
    const update = db.calls.find((c) => c.op === 'update');
    expect(update.payload).toMatchObject({ status: 'complete', score: 81, suggested_rating: 'good', weakness_tags: ['GC'] });
    expect(res.data.evaluation.result.followUp.question).toBe('q?');
  });

  it('returns a stored result for a duplicate request without calling the model', async () => {
    const { ctx, callModel } = setup({ begin: { duplicate: true, evaluation: { id: 'e1', status: 'complete', score: 70 } } });
    const res = await handleEvaluate({ questionId: id(1), requestId: id(2), mode: 'practice', submission: {} }, ctx);
    expect(res).toEqual({ status: 200, data: { evaluation: { id: 'e1', status: 'complete', score: 70 } } });
    expect(callModel).not.toHaveBeenCalled();
  });

  it('marks the row failed and hides upstream details on unparsable output', async () => {
    const { ctx, db } = setup({ begin: running(), modelReply: 'I cannot comply' });
    const res = await handleEvaluate({ questionId: id(1), requestId: id(2), mode: 'practice', submission: {} }, ctx);
    expect(res.status).toBe(502);
    expect(res.data.error).toContain('有效的评估格式');
    expect(res.data.settled).toBe(true);
    expect(db.calls.find((c) => c.op === 'update').payload).toEqual({ status: 'failed' });
  });

  it.each([['running', false], ['failed', true]])('does not generate again for duplicate %s requests', async (status, settled) => {
    const { ctx, callModel } = setup({ begin: { duplicate: true, evaluation: { id: 'e1', status } } });
    const res = await handleEvaluate({ questionId: id(1), requestId: id(2), mode: 'practice', submission: {} }, ctx);
    expect(res).toMatchObject({ status: 409, data: { settled } });
    expect(callModel).not.toHaveBeenCalled();
  });

  it('does not declare a terminal failure when no running row was changed', async () => {
    const { ctx } = setup({ begin: running(), modelReply: 'invalid JSON', updateMatched: false });
    const res = await handleEvaluate({ questionId: id(1), requestId: id(2), mode: 'practice', submission: {} }, ctx);
    expect(res.data.settled).toBe(false);
  });

  it('skips grading for follow-ups, loads the chain and blocks follow-ups at the limit', async () => {
    const chain = [{ round: 1, submission: { answerMd: 'a' }, score: 50, result: { verdict: 'v' } }, { round: 2, follow_up_question: 'f1', submission: { answerMd: 'b' }, score: 60, result: {} }];
    const { ctx, client, callModel, db } = setup({
      begin: running({ round: 3, mode: 'interview', root_id: 'e0', follow_up_question: 'f2', is_correct: false }),
      chain,
      modelReply: JSON.stringify({ score: 90, suggestedRating: 'easy', followUp: { question: 'more?' } }),
    });
    const res = await handleEvaluate({ questionId: id(1), requestId: id(3), mode: 'interview', parentId: id(4), answerMd: 'c' }, ctx);
    expect(client.rpc).not.toHaveBeenCalled();
    const material = JSON.parse(callModel.mock.calls[0][0][1].content.split('\n').slice(1).join('\n'));
    expect(material.rounds.map((r) => r.answer.answerMd)).toEqual(['a', 'b', 'c']);
    expect(material.rounds[2].followUp).toBe('f2');
    expect(material.allowFollowUp).toBe(false);
    const update = db.calls.find((c) => c.op === 'update');
    expect(update.payload.suggested_rating).toBe('again');
    expect(update.payload.result.followUp).toBeNull();
    expect(res.status).toBe(200);
  });

  it('rejects invalid input before any database call', async () => {
    const { ctx, db } = setup({ begin: running() });
    await expect(handleEvaluate({ questionId: 'x', requestId: id(2), mode: 'practice' }, ctx)).rejects.toThrow('无效');
    expect(db.calls).toHaveLength(0);
  });
});

describe('reports', () => {
  it('builds an interview report restricted to the session questions', async () => {
    const db = fakeDb({
      ai_evaluations: () => ({
        data: [
          { question_id: id(1), round: 1, score: 40, result: { verdict: 'v', weaknesses: [{ tag: '边界', point: '原题漏了空输入' }] } },
          {
            question_id: id(1), round: 2, score: 65,
            result: {
              followUpAnswerScore: 80,
              weaknesses: [
                { tag: '术语', point: '追问里混淆了协程和线程', origin: 'this_answer' },
                { tag: '边界', point: '原题仍未纠正：空输入', origin: 'unresolved' },
              ],
            },
          },
        ],
        error: null,
      }),
      questions: () => ({ data: [{ id: id(1), title: '协程', type: 'short_answer' }], error: null }),
      ai_reports: (q) => ({ data: q.op === 'update' ? [{ id: 'r1', ...q.payload }] : null, error: null }),
    });
    db.rpc.mockResolvedValue({ data: { duplicate: false, report: { id: 'r1', status: 'running' } }, error: null });
    const callModel = vi.fn(async () => JSON.stringify({ overallScore: 65, summaryMd: 's', weaknesses: [{ tag: 't', questionIds: [id(1), id(9)] }] }));
    const res = await handleInterviewReport({ action: 'interview-report', sessionId: id(5), requestId: id(6) }, { uid: 'u', db, model: 'm', json, must, callModel });
    expect(res.status).toBe(200);
    expect(res.data.report.result.weaknesses[0].questionIds).toEqual([id(1)]);
    expect(res.data.report.result.questionScores).toEqual([{ questionId: id(1), title: '协程', score: 65, rounds: 2 }]);
    // The leftover original-answer gap is listed once for the question, never as a second round's mistake.
    const material = JSON.parse(callModel.mock.calls[0][0][1].content.split('\n').slice(1).join('\n'));
    const [item] = material.questions;
    expect(item.rounds.map((r) => [r.kind, r.answerScore, r.weaknesses.map((w) => w.tag)])).toEqual([
      ['original', null, ['边界']],
      ['follow_up', 80, ['术语']],
    ]);
    expect(item.unresolved.map((w) => w.tag)).toEqual(['边界']);
  });

  it('recaps only the newest chain for the chat coach, split by round', async () => {
    const { latestEvaluationSummary } = await import('../../supabase/functions/ai-tutor/evaluate.ts');
    const db = fakeDb({
      ai_evaluations: () => ({
        data: [
          { id: id(3), root_id: id(2), round: 2, created_at: '2026-09-05', follow_up_question: '空输入呢？', submission: { answerMd: '返回空列表' }, score: 72, result: { followUpAnswerScore: 85, weaknesses: [{ tag: 'GC', point: '原题仍未纠正：没提析构', origin: 'unresolved' }] } },
          { id: id(2), root_id: null, round: 1, created_at: '2026-09-04', score: 50, result: { verdict: '一般', weaknesses: [{ tag: 'GC', point: '没提析构' }] } },
          { id: id(1), root_id: null, round: 1, created_at: '2026-09-01', score: 30, result: { weaknesses: [{ tag: '旧链', point: '不该出现' }] } },
        ],
        error: null,
      }),
    });
    const recap = await latestEvaluationSummary(db, 'u', id(9), must);
    expect(recap.finalScore).toBe(72);
    expect(recap.rounds.map((r) => [r.round, r.kind, r.answerScore])).toEqual([[1, 'original', null], [2, 'follow_up', 85]]);
    expect(recap.rounds[1].answer).toBe('返回空列表');
    expect(recap.unresolved.map((w) => w.tag)).toEqual(['GC']);
    // The follow-up round carries no this-round weakness, so nothing is attributed to it.
    expect(recap.rounds[1].weaknesses).toEqual([]);
    expect(JSON.stringify(recap)).not.toContain('旧链');
  });

  it('refuses reports without data before charging a request', async () => {
    const db = fakeDb({ ai_evaluations: () => ({ data: [], error: null }) });
    const res = await handleWeaknessReport({ action: 'weakness-report', requestId: id(6) }, { uid: 'u', db, model: 'm', json, must, callModel: vi.fn() });
    expect(res.status).toBe(400);
    expect(db.rpc).not.toHaveBeenCalled();
  });
});

describe('handleDraftQuestion', () => {
  const draftDb = (evaluation) => {
    const db = fakeDb({
      ai_evaluations: (q) => {
        const byId = q.filters.some(([k, field]) => k === 'eq' && field === 'id');
        if (byId) return { data: evaluation, error: null };
        return { data: [{ round: 1, follow_up_question: null }, { round: 2, follow_up_question: '订阅后何时重新绑定？' }], error: null };
      },
      questions: () => ({ data: { title: '事件订阅', type: 'short_answer', prompt_md: 'p', difficulty: 'medium', question_tags: [{ tags: { name: 'Unity' } }] }, error: null }),
      question_solutions: () => ({ data: { solution: { referenceAnswerMd: 'ref' } }, error: null }),
    });
    db.rpc.mockResolvedValue({ data: null, error: null });
    return db;
  };
  it('drafts from an answered follow-up without writing questions', async () => {
    const { handleDraftQuestion } = await import('../../supabase/functions/ai-tutor/evaluate.ts');
    const db = draftDb({
      id: id(7), question_id: id(1), round: 3, root_id: id(1), follow_up_question: '禁用时何时退订？',
      submission: { answerMd: '不知道' }, score: 60,
      result: {
        followUpAnswerScore: 30,
        weaknesses: [
          { tag: '退订', point: '追问没答 OnDisable', origin: 'this_answer' },
          { tag: 'GC', point: '原题仍未纠正：没提析构', origin: 'unresolved' },
        ],
      },
      status: 'complete',
    });
    const callModel = vi.fn(async () => JSON.stringify({ type: 'single_choice', title: 't', promptMd: 'p', payload: { options: [{ id: '1', text: 'OnDisable' }, { id: '2', text: 'Update' }] }, solution: { correctOptionIds: ['1'] } }));
    const res = await handleDraftQuestion({ evaluationId: id(7), type: 'auto' }, { uid: 'u', db, model: 'm', json, must, callModel });
    expect(res.status).toBe(200);
    expect(res.data.question).toMatchObject({ type: 'single_choice', originEvaluationId: id(7), sourceTitle: 'AI 追问 · 事件订阅' });
    expect(db.rpc).toHaveBeenCalledWith('ai_take_rate', { p_user: 'u' });
    const material = callModel.mock.calls[0][0][1].content;
    expect(material).toContain('禁用时何时退订？');
    expect(material).toContain('订阅后何时重新绑定？');
    expect(material).toContain('"score":30');
    expect(material).toContain('追问没答 OnDisable');
    expect(material).toContain('没提析构');
    expect(material).toContain('"origin":"unresolved"');
    expect(db.calls.some((c) => c.op !== 'select')).toBe(false);
  });
  it('rejects initial-answer rounds before charging', async () => {
    const { handleDraftQuestion } = await import('../../supabase/functions/ai-tutor/evaluate.ts');
    const db = draftDb({ id: id(7), round: 1, status: 'complete', follow_up_question: null });
    const callModel = vi.fn();
    const res = await handleDraftQuestion({ evaluationId: id(7), type: 'auto' }, { uid: 'u', db, model: 'm', json, must, callModel });
    expect(res.status).toBe(400);
    expect(db.rpc).not.toHaveBeenCalled();
    expect(callModel).not.toHaveBeenCalled();
  });
});

describe('handleWeaknessQuestions', () => {
  const evaluations = [
    { question_id: id(1), score: 40, status: 'complete', created_at: '2026-09-02', result: { weaknesses: [{ tag: '事件退订', point: '没有区分 OnDisable 与 OnDestroy' }] } },
    { question_id: id(2), score: 70, status: 'complete', created_at: '2026-09-01', result: { weaknesses: [{ tag: '事件退订', point: '忘记重新订阅' }] } },
  ];
  const setupDb = () => {
    const db = fakeDb({
      ai_evaluations: () => ({ data: evaluations, error: null }),
      questions: (q) => (q.filters.some(([k]) => k === 'in')
        ? { data: [{ id: id(1), title: '事件订阅与生命周期', type: 'short_answer', prompt_md: 'p', question_solutions: { solution: { referenceAnswerMd: 'ref' } } }], error: null }
        : { data: [{ title: '已出过的题' }], error: null }),
      tags: () => ({ data: [{ question_tags: [{ questions: { title: '带标签的题' } }] }], error: null }),
    });
    db.rpc.mockResolvedValue({ data: null, error: null });
    return db;
  };
  it('re-derives the weakness server-side, avoids existing titles and returns provenance', async () => {
    const { handleWeaknessQuestions } = await import('../../supabase/functions/ai-tutor/evaluate.ts');
    const db = setupDb();
    const reply = JSON.stringify({ questions: [
      { type: 'single_choice', title: '禁用时退订', promptMd: 'p', payload: { options: [{ id: 'a', text: 'OnDisable' }, { id: 'b', text: 'Update' }] }, solution: { correctOptionIds: ['a'] } },
      { type: 'algorithm', title: '实现安全订阅', promptMd: 'p', payload: { language: 'C#' }, solution: { referenceAnswerMd: 'code' } },
    ] });
    const callModel = vi.fn(async () => reply);
    const res = await handleWeaknessQuestions({ tag: ' 事件退订 ', count: 2, types: 'auto' }, { uid: 'u', db, model: 'm', json, must, callModel });
    expect(res.status).toBe(200);
    expect(res.data.questions).toHaveLength(2);
    expect(res.data.questions[1]).toMatchObject({ type: 'algorithm', originKind: 'weakness', originWeaknessTag: '事件退订', sourceTitle: 'AI 针对薄弱点 · 事件退订' });
    const material = JSON.parse(callModel.mock.calls[0][0][1].content.split('\n').slice(1).join('\n'));
    expect(material.weakness.points).toEqual(['没有区分 OnDisable 与 OnDestroy', '忘记重新订阅']);
    expect(material.existingTitles).toEqual(expect.arrayContaining(['已出过的题', '事件订阅与生命周期', '带标签的题']));
    expect(material.relatedQuestions[0].reference).toBe('ref');
    expect(callModel.mock.calls[0][1]).toEqual({ budgetScale: 2 });
    expect(db.rpc).toHaveBeenCalledWith('ai_take_rate', { p_user: 'u' });
    expect(db.calls.some((c) => c.op !== 'select')).toBe(false);
  });
  it('rejects unknown weaknesses before charging', async () => {
    const { handleWeaknessQuestions } = await import('../../supabase/functions/ai-tutor/evaluate.ts');
    const db = setupDb();
    const callModel = vi.fn();
    const res = await handleWeaknessQuestions({ tag: '不存在', count: 1, types: 'auto' }, { uid: 'u', db, model: 'm', json, must, callModel });
    expect(res.status).toBe(400);
    expect(db.rpc).not.toHaveBeenCalled();
    expect(callModel).not.toHaveBeenCalled();
  });
});
