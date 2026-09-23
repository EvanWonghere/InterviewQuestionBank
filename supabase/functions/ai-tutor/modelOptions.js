// Provider-specific request fields. Other OpenAI-compatible providers must not receive DeepSeek fields.
export const REASONING_EFFORTS = ['none', 'low', 'high', 'max'];
export const DEFAULT_REASONING_EFFORT = 'high';
// Server wait for one model call (streaming or not). Stale-run cutoffs in SQL must stay above this.
export const MODEL_TIMEOUT_MS = 90000;

const hostOf = (url) => { try { return new URL(url).hostname; } catch { return ''; } };
const isDeepSeek = (url) => hostOf(url) === 'api.deepseek.com';
const isOpenAI = (url) => hostOf(url) === 'api.openai.com';
export const normalizeEffort = (effort) => (REASONING_EFFORTS.includes(effort) ? effort : DEFAULT_REASONING_EFFORT);

/**
 * Reasoning counts toward max_tokens, so thinking requests get more room.
 * MODEL_TIMEOUT_MS still bounds latency and cost. Other hosts stay at the smaller budget.
 */
export function outputBudget(url, effort) {
  const thinking = normalizeEffort(effort) !== 'none' && (isDeepSeek(url) || isOpenAI(url));
  return thinking ? 8192 : 4096;
}

export function modelOptions(url, { effort = DEFAULT_REASONING_EFFORT, json = false } = {}) {
  const level = normalizeEffort(effort);
  const jsonFormat = json ? { response_format: { type: 'json_object' } } : {};
  if (isDeepSeek(url)) {
    return {
      thinking: { type: level === 'none' ? 'disabled' : 'enabled' },
      ...(level === 'none' ? {} : { reasoning_effort: level }),
      ...jsonFormat,
    };
  }
  if (isOpenAI(url)) return { reasoning_effort: level, ...jsonFormat };
  return {};
}
