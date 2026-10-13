import { expect, test } from '@playwright/test';

test('topic uses objective grading and saves a local review attempt', async ({ page }) => {
  await page.goto('./#/topics/gbits');
  await expect(page.getByRole('heading', { name: '吉比特游戏研发工程师 · 笔试专项' })).toBeVisible();
  await page.getByRole('link', { name: '先做 6 题 · 30 分钟起步' }).click();
  await expect(page.locator('article')).toContainText('循环引用');
  await page.getByLabel('把不拥有对象的一条反向边改为 weak_ptr，访问时 lock').check();
  await page.getByRole('button', { name: '提交答案', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: '回答正确' })).toBeVisible();
  await page.locator('article').getByRole('button', { name: '良好', exact: true }).click();
  await page.goto('./#/review/history');
  await expect(page.getByText('循环引用：哪个改动能释放对象？').first()).toBeVisible();
});

test('fill blanks and algorithms retain their actual response controls', async ({ page }) => {
  await page.goto('./#/quiz?topic=gbits&section=structures&questionId=gbits-021');
  await page.getByLabel('f(127)').fill('1');
  await page.getByLabel('f(128)').fill('128');
  await page.getByRole('button', { name: '提交答案', exact: true }).click();
  await expect(page.getByText('回答正确', { exact: true })).toBeVisible();
  await page.goto('./#/quiz?topic=gbits&section=algorithms');
  await expect(page.getByPlaceholder('写下思路、复杂度或代码…')).toBeVisible();
  await page.getByPlaceholder('写下思路、复杂度或代码…').fill('用栈匹配，结束时必须为空，O(L)。');
  await page.getByRole('button', { name: '提交并查看参考答案' }).click();
  await expect(page.getByRole('heading', { name: 'C++17 参考实现' })).toBeVisible();
});

test('practice timer starts by click and phone pages do not overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./#/topics/gbits');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: '打开混合练习卷' }).click();
  await expect(page.getByLabel('剩余练习时间')).toHaveText('90:00');
  await page.getByRole('button', { name: '开始 90 分钟计时' }).click();
  await expect(page.getByRole('button', { name: '重新计时' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('./#/quiz?topic=gbits&section=algorithms&questionId=gbits-035');
  await expect(page.locator('article')).toContainText('多模式匹配');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
