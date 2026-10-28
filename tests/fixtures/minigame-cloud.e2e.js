import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
const bank = JSON.parse(readFileSync(new URL('../../public/questions.json', import.meta.url), 'utf8'));
const topicIds = ['q-001','q-002','q-005','q-016','q-019','q-026','q-027','q-035','q-057','q-060','q-007','q-008','q-161','q-165',...Array.from({length:8},(_,i)=>`minigame-${String(i+1).padStart(3,'0')}`)];
const pack = topicIds.map((id) => bank.questions.find((q) => q.id === id));
async function setup(page, { missing = false, privateRow = false } = {}) {
  const rows = pack.filter((q) => !(missing && q.id === 'minigame-008')).map((q, i) => ({
    id: `10000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`, legacy_id: q.id, category_id: q.categoryId,
    type: q.type ?? 'short_answer', title: q.title, prompt_md: q.question, difficulty: q.difficulty,
    sort_order: q.order, payload: q.payload ?? {}, source_title: q.sourceTitle ?? '', source_url: q.sourceUrl ?? '',
    status: 'published', visibility: privateRow && q.id === 'minigame-002' ? 'private' : 'public',
    question_tags: (q.tags ?? []).map((name) => ({ tags: { name } })),
  }));
  const calls = [];
  expect(rows.every((q) => !('solution' in q) && !('answer' in q))).toBe(true);
  await page.route('https://minigame-test.supabase.co/**', async (route) => {
    const request = route.request(); const url = new URL(request.url());
    const reply = (value, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value), headers: { 'access-control-allow-origin': '*' } });
    if (url.pathname.endsWith('/categories')) return reply(bank.categories.map((c) => ({ id: c.id, slug: c.id, name: c.name, sort_order: c.order })));
    if (url.pathname.endsWith('/questions')) return reply(rows);
    if (url.pathname.endsWith('/rpc/grade_question')) {
      const input = request.postDataJSON(); calls.push(input);
      const row = rows.find((q) => q.id === input.p_question_id);
      const question = pack.find((q) => q.id === row?.legacy_id);
      if (!question || row.visibility !== 'public') return reply({ message: 'question not available' }, 403);
      return reply({ correct: null, referenceAnswerMd: question.solution?.referenceAnswerMd ?? question.answer, rubricMd: question.solution?.rubricMd ?? '', explanationMd: '合成云端解析标记' });
    }
    return reply([]);
  });
  return { calls, rows };
}

test('cloud UUID and legacy ID select the same topic question, grading only after submission', async ({ page }) => {
  const state = await setup(page);
  await page.goto('./#/quiz?topic=minigame-client&section=laya&questionId=minigame-001');
  await expect(page.locator('article')).toContainText('TypeScript 类型断言能验证接口数据吗');
  expect(state.calls).toHaveLength(0);
  await page.getByPlaceholder('用自己的话作答…').fill('类型断言不会校验运行时数据。');
  await page.getByRole('button', { name: '提交并查看参考答案' }).click();
  await expect(page.getByText('合成云端解析标记')).toBeVisible();
  const row = state.rows.find((q) => q.legacy_id === 'minigame-001');
  expect(state.calls).toHaveLength(1);
  expect(state.calls[0].p_question_id).toBe(row.id);
  await page.goto(`./#/quiz?topic=minigame-client&section=laya&questionId=${row.id}`);
  await expect(page.locator('article')).toContainText('TypeScript 类型断言能验证接口数据吗');
});

test('a missing cloud question is reported, and a private matching row is never shown in this public topic', async ({ page }) => {
  const state = await setup(page, { missing: true, privateRow: true });
  await page.goto('./#/topics/minigame-client');
  await expect(page.getByRole('alert')).toContainText('缺少 2 道');
  const privateRow = state.rows.find((q) => q.legacy_id === 'minigame-002');
  await page.goto(`./#/quiz?topic=minigame-client&section=laya&questionId=${privateRow.id}`);
  await expect(page.getByRole('alert')).toContainText('不属于当前专题范围');
  await expect(page.locator('article')).toHaveCount(0);
});
