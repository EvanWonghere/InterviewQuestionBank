import { afterEach, describe, expect, it, vi } from 'vitest';
import { callRoutedModel } from '../../supabase/functions/ai-tutor/modelClient.js';
import { completeTutorText } from '../../supabase/functions/ai-tutor/router.js';
const target = { provider: 'openai', model: 'primary', apiKey: 'synthetic', url: 'https://api.openai.com/v1/chat/completions' };
const fallback = { provider: 'deepseek', model: 'fallback', apiKey: 'synthetic', url: 'https://api.deepseek.com/v1/chat/completions' };
const reply = () => new Response(JSON.stringify({ choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }] }));
afterEach(() => vi.restoreAllMocks());
describe('one deadline across routing and non-streaming fallback', () => {
  function clock() {
    let now = 0;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const timers = vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => new AbortController().signal);
    return { advance: value => { now = value; }, timers };
  }
  it('gives fallback only the remaining budget and still returns a timely result', async () => {
    const c = clock();
    const fetchImpl = vi.fn().mockImplementationOnce(async () => { c.advance(80000); throw new Error('upstream_http_503'); }).mockImplementationOnce(async () => { c.advance(89000); return reply(); });
    await expect(callRoutedModel({ target, fallback, messages: [], fetchImpl })).resolves.toBe('ok');
    expect(c.timers.mock.calls.map(([ms]) => ms)).toEqual([90000, 10000]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
  it('never starts another provider when the total deadline has expired', async () => {
    const c = clock(); const onFallback = vi.fn();
    const fetchImpl = vi.fn(async () => { c.advance(90000); throw new DOMException('expired', 'TimeoutError'); });
    await expect(callRoutedModel({ target, fallback, messages: [], fetchImpl, onFallback })).rejects.toMatchObject({ name: 'TimeoutError' });
    expect(fetchImpl).toHaveBeenCalledTimes(1); expect(onFallback).not.toHaveBeenCalled();
  });
  it('rejects a late fallback result instead of reporting success after expiration', async () => {
    const c = clock();
    const fetchImpl = vi.fn().mockImplementationOnce(async () => { c.advance(80000); throw new Error('upstream_http_503'); }).mockImplementationOnce(async () => { c.advance(91000); return reply(); });
    await expect(callRoutedModel({ target, fallback, messages: [], fetchImpl })).rejects.toMatchObject({ name: 'TimeoutError' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
  it('includes the Jev planning time in the Lab deadline', async () => {
    const c = clock();
    const env = key => ({ AI_API_KEY: 'synthetic', TYPESAFE_API_KEY: 'synthetic', AI_ALLOWED_ORIGINS: 'https://api.deepseek.com,https://api.openai.com' })[key] || '';
    const fetchImpl = vi.fn().mockImplementationOnce(async () => { c.advance(8000); return new Response(JSON.stringify({ answers: {} })); }).mockImplementationOnce(async () => reply());
    await expect(completeTutorText({ env, phase: 'explain', message: 'test', subject: 'lab', recent: [], messages: [], effort: 'high', fetchImpl })).resolves.toMatchObject({ body: 'ok' });
    expect(c.timers.mock.calls.map(([ms]) => ms)).toEqual([8000, 82000]);
  });
});
