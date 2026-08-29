import { expect, test } from '@playwright/test';

test('loads the public library at the blog sub-path', async ({ page }) => {
  await page.goto('./#/quiz');
  await expect(page.getByText('题目列表')).toBeVisible();
  await expect(page.locator('article').first()).toBeVisible();
});

test('opens a subjective answer flow and keeps the mobile layout usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./#/quiz');
  await page.getByPlaceholder('用自己的话作答…').fill('我的答案');
  await page.getByRole('button', { name: '提交并查看参考答案' }).click();
  await expect(page.getByText('参考答案与解析')).toBeVisible();
  await expect(page.getByRole('button', { name: '良好' })).toBeVisible();
});
