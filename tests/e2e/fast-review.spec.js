import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
  test(`topic speed review is read-only at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('./#/topics/minigame-client');
    await expect(page.getByRole('heading', { name: '小游戏客户端 · 技术复习' })).toBeVisible();
    const before = await page.evaluate(() => ({ review: localStorage.getItem('iqb:review-v2'), progress: localStorage.getItem('unity-quiz-progress') }));
    await page.getByRole('link', { name: '速刷03 · TypeScript、Laya 与异步' }).click();
    await expect(page.locator('article')).toContainText('TypeScript 类型断言能验证接口数据吗');
    await expect(page.locator('article').getByRole('heading', { name: '参考答案与解析' })).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveCount(0);
    await page.getByRole('button', { name: '下一题' }).click();
    await expect(page.locator('article')).not.toContainText('TypeScript 类型断言能验证接口数据吗');
    await expect(page.locator('article').getByRole('heading', { name: '参考答案与解析' })).toBeVisible();
    await page.getByRole('button', { name: '练习', exact: true }).click();
    await expect(page.getByRole('textbox')).toBeVisible();
    const after = await page.evaluate(() => ({ review: localStorage.getItem('iqb:review-v2'), progress: localStorage.getItem('unity-quiz-progress') }));
    expect(after).toEqual(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
