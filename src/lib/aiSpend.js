import { usePetStore } from '@/store/petStore';

const compact = (n) => (n >= 10000 ? `${(n / 1000).toFixed(0)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

/** "-¥0.0123" when the models used have prices in API 设置, otherwise "-2.3k tokens". */
export function formatSpend(usage) {
  if (!usage) return '';
  if (typeof usage.cost === 'number') {
    const digits = usage.cost >= 1 ? 2 : usage.cost >= 0.01 ? 3 : 4;
    return `-¥${usage.cost.toFixed(digits)}`;
  }
  return `-${compact(usage.input + usage.output)} tokens`;
}

/** One line for a reply: cost or tokens, cache hit share and reasoning share. */
export function describeSpend(usage) {
  if (!usage) return '';
  const parts = [formatSpend(usage).slice(1)];
  if (usage.input) parts.push(`缓存命中 ${Math.round((usage.cached / usage.input) * 100)}%`);
  if (usage.reasoning) parts.push(`思考 ${compact(usage.reasoning)}`);
  return parts.join(' · ');
}

/** Lets 小芽 show what an answer cost. Called by the AI client for every response that carries usage. */
export function reportSpend(usage) {
  if (usage && (usage.input || usage.output)) usePetStore.getState().spend(usage);
}
