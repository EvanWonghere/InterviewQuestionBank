import { expect, test } from '@playwright/test';

const ids = ['10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'];
test('cloud speed review fetches one answer at a time and never submits', async ({ page }) => {
  const calls = [];
  await page.route('https://minigame-test.supabase.co/**', async (route) => {
    const request = route.request(); const url = new URL(request.url());
    const reply = (value, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value), headers: { 'access-control-allow-origin': '*' } });
    if (url.pathname.endsWith('/categories')) return reply([{ id: 'c', slug: 'c', name: '类别', sort_order: 0 }]);
    if (url.pathname.endsWith('/questions')) return reply(ids.map((id, index) => ({ id, legacy_id: `minigame-00${index + 1}`, category_id: 'c', type: 'short_answer', title: `合成题${index + 1}`, prompt_md: '合成题干', difficulty: 'easy', sort_order: index, payload: {}, status: 'published', visibility: 'public', question_tags: [] })));
    if (url.pathname.endsWith('/rpc/reveal_question')) {
      const input = request.postDataJSON(); calls.push({ action: 'reveal', input });
      return reply({ referenceAnswerMd: input.p_question_id === ids[0] ? '合成参考答案一' : '合成参考答案二' });
    }
    if (url.pathname.endsWith('/rpc/grade_question') || url.pathname.endsWith('/attempts')) calls.push({ action: 'write-or-grade' });
    return reply([]);
  });
  await page.goto('./#/quiz?topic=minigame-client&section=laya&mode=fast');
  await expect(page.getByText('合成参考答案一')).toBeVisible();
  expect(calls).toEqual([{ action: 'reveal', input: { p_question_id: ids[0] } }]);
  await page.getByRole('button', { name: '下一题' }).click();
  await expect(page.getByText('合成参考答案二')).toBeVisible();
  expect(calls.map((item) => item.action)).toEqual(['reveal', 'reveal']);
  await expect(page.getByRole('textbox')).toHaveCount(0);
});
