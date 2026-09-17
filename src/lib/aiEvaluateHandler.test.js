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
      ai_evaluations: () => ({ data: [{ question_id: id(1), round: 1, score: 40, result: { verdict: 'v', weaknesses: [] } }, { question_id: id(1), round: 2, score: 65, result: {} }], error: null }),
      questions: () => ({ data: [{ id: id(1), title: '协程', type: 'short_answer' }], error: null }),
      ai_reports: (q) => ({ data: q.op === 'update' ? [{ id: 'r1', ...q.payload }] : null, error: null }),
    });
    db.rpc.mockResolvedValue({ data: { duplicate: false, report: { id: 'r1', status: 'running' } }, error: null });
    const callModel = vi.fn(async () => JSON.stringify({ overallScore: 65, summaryMd: 's', weaknesses: [{ tag: 't', questionIds: [id(1), id(9)] }] }));
    const res = await handleInterviewReport({ action: 'interview-report', sessionId: id(5), requestId: id(6) }, { uid: 'u', db, model: 'm', json, must, callModel });
    expect(res.status).toBe(200);
    expect(res.data.report.result.weaknesses[0].questionIds).toEqual([id(1)]);
    expect(res.data.report.result.questionScores).toEqual([{ questionId: id(1), title: '协程', score: 65, rounds: 2 }]);
  });

  it('refuses reports without data before charging a request', async () => {
    const db = fakeDb({ ai_evaluations: () => ({ data: [], error: null }) });
    const res = await handleWeaknessReport({ action: 'weakness-report', requestId: id(6) }, { uid: 'u', db, model: 'm', json, must, callModel: vi.fn() });
    expect(res.status).toBe(400);
    expect(db.rpc).not.toHaveBeenCalled();
  });
});
