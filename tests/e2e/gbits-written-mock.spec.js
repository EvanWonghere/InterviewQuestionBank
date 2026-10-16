import { expect, test } from '@playwright/test';
const finish = async (page, label) => {
  await page.getByRole('button', { name: `进入${label}`, exact: true }).click();
  await page.getByRole('button', { name: `提交整个${label}题型`, exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('未答完整');
  await page.getByRole('button', { name: '确认提交并锁定', exact: true }).click();
};
for (const [paper, choices, blanks, algorithms] of [['A', 20, 4, 2], ['B', 16, 2, 3], ['C', 24, 4, 3]]) {
  test(`${paper}: full paper, reload locks, final references and mobile layout`, async ({ page }) => {
    let gradeCalls = 0;
    page.on('request', (request) => { if (request.url().includes('/rpc/grade_question')) gradeCalls++; });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./#/topics/gbits');
    const progressBefore = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((key) => /review|progress/i.test(key)).map((key) => [key, localStorage.getItem(key)])));
    await page.getByRole('link', { name: `开始冲刺 ${paper} 卷模拟`, exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(`冲刺 ${paper} 卷`);
    await page.getByRole('combobox', { name: '训练时长' }).selectOption('120');
    await page.getByRole('button', { name: '创建本次模拟', exact: true }).click();
    await expect(page.getByRole('timer')).toContainText('120:00');
    await page.getByRole('button', { name: '进入编程', exact: true }).click();
    await expect(page.getByRole('navigation', { name: '区块内题号' }).getByRole('button')).toHaveCount(algorithms);
    await page.getByRole('textbox', { name: '编程作答' }).fill('边界草稿：只允许当前区块。');
    await page.reload();
    await expect(page.getByRole('textbox', { name: '编程作答' })).toHaveValue('边界草稿：只允许当前区块。');
    await expect(page.getByRole('button', { name: '进入单选', exact: true })).toHaveCount(0);
    await expect(page.getByText('参考答案与解析', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('article')).toContainText('来源边界');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: '提交整个编程题型', exact: true }).click();
    await expect(page.getByRole('alertdialog')).toContainText(`未答完整 ${algorithms - 1} 题`);
    await page.getByRole('button', { name: '确认提交并锁定' }).click();
    await page.goto('./#/topics/gbits'); await page.goBack(); await page.reload();
    await expect(page.getByRole('button', { name: '编程已提交 · 不可返回' })).toBeDisabled();
    await page.getByRole('button', { name: '进入单选', exact: true }).click();
    await expect(page.getByRole('navigation', { name: '区块内题号' }).getByRole('button')).toHaveCount(choices);
    await page.getByRole('radio').first().check();
    await page.getByRole('button', { name: '提交整个单选题型' }).click();
    await expect(page.getByRole('alertdialog')).toContainText(`未答完整 ${choices - 1} 题`);
    await page.getByRole('button', { name: '确认提交并锁定' }).click();
    expect(gradeCalls).toBe(0);
    await finish(page, '填空');
    await expect(page.getByRole('heading', { name: '全卷已提交' })).toBeVisible();
    await expect(page.locator('details')).toHaveCount(0);
    await page.getByRole('button', { name: '加载全卷解析' }).click();
    await expect(page.locator('details')).toHaveCount(choices + blanks + algorithms);
    await page.locator('details').last().locator('summary').click();
    await expect(page.locator('details').last().locator('pre code.language-cpp')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const progress = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((key) => /review|progress/i.test(key)).map((key) => [key, localStorage.getItem(key)])));
    expect(progress).toEqual(progressBefore);
    await page.screenshot({ path: `/tmp/gbits-${paper.toLowerCase()}-review.png`, fullPage: true });
  });
}

test('corrupt record is preserved and no start button is offered', async ({ page }) => {
  await page.goto('./'); await page.evaluate(() => localStorage.setItem('iqb:gbits-written-mock-v1', '{broken'));
  await page.goto('./#/written-mock/gbits-a');
  await expect(page.getByRole('alert')).toContainText('未覆盖原数据');
  expect(await page.evaluate(() => localStorage.getItem('iqb:gbits-written-mock-v1'))).toBe('{broken');
  await expect(page.getByRole('button', { name: '创建本次模拟' })).toHaveCount(0);
});
