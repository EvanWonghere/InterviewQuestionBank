import { beforeEach, describe, expect, it } from 'vitest';
import { describeSpend, formatSpend, reportSpend } from './aiSpend';
import { usePetStore } from '@/store/petStore';

describe('aiSpend', () => {
  beforeEach(() => usePetStore.setState({ spendEvent: null }));

  it('formats a priced answer in yuan and an unpriced one in tokens', () => {
    expect(formatSpend({ input: 1200, cached: 900, output: 300, reasoning: 0, cost: 0.00123 })).toBe('-¥0.0012');
    expect(formatSpend({ input: 1200, cached: 0, output: 300, reasoning: 0, cost: 0.034 })).toBe('-¥0.034');
    expect(formatSpend({ input: 1200, cached: 0, output: 1100, reasoning: 0, cost: null })).toBe('-2.3k tokens');
    expect(formatSpend(null)).toBe('');
  });

  it('describes cache hits and reasoning', () => {
    expect(describeSpend({ input: 1000, cached: 800, output: 2500, reasoning: 2000, cost: 0.02 })).toBe('¥0.020 · 缓存命中 80% · 思考 2.0k');
  });

  it('hands usage to 小芽 and ignores empty usage', () => {
    reportSpend({ input: 0, cached: 0, output: 0, reasoning: 0, cost: null });
    expect(usePetStore.getState().spendEvent).toBeNull();
    reportSpend({ input: 10, cached: 0, output: 5, reasoning: 0, cost: null });
    expect(usePetStore.getState().spendEvent).toMatchObject({ key: 1, usage: { input: 10 } });
  });
});
