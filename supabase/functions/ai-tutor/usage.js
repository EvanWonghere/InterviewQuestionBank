// Token usage and cost of model calls, recorded per request in ai_usage.
// Providers report usage in different fields; prices are what the administrator enters
// (per million tokens, in their own currency) under API 设置, keyed by model name.

/** DeepSeek and OpenAI usage objects in one shape. Missing or malformed usage gives null. */
export function normalizeUsage(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const n = (value) => (Number.isFinite(value) && value > 0 ? Math.round(value) : 0);
  const input = n(raw.prompt_tokens);
  const cached = Math.min(input, n(raw.prompt_cache_hit_tokens ?? raw.prompt_tokens_details?.cached_tokens));
  const output = n(raw.completion_tokens);
  const reasoning = Math.min(output, n(raw.completion_tokens_details?.reasoning_tokens));
  if (!input && !output) return null;
  return { input, cached, output, reasoning };
}

export const MAX_PRICED_MODELS = 12;
export const MAX_PRICE = 10000;

/** Validates the pricing map saved from API 设置: { model: { input, cached, output } } per million tokens. */
export function validatePricing(pricing) {
  if (pricing == null) return null;
  if (typeof pricing !== 'object' || Array.isArray(pricing)) throw new Error('无效价格表');
  const entries = Object.entries(pricing);
  if (entries.length > MAX_PRICED_MODELS) throw new Error('无效价格表：最多 12 个模型');
  const clean = {};
  for (const [model, price] of entries) {
    if (!/^[A-Za-z0-9._:/-]{1,80}$/.test(model) || !price || typeof price !== 'object') throw new Error('无效价格表');
    const field = (key) => {
      const value = Number(price[key]);
      if (!Number.isFinite(value) || value < 0 || value > MAX_PRICE) throw new Error('无效价格表：单价需在 0—10000 之间');
      return value;
    };
    clean[model] = { input: field('input'), cached: field('cached'), output: field('output') };
  }
  return clean;
}

/** Cost of one call, or null when the model has no price. Cached input is billed at the cached price. */
export function costOf(usage, price) {
  if (!usage || !price) return null;
  const fresh = usage.input - usage.cached;
  return (fresh * price.input + usage.cached * price.cached + usage.output * price.output) / 1_000_000;
}

/** Collects the calls of one request (fallbacks and retries included). */
export function createMeter() {
  const calls = [];
  return {
    calls,
    add: ({ provider, model, usage }) => {
      const normalized = normalizeUsage(usage);
      if (normalized) calls.push({ provider: String(provider || 'unknown').slice(0, 20), model: String(model || 'unknown').slice(0, 80), ...normalized });
    },
    summary(pricing) {
      if (!calls.length) return null;
      let cost = 0;
      let priced = true;
      const total = { input: 0, cached: 0, output: 0, reasoning: 0 };
      for (const call of calls) {
        for (const key of Object.keys(total)) total[key] += call[key];
        const c = costOf(call, pricing?.[call.model]);
        if (c == null) priced = false;
        else cost += c;
      }
      return { ...total, calls: calls.length, cost: priced ? Number(cost.toFixed(6)) : null };
    },
  };
}

/** Writes one ai_usage row per call. Failures are logged, never shown: usage must not break an answer. */
export async function recordUsage(db, { userId, action, requestId, meter, pricing }) {
  if (!meter.calls.length) return;
  const rows = meter.calls.map((call) => {
    const cost = costOf(call, pricing?.[call.model]);
    return {
      user_id: userId,
      action: String(action).slice(0, 40),
      request_id: typeof requestId === 'string' && /^[0-9a-f-]{36}$/i.test(requestId) ? requestId : null,
      provider: call.provider,
      model: call.model,
      input_tokens: call.input,
      cached_tokens: call.cached,
      output_tokens: call.output,
      reasoning_tokens: call.reasoning,
      cost: cost == null ? null : Number(cost.toFixed(6)),
    };
  });
  try {
    const saved = await db.from('ai_usage').insert(rows);
    if (saved?.error) console.error('usage not saved', saved.error.message);
  } catch (error) {
    console.error('usage not saved', error instanceof Error ? error.message : 'unknown');
  }
}
