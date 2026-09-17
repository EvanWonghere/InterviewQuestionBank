import { MODEL_TIMEOUT_MS, modelOptions, outputBudget } from './modelOptions.js';

/** Non-streaming Chat Completions call; errors carry only the upstream status, never its body. */
// budgetScale > 1 is for replies that carry several items (e.g. a set of drafted questions).
export async function callModel({ url, apiKey, model, messages, effort, json = false, budgetScale = 1, fetchImpl = fetch }) {
  const signal = AbortSignal.timeout(MODEL_TIMEOUT_MS);
  const post = (jsonOutput) => fetchImpl(url, {
    method: 'POST', redirect: 'error', signal,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: outputBudget(url, effort) * budgetScale, stream: false, ...modelOptions(url, { effort, json: jsonOutput }) }),
  });
  let response = await post(json);
  // A 400 is a rejected, unbilled request. If JSON Output was the unsupported part, the prompt still demands json.
  if (json && response.status === 400 && modelOptions(url, { effort, json }).response_format) response = await post(false);
  if (!response.ok) throw new Error(`upstream_http_${response.status}`);
  const result = await response.json().catch(() => null);
  const choice = result?.choices?.[0];
  if (choice?.finish_reason === 'length') throw new Error('upstream_length');
  if (choice?.finish_reason === 'insufficient_system_resource') throw new Error('upstream_busy');
  const content = choice?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('upstream_format');
  return content;
}
