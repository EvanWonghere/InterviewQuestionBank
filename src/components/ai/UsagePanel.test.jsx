import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import UsagePanel, { cleanPricing } from './UsagePanel';

const now = new Date().toISOString();
const rows = [
  { created_at: now, action: 'chat', model: 'deepseek-flash', input_tokens: 2000, cached_tokens: 1500, output_tokens: 1000, reasoning_tokens: 800 },
  { created_at: now, action: 'evaluate', model: 'gpt-6-luna', input_tokens: 1000, cached_tokens: 0, output_tokens: 500, reasoning_tokens: 0 },
];
vi.mock('@/lib/supabase', () => ({
  requireSupabase: () => ({ from: () => { const q = { select: () => q, gte: () => q, order: () => q, limit: () => Promise.resolve({ data: rows, error: null }) }; return q; } }),
}));
afterEach(cleanup);

describe('UsagePanel', () => {
  it('sums cost at the entered prices and shows cache and reasoning shares', async () => {
    render(<UsagePanel models={{ fast: 'deepseek-flash' }} pricing={{ 'deepseek-flash': { input: 2, cached: 0.5, output: 8 } }} onPricingChange={() => {}} />);
    await screen.findByRole('table', { name: '按模型' });
    const block = document.querySelector('.ai-usage-figures');
    // deepseek: (500*2 + 1500*0.5 + 1000*8)/1e6 = 0.00975 (shown to 4 places); luna unpriced
    expect(block).toHaveTextContent('¥0.0097另有 1 次未定价');
    expect(block).toHaveTextContent('缓存命中50%'); // 1500 of 3000 input cached
    expect(block).toHaveTextContent('思考占输出53%'); // 800 of 1500 output was reasoning
    expect(screen.getByRole('table', { name: '按功能' })).toHaveTextContent('学习助手');
  });

  it('edits prices per model and keeps only complete rows for saving', async () => {
    const onPricingChange = vi.fn();
    render(<UsagePanel models={{ fast: 'deepseek-flash' }} pricing={{}} onPricingChange={onPricingChange} />);
    fireEvent.change(await screen.findByLabelText('deepseek-flash 输入单价'), { target: { value: '2' } });
    expect(onPricingChange).toHaveBeenCalledWith({ 'deepseek-flash': { input: '2', cached: '', output: '' } });
    expect(cleanPricing({ a: { input: '2', cached: '0.5', output: '8' }, b: { input: '1', cached: '', output: '3' } })).toEqual({ a: { input: 2, cached: 0.5, output: 8 } });
  });
});
