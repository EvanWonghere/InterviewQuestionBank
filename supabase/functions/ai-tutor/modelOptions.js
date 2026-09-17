// These bounded interactive requests need answer tokens, not a hidden reasoning
// budget. Other OpenAI-compatible providers must not receive DeepSeek fields.
export function modelOptions(url) {
  return new URL(url).hostname === 'api.deepseek.com' ? { thinking: { type: 'disabled' } } : {};
}
