// Provider-specific request fields. Other OpenAI-compatible providers must not receive DeepSeek fields.
export const REASONING_EFFORTS = ['none', 'low', 'high', 'max'];
export const DEFAULT_REASONING_EFFORT = 'high';
// Server wait for one model call (streaming or not). Stale-run cutoffs in SQL must stay above this.
export const MODEL_TIMEOUT_MS = 90000;

const isDeepSeek = (url) => new URL(url).hostname === 'api.deepseek.com';
export const normalizeEffort = (effort) => (REASONING_EFFORTS.includes(effort) ? effort : DEFAULT_REASONING_EFFORT);

/**
 * DeepSeek counts reasoning toward max_tokens (its own default is 8K without thinking, 64K with),
 * so thinking requests get more room; MODEL_TIMEOUT_MS still bounds latency and cost.
 */
export function outputBudget(url, effort) {
  return isDeepSeek(url) && normalizeEffort(effort) !== 'none' ? 8192 : 4096;
}

export function modelOptions(url, { effort = DEFAULT_REASONING_EFFORT, json = false } = {}) {
  if (!isDeepSeek(url)) return {};
  const level = normalizeEffort(effort);
  return {
    thinking: { type: level === 'none' ? 'disabled' : 'enabled' },
    ...(level === 'none' ? {} : { reasoning_effort: level }),
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  };
}
