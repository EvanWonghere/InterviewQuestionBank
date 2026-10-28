import { expect, test } from '@playwright/test';

test('static topic supports grouped practice, answer and history', async ({ page }) => {
  await page.goto('./#/topics/minigame-client');
  await expect(page.getByRole('heading', { name: '小游戏客户端 · 技术复习' })).toBeVisible();
  await expect(page.getByText('已练 0 / 当前可用 22 题', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: '练习03 · TypeScript、Laya 与异步' }).click();
  await expect(page.locator('article')).toContainText('TypeScript 类型断言能验证接口数据吗');
  await page.getByPlaceholder('用自己的话作答…').fill('类型断言不会验证运行时字段，先检查 score 的实际类型和范围。');
  await page.getByRole('button', { name: '提交并查看参考答案' }).click();
  await expect(page.getByRole('heading', { name: '参考答案与解析' })).toBeVisible();
  await page.locator('article').getByRole('button', { name: '良好', exact: true }).click();
  await page.goto('./#/review/history');
  await expect(page.getByText('TypeScript 类型断言能验证接口数据吗？').first()).toBeVisible();
});

test('phone layout and out-of-scope direct links remain safe', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./#/topics/minigame-client');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('./#/quiz?topic=minigame-client&section=laya&questionId=q-001');
  await expect(page.getByRole('alert')).toContainText('不属于当前专题范围');
  await expect(page.locator('article')).toHaveCount(0);
  await page.goto('./#/quiz?topic=minigame-client&section=laya&questionId=minigame-004');
  await expect(page.locator('article')).toContainText('资源失败与过期异步回调');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
