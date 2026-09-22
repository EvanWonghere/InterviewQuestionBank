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


test('finds the UI question by stable ID and renders scoring points after submission', async ({ page }) => {
  await page.goto('./#/quiz?q=q-151');
  await expect(page.locator('article').first()).toContainText('屏幕点转 UI 局部坐标');
  await page.getByPlaceholder('用自己的话作答…').fill('Overlay传null，返回值只表示命中平面，还需要检查矩形范围。');
  await page.getByRole('button', { name: '提交并查看参考答案' }).click();
  await expect(page.getByRole('heading', { name: '评分点（每项 1 分）' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '最小验证' })).toBeVisible();
  await page.getByRole('article').getByRole('button', { name: '困难', exact: true }).click();
  await page.goto('./#/review/history');
  await expect(page.getByText('屏幕点转 UI 局部坐标：相机参数与命中判定').first()).toBeVisible();
});

test('opens an exact questionId and shows a missing question instead of another question', async ({ page }) => {
  await page.goto('./#/quiz?questionId=q-151');
  await expect(page.locator('article').first()).toContainText('屏幕点转 UI 局部坐标：相机参数与命中判定');

  await page.goto('./#/quiz?questionId=question-that-does-not-exist');
  await expect(page.getByRole('alert')).toContainText('未找到题目「question-that-does-not-exist」');
  await expect(page.getByRole('alert')).toContainText('不会自动打开其他题目');
  await expect(page.locator('article')).toHaveCount(0);
});

test('renders chat markdown formulas, highlighted code, and mermaid', async ({ page }) => {
  await page.goto('./#/dev/chat-markdown');
  await expect(page.getByRole('heading', { name: '助手渲染夹具' })).toBeVisible({ timeout: 20000 });
  await expect(page.locator('.katex').first()).toBeVisible();
  await expect(page.locator('code.hljs, .hljs-keyword').first()).toBeVisible();
  await expect(page.locator('.ai-mermaid svg')).toBeVisible({ timeout: 15000 });
});

test('random practice can skip a question when the rating gate is off', async ({ page }) => {
  await page.goto('./#/random-practice');
  await expect(page.getByText('Random Practice')).toBeVisible({ timeout: 20000 });
  await expect(page.getByLabel(/必须先标记再下一题/)).toBeChecked();
  await page.getByLabel(/必须先标记再下一题/).uncheck();
  await page.getByRole('button', { name: /开始随机刷题/ }).click();
  await expect(page.getByText('可跳过')).toBeVisible();
  await expect(page.getByRole('button', { name: '下一题' })).toBeEnabled();
  await page.getByRole('button', { name: '下一题' }).click();
  await expect(page.getByText(/已跳过 1/)).toBeVisible();
});

test('loads build and OS topic gaps on mobile without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [id, title] of [['q-158', 'APK、AAB'], ['q-162', '操作系统的作用'], ['q-169', '假 null'], ['q-172', '0.9']]) {
    await page.goto(`./#/quiz?q=${id}`);
    await expect(page.locator('article').first()).toContainText(title);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
