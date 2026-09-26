import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import UsagePanel, { cleanPricing, normalizePricing } from './UsagePanel';

// Monday 2026-09-28 10:00 in Beijing: DeepSeek peak hours.
const PEAK = '2026-09-28T02:00:00.000Z';
const rows = [
  { created_at: PEAK, action: 'chat', model: 'deepseek-flash', input_tokens: 2000, cached_tokens: 1500, output_tokens: 1000, reasoning_tokens: 800 },
  { created_at: PEAK, action: 'evaluate', model: 'gpt-6-luna', input_tokens: 1000, cached_tokens: 0, output_tokens: 500, reasoning_tokens: 0 },
  { created_at: PEAK, action: 'chat', model: 'mystery-model', input_tokens: 10, cached_tokens: 0, output_tokens: 10, reasoning_tokens: 0 },
];
vi.mock('@/lib/supabase', () => ({
  requireSupabase: () => ({ from: () => { const q = { select: () => q, gte: () => q, order: () => q, limit: () => Promise.resolve({ data: rows, error: null }) }; return q; } }),
}));
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(PEAK)); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('UsagePanel', () => {
  it('prices calls from the built-in table without any setup', async () => {
    render(<UsagePanel models={{ fast: 'deepseek-flash', default: 'gpt-6-luna' }} pricing={{}} fx={{ rate: 7.1, date: '2026-09-25', source: '欧洲央行（Frankfurter）' }} onPricingChange={() => {}} />);
    await screen.findByRole('table', { name: '按模型' });
    const block = document.querySelector('.ai-usage-figures');
    // deepseek peak: (500*2 + 1500*0.04 + 1000*8)/1e6 = 0.00906; luna at the live rate: (1000*0.1 + 500*0.5)*7.1/1e6 = 0.002485
    expect(block).toHaveTextContent('¥0.0115另有 1 次未定价');
    expect(screen.getByText(/汇率 7\.1000（欧洲央行（Frankfurter） 2026-09-25，每 12 小时自动更新）/)).toBeInTheDocument();
    expect(block).toHaveTextContent('缓存命中50%');
    expect(screen.getByRole('table', { name: /单价/ })).toHaveTextContent('高峰价');
    expect(screen.getByRole('table', { name: '按功能' })).toHaveTextContent('学习助手');
  });

  it('prefers a manual exchange rate over the live one, and uses overrides', async () => {
    render(<UsagePanel models={{}} pricing={{ rate: 7, models: { 'mystery-model': { input: 1000, cached: 0, output: 1000 } } }} fx={{ rate: 6.7, date: '2026-09-25', source: 'x' }} onPricingChange={() => {}} />);
    await screen.findByRole('table', { name: '按模型' });
    // luna at 7: 0.00245; deepseek 0.00906; mystery (10*1000 + 10*1000)/1e6 = 0.02
    expect(document.querySelector('.ai-usage-figures')).toHaveTextContent('¥0.0315');
    expect(screen.getByText(/（手动设置）/)).toBeInTheDocument();
  });

  it('edits overrides and the rate, and keeps only complete rows for saving', async () => {
    const onPricingChange = vi.fn();
    render(<UsagePanel models={{ fast: 'deepseek-flash' }} pricing={{}} onPricingChange={onPricingChange} />);
    fireEvent.change(await screen.findByLabelText('deepseek-flash 输入单价'), { target: { value: '2' } });
    expect(onPricingChange).toHaveBeenLastCalledWith({ rate: '', models: { 'deepseek-flash': { input: '2', cached: '', output: '' } } });
    fireEvent.change(screen.getByLabelText('美元兑人民币汇率'), { target: { value: '7.2' } });
    expect(onPricingChange).toHaveBeenLastCalledWith({ rate: '7.2', models: {} });
    expect(cleanPricing({ rate: '7.2', models: { a: { input: '2', cached: '0.5', output: '8' }, b: { input: '1', cached: '', output: '3' } } }))
      .toEqual({ rate: 7.2, models: { a: { input: 2, cached: 0.5, output: 8 } } });
    expect(cleanPricing({ a: { input: 1, cached: 1, output: 1 } })).toEqual({ models: { a: { input: 1, cached: 1, output: 1 } } });
    expect(normalizePricing(null)).toEqual({ rate: '', models: {} });
  });
});
