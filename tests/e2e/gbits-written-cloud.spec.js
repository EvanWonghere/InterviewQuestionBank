import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { gradeObjective } from '../../src/lib/grading.js';
const bank = JSON.parse(readFileSync(new URL('../../public/questions.json', import.meta.url), 'utf8'));
const pack = bank.questions.filter((q) => Number(q.id.slice(6)) >= 69 && Number(q.id.slice(6)) <= 89 && q.id.startsWith('gbits-'));
function publicRows(missing) {
  return pack.slice(0, missing ? -1 : undefined).map((q, i) => ({ id: `10000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`, legacy_id: q.id, category_id: q.categoryId, type: q.type, title: q.title, prompt_md: q.question, difficulty: q.difficulty, sort_order: q.order, payload: q.payload, source_title: q.sourceTitle, source_url: q.sourceUrl, status: 'published', visibility: 'public', question_tags: q.tags.map((name) => ({ tags: { name } })) }));
}
async function setup(page, { missing = false, failure = false } = {}) {
  const rows = publicRows(missing); const calls = []; const writes = [];
  expect(rows.every((q) => !('solution' in q) && !('answer' in q))).toBe(true);
  await page.route('https://gbits-test.supabase.co/**', async (route) => {
    const request = route.request(); const path = new URL(request.url()).pathname;
    const reply = (value, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value), headers: { 'access-control-allow-origin': '*' } });
    if (path.endsWith('/categories')) return reply(bank.categories.map((c) => ({ id: c.id, slug: c.id, name: c.name, sort_order: c.order })));
    if (path.endsWith('/questions')) return reply(rows);
    if (path.endsWith('/rpc/grade_question')) {
      const input = request.postDataJSON(); calls.push(input);
      if (failure) { failure = false; return reply({ message: 'synthetic offline' }, 503); }
      const row = rows.find((q) => q.id === input.p_question_id); const q = pack.find((q) => q.id === row.legacy_id);
      return reply({ correct: gradeObjective(q, input.p_submission), referenceAnswerMd: q.solution.referenceAnswerMd, rubricMd: q.solution.rubricMd, explanationMd: '云端补充解析标记' });
    }
    if (request.method() !== 'GET' && request.method() !== 'OPTIONS') writes.push(path);
    return reply([]);
  });
  return { calls, writes, rows };
}
async function finish(page, label) {
  await page.getByRole('button', { name: `进入${label}`, exact: true }).click();
  await page.getByRole('button', { name: `提交整个${label}题型` }).click();
  await page.getByRole('button', { name: '确认提交并锁定' }).click();
}
test('real Supabase SDK sees answer-free list, zero early RPCs, then grades snapshots only after full submission', async ({ page }) => {
  const state = await setup(page, { failure: true });
  await page.goto('./#/written-mock/gbits-b'); await page.getByRole('button', { name: '创建本次模拟' }).click();
  await page.getByRole('button', { name: '进入单选', exact: true }).click(); await page.getByRole('radio').nth(1).check();
  await page.reload(); await expect(page.getByRole('radio').nth(1)).toBeChecked(); expect(state.calls).toHaveLength(0);
  await page.getByRole('button', { name: '提交整个单选题型' }).click(); await page.getByRole('button', { name: '确认提交并锁定' }).click();
  await finish(page, '编程'); expect(state.calls).toHaveLength(0); await expect(page.getByText('参考答案与解析', { exact: true })).toHaveCount(0);
  await finish(page, '填空'); expect(state.calls).toHaveLength(0);
  const snapshot = await page.evaluate(() => localStorage.getItem('iqb:gbits-written-mock-v1'));
  await page.getByRole('button', { name: '加载全卷解析' }).click(); await expect(page.getByRole('alert')).toContainText('解析加载失败');
  expect(await page.evaluate(() => localStorage.getItem('iqb:gbits-written-mock-v1'))).toBe(snapshot);
  await page.getByRole('button', { name: '加载全卷解析' }).click(); await expect(page.locator('details')).toHaveCount(21);
  expect(state.calls).toHaveLength(22); expect(state.calls[1]).toEqual({ p_question_id: state.rows[0].id, p_submission: { optionId: 'B' } });
  await page.locator('details').first().locator('summary').click(); await expect(page.locator('details').first().getByText('云端补充解析标记', { exact: true })).toBeVisible();
  expect(state.writes).toEqual([]);
});
test('missing cloud question keeps the paper closed despite a complete static bundle', async ({ page }) => {
  await setup(page, { missing: true }); await page.goto('./#/written-mock/gbits-b');
  await expect(page.getByRole('alert')).toContainText('缺少 1 题'); await expect(page.getByRole('button', { name: '创建本次模拟' })).toHaveCount(0);
});
