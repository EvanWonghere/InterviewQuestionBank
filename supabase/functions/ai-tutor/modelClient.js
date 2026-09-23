import { sseData } from './core.js';
import { MODEL_TIMEOUT_MS, modelOptions, tokenLimit } from './modelOptions.js';

export const requestDeadline = () => Date.now() + MODEL_TIMEOUT_MS;
function remainingSignal(deadline) {
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new DOMException('Request deadline exceeded', 'TimeoutError');
  return AbortSignal.timeout(Math.ceil(remaining));
}

/** Non-streaming Chat Completions call; errors carry only the upstream status, never its body. */
// budgetScale > 1 is for replies that carry several items (e.g. a set of drafted questions).
export async function callModel({ url, apiKey, model, messages, effort, json = false, budgetScale = 1, fetchImpl = fetch, deadline = requestDeadline() }) {
  const signal = remainingSignal(deadline);
  const post = (jsonOutput) => {
    signal.throwIfAborted();
    if (Date.now() >= deadline) throw new DOMException('Request deadline exceeded', 'TimeoutError');
    return fetchImpl(url, {
      method: 'POST', redirect: 'error', signal,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, ...tokenLimit(url, effort, budgetScale), stream: false, ...modelOptions(url, { effort, json: jsonOutput }) }),
    });
  };
  let response = await post(json);
  // A 400 is a rejected, unbilled request. If JSON Output was the unsupported part, the prompt still demands json.
  if (json && response.status === 400 && modelOptions(url, { effort, json }).response_format) response = await post(false);
  if (!response.ok) throw new Error(`upstream_http_${response.status}`);
  const result = await response.json().catch(() => {
    signal.throwIfAborted();
    return null;
  });
  signal.throwIfAborted();
  if (Date.now() >= deadline) throw new DOMException('Request deadline exceeded', 'TimeoutError');
  const choice = result?.choices?.[0];
  if (choice?.finish_reason === 'length') throw new Error('upstream_length');
  if (choice?.finish_reason === 'insufficient_system_resource') throw new Error('upstream_busy');
  const content = choice?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('upstream_format');
  return content;
}

/** One cross-provider retry: no assistant text yet, the caller was not cancelled, and the failure is operational. */
export function canProviderFallback({ emitted = false, cancelled = false, aborted = false, fallback, error }) {
  if (emitted || cancelled || aborted || !fallback?.apiKey) return false;
  return isFallbackable(error, { cancelled });
}

/** Failures that may try the other provider once, before any assistant text has been emitted. */
export function isFallbackable(error, { cancelled = false } = {}) {
  if (cancelled) return false;
  if (error?.name === 'TimeoutError') return true;
  if (error?.name === 'AbortError') return !cancelled;
  if (error instanceof TypeError) return true;
  const text = error instanceof Error ? error.message : '';
  if (text === 'upstream_busy' || text === 'upstream_network') return true;
  const code = text.match(/upstream_http_(\d{3})/)?.[1];
  return code === '429' || Boolean(code && code.startsWith('5'));
}

function chatBody({ url, model, messages, effort, json, stream, budgetScale }) {
  return JSON.stringify({
    model,
    messages,
    ...tokenLimit(url, effort, budgetScale),
    stream,
    ...modelOptions(url, { effort, json }),
  });
}

async function postChat({ url, apiKey, model, messages, effort, json, stream, budgetScale, signal, fetchImpl }) {
  let response;
  try {
    response = await fetchImpl(url, {
      method: 'POST', redirect: 'error', signal,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: chatBody({ url, model, messages, effort, json, stream, budgetScale }),
    });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') throw error;
    if (error instanceof TypeError) throw new Error('upstream_network');
    throw error;
  }
  return response;
}

export async function openChatStream({ url, apiKey, model, messages, effort, signal, fetchImpl = fetch }) {
  const response = await postChat({ url, apiKey, model, messages, effort, json: false, stream: true, budgetScale: 1, signal, fetchImpl });
  if (!response.ok) throw new Error(`upstream_http_${response.status}`);
  if (!response.body) throw new Error('upstream_format');
  return response;
}

/** Shared Chat Completions SSE reader. Reasoning text is not forwarded. */
export async function* iterateChatEvents(body) {
  let finished = false;
  for await (const data of sseData(body)) {
    if (data === '[DONE]') { finished = true; return; }
    let parsed;
    try { parsed = JSON.parse(data); } catch { throw new Error('upstream_format'); }
    if (parsed.error) throw new Error('模型服务返回错误');
    const choice = parsed.choices?.[0] ?? {};
    const delta = choice.delta ?? {};
    if (choice.finish_reason) finished = true;
    yield {
      text: typeof delta.content === 'string' ? delta.content : '',
      thinking: typeof delta.reasoning_content === 'string' && delta.reasoning_content.length > 0,
      finishReason: choice.finish_reason ?? null,
    };
  }
  if (!finished) throw new Error('响应中断或为空，请手动重试');
}

/**
 * One OpenAI failure before any text falls back to DeepSeek. A second failure is returned as-is.
 * onFallback runs only after the primary call has failed and before the fallback call.
 */
export async function callRoutedModel({ target, fallback, messages, effort, json = false, budgetScale = 1, fetchImpl = fetch, onFallback, deadline = requestDeadline() }) {
  try {
    return await callModel({ url: target.url, apiKey: target.apiKey, model: target.model, messages, effort, json, budgetScale, fetchImpl, deadline });
  } catch (error) {
    if (Date.now() >= deadline || !fallback?.apiKey || target.provider !== 'openai' || !isFallbackable(error)) throw error;
    if (onFallback) onFallback();
    return await callModel({ url: fallback.url, apiKey: fallback.apiKey, model: fallback.model, messages, effort, json, budgetScale, fetchImpl, deadline });
  }
}
