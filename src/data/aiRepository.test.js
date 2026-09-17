import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { aiRequest } from './aiRepository';
const auth = vi.hoisted(() => ({ getSession: vi.fn(), refreshSession: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ requireSupabase: () => ({ auth }) }));
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  auth.getSession.mockResolvedValue({ data: { session: { access_token: 'old' } } });
  auth.refreshSession.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

it('refreshes expired authentication once, retaining the same generation id', async () => {
  fetch.mockResolvedValueOnce(Response.json({ error: 'expired' }, { status: 401 }))
    .mockResolvedValueOnce(Response.json({ evaluation: { id: 'saved' } }));
  auth.refreshSession.mockResolvedValue({ data: { session: { access_token: 'new' } } });
  const input = { action: 'evaluate', requestId: 'unchanged' };
  await expect(aiRequest(input)).resolves.toEqual({ evaluation: { id: 'saved' } });
  expect(auth.refreshSession).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch.mock.calls.map(([, options]) => options.body)).toEqual([JSON.stringify(input), JSON.stringify(input)]);
  expect(fetch.mock.calls[1][1].headers.Authorization).toBe('Bearer new');
});

it.each([[409, false], [502, true], [504, false]])('never automatically retries HTTP %s, and retains explicit settlement', async (status, settled) => {
  fetch.mockResolvedValue(Response.json({ error: 'generation failed or pending', settled }, { status }));
  await expect(aiRequest({ action: 'evaluate' })).rejects.toMatchObject({ status, settled });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(auth.refreshSession).not.toHaveBeenCalled();
});

it('reports network loss without replaying a potentially billed generation', async () => {
  fetch.mockRejectedValue(new TypeError('Failed to fetch'));
  await expect(aiRequest({ action: 'evaluate' })).rejects.toThrow('网络连接中断');
  expect(fetch).toHaveBeenCalledTimes(1);
});
