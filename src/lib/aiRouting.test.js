import { describe, expect, it, vi } from 'vitest';
import { callRoutedModel, canProviderFallback, iterateChatEvents } from '../../supabase/functions/ai-tutor/modelClient.js';
import { clampDecision, decisionFromAnswers, defaultDecision, pedagogyNote, systemOneUrl } from '../../supabase/functions/ai-tutor/pedagogy.js';
import { resolveTarget, selectRoute } from '../../supabase/functions/ai-tutor/router.js';

const catalog = {
  deepseek: { provider: 'deepseek', model: 'deepseek-flash', apiKey: 'd', url: 'https://api.deepseek.com/v1/chat/completions' },
  luna: { provider: 'openai', model: 'gpt-6-luna', apiKey: 'o', url: 'https://api.openai.com/v1/chat/completions' },
  sol: { provider: 'openai', model: 'gpt-6-sol', apiKey: 'o', url: 'https://api.openai.com/v1/chat/completions' },
};

describe('credit routing', () => {
  it('keeps hard turns off DeepSeek even when spending DeepSeek credits first', () => {
    expect(selectRoute({ policy: 'aggressive', task: 'interactive', difficulty: 'hard' })).toEqual({ tier: 'reasoning', slot: 'sol' });
    expect(selectRoute({ policy: 'aggressive', task: 'interactive', difficulty: 'easy', needsStrongReasoning: true }).slot).toBe('sol');
    expect(selectRoute({ policy: 'aggressive', task: 'batch', difficulty: 'hard' }).slot).toBe('sol');
    expect(resolveTarget(selectRoute({ policy: 'aggressive', task: 'interactive', difficulty: 'medium' }), catalog).model).toBe('deepseek-flash');
  });
  it('moves medium interactive turns to Luna only outside aggressive mode', () => {
    expect(selectRoute({ policy: 'balanced', task: 'interactive', difficulty: 'easy' }).slot).toBe('deepseek');
    expect(selectRoute({ policy: 'balanced', task: 'interactive', difficulty: 'medium' }).slot).toBe('luna');
    expect(selectRoute({ policy: 'conservative', task: 'interactive', difficulty: 'easy' }).slot).toBe('luna');
    expect(selectRoute({ policy: 'conservative', task: 'evaluation', difficulty: 'medium' }).slot).toBe('luna');
    expect(selectRoute({ policy: 'conservative', task: 'batch', difficulty: 'medium' }).slot).toBe('deepseek');
    expect(selectRoute({ policy: 'aggressive', task: 'summary', difficulty: 'medium' }).slot).toBe('deepseek');
  });
});

describe('pedagogy clamp', () => {
  it('blocks a direct answer before submission unless the student asked for the full solution', () => {
    const direct = { pedagogyAction: 'ANSWER_DIRECTLY', pedagogyConfidence: 0.9, explicitFullSolution: 0.2 };
    expect(clampDecision(direct, 'hint').pedagogyAction).toBe('GIVE_HINT');
    expect(clampDecision(direct, 'predict').pedagogyAction).toBe('GIVE_HINT');
    expect(clampDecision({ ...direct, explicitFullSolution: 0.91 }, 'predict').pedagogyAction).toBe('ANSWER_DIRECTLY');
    expect(pedagogyNote('ANSWER_DIRECTLY', 'predict')).toContain('预测阶段');
  });
  it('uses a phase-safe action when Jev is unsure or unavailable', () => {
    expect(clampDecision({ pedagogyAction: 'EXPLAIN_CONCEPT', pedagogyConfidence: 0.2 }, 'review').pedagogyAction).toBe('EXPLAIN_CONCEPT');
    expect(clampDecision({ pedagogyAction: 'SHOW_EXAMPLE', pedagogyConfidence: 0.1 }, 'hint').pedagogyAction).toBe('GIVE_HINT');
    expect(defaultDecision('hint').pedagogyAction).toBe('GIVE_HINT');
    expect(defaultDecision('explain').needsStrongReasoning).toBe(false);
  });
  it('reads typed answers and ignores an unknown pedagogy label', () => {
    const decision = decisionFromAnswers({
      intent: { choice: 'concept_explanation' },
      pedagogy: { choice: 'CHECK_STUDENT_ANSWER', confidence: 0.8 },
      difficulty: { score: 2.1 },
      needsStrongReasoning: { noul: 0.2 },
      explicitFullSolution: { noul: 0.1 },
    }, 'review');
    expect(decision).toMatchObject({ intent: 'concept_explanation', pedagogyAction: 'CHECK_STUDENT_ANSWER', difficulty: 'hard', needsStrongReasoning: false });
    expect(decisionFromAnswers({ pedagogy: { choice: 'WRITE_A_POEM', confidence: 0.99 } }, 'review').pedagogyAction).toBe('EXPLAIN_CONCEPT');
  });
  it('appends the evaluation path to the API root and accepts a root that already includes it', () => {
    expect(systemOneUrl('https://api.typesafe.ai')).toBe('https://api.typesafe.ai/v1/systemone');
    expect(systemOneUrl('https://api.typesafe.ai/v1/systemone')).toBe('https://api.typesafe.ai/v1/systemone');
    expect(() => systemOneUrl('https://example.com')).toThrow('typesafe_base_invalid');
  });
});

describe('provider fallback', () => {
  const reply = (status, content) => ({ status, ok: status < 300, json: async () => ({ choices: [{ message: { content }, finish_reason: 'stop' }] }) });
  it('falls back once before any text and does not retry a rejected request or a second failure', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(reply(503, ''))
      .mockResolvedValueOnce(reply(200, 'hint'));
    await expect(callRoutedModel({
      target: catalog.luna, fallback: catalog.deepseek, messages: [], effort: 'high', fetchImpl,
    })).resolves.toBe('hint');
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body).model).toBe('deepseek-flash');
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).not.toHaveProperty('thinking');
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body).thinking).toEqual({ type: 'enabled' });
    const rejected = vi.fn(async () => reply(400, ''));
    await expect(callRoutedModel({ target: catalog.luna, fallback: catalog.deepseek, messages: [], effort: 'high', fetchImpl: rejected })).rejects.toThrow('upstream_http_400');
    expect(rejected).toHaveBeenCalledTimes(1);
  });
  it('does not switch models after text has already been emitted or the caller cancelled', () => {
    const error = new Error('upstream_http_503');
    expect(canProviderFallback({ fallback: catalog.deepseek, error })).toBe(true);
    expect(canProviderFallback({ emitted: true, fallback: catalog.deepseek, error })).toBe(false);
    expect(canProviderFallback({ cancelled: true, fallback: catalog.deepseek, error })).toBe(false);
    expect(canProviderFallback({ aborted: true, fallback: catalog.deepseek, error: new DOMException('t', 'TimeoutError') })).toBe(false);
  });
  it('reads chat deltas without forwarding reasoning text', async () => {
    const encoded = new TextEncoder().encode('data: {"choices":[{"delta":{"reasoning_content":"secret","content":"可见"}}]}\n\ndata: [DONE]\n\n');
    const body = new ReadableStream({ start(controller) { controller.enqueue(encoded); controller.close(); } });
    const events = [];
    for await (const event of iterateChatEvents(body)) events.push(event);
    expect(events).toEqual([{ text: '可见', thinking: true, finishReason: null }]);
    expect(JSON.stringify(events)).not.toContain('secret');
  });
});
