import { handleRequest } from './index.ts';
import { beginFailure } from './music.ts';
import { selectRoute } from './router.js';
const assert = (x: unknown, message = 'assertion failed') => { if (!x) throw Error(message); };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

// The user client answers ai_access() with `access`; the service client is only counted.
const clients = (access: unknown) => {
  const seen = { clients: 0, rpcs: [] as string[] };
  const factory = () => {
    seen.clients++;
    if (seen.clients > 1) return { from() { throw Error('service client reached'); }, rpc() { throw Error('service client reached'); } };
    return { auth: { getUser: async () => ({ data: { user: { id: 'member' } }, error: null }) }, rpc: async (name: string) => { seen.rpcs.push(name); return { data: access, error: null }; } };
  };
  return { seen, factory };
};
const call = (action: string, factory: any) => handleRequest(new Request('http://localhost', { method: 'POST', headers: { Authorization: 'Bearer synthetic' }, body: JSON.stringify({ action }) }), factory);
const member = { admin: false, scopes: ['music'], dailyLimit: 30, usedToday: 0, expiresAt: null };

for (const action of ['settings', 'save-settings', 'test', 'history', 'evaluate', 'draft-question', 'draft-weakness-questions', 'interview-report', 'lab-chat', 'lab-sync']) {
  Deno.test(`a music member cannot call ${action}; rejected before any service client`, async () => {
    const { seen, factory } = clients(member);
    const res = await call(action, factory);
    assert(res.status === 403, `${action} ${res.status}`); assert(seen.clients === 1); assert(seen.rpcs.join() === 'ai_access');
  });
}
Deno.test('music actions pass the access check for a music member', async () => {
  for (const action of ['music-history', 'music-chat', 'music-arrange', 'music-strudel']) {
    const { seen, factory } = clients(member);
    await call(action, factory);
    assert(seen.clients === 2, `${action} should reach the service client`);
  }
});
Deno.test('without the music scope, or with an unexpected answer, music is refused too', async () => {
  for (const access of [{ admin: false, scopes: [] }, { admin: false, scopes: ['labs'] }, false, null, 'admin', { admin: 'true', scopes: 'music' }]) {
    const { seen, factory } = clients(access);
    const res = await call('music-history', factory);
    assert(res.status === 403 && seen.clients === 1, JSON.stringify(access));
  }
});
Deno.test('members stop at Luna on hard turns; administrators may reach the reasoning model', () => {
  for (const task of ['interactive', 'batch']) {
    const capped = selectRoute({ policy: 'aggressive', task, difficulty: 'hard', maxSlot: 'luna' });
    assert(capped.slot === 'luna' && capped.tier === 'default', `${task} capped`);
    assert(selectRoute({ policy: 'aggressive', task, needsStrongReasoning: true, maxSlot: 'luna' }).slot === 'luna');
    assert(selectRoute({ policy: 'aggressive', task, difficulty: 'hard' }).slot === 'sol', `${task} admin`);
  }
  assert(selectRoute({ policy: 'aggressive', task: 'interactive', difficulty: 'medium', maxSlot: 'luna' }).slot === 'deepseek', 'the cap never raises the tier');
});
Deno.test('the daily limit and missing access are reported as settled refusals', async () => {
  const daily = beginFailure(Error('daily_limit'), json); assert(daily.status === 429);
  const body = await daily.json(); assert(body.settled === true && body.error.includes('次数已用完'));
  const denied = beginFailure(Error('admin_required'), json); assert(denied.status === 403);
});
