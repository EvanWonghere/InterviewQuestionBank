export function modelFailure(error, provider) {
  const text = error instanceof Error ? error.message : '';
  const code = text.match(/upstream_http_(\d{3})/)?.[1];
  const known = {
    '401': '模型服务拒绝密钥，请检查 Supabase 中的 AI_API_KEY。',
    '403': '模型服务拒绝访问，请检查密钥权限与服务地区。',
    '402': '模型账户余额不足，请检查服务商余额。',
    '404': '模型或 API 路径不存在，请检查 Base URL 和 model。',
    '429': '模型服务限流，请稍后重试。',
  };
  if (text.startsWith('API必须使用服务端允许的HTTPS域名')) return { status: 400, code: 'origin', error: 'API必须使用服务端允许的HTTPS域名，且不带查询参数或凭据' };
  if (text === 'missing_openai_key') return { status: 503, code: 'missing_openai_key', error: '高难或当前策略需要服务端 OPENAI_API_KEY。' };
  if (text === 'missing_deepseek_key') return { status: 503, code: 'missing_deepseek_key', error: '尚未设置服务端 AI_API_KEY。' };
  if (code === '401' && provider === 'openai') return { status: 502, code: 'upstream_401', error: '模型服务拒绝密钥，请检查 Supabase 中的 OPENAI_API_KEY。' };
  if (code) return { status: 502, code: `upstream_${code}`, error: known[code] ?? `模型服务暂时不可用（上游HTTP ${code}）。` };
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return { status: 504, code: 'model_timeout', error: '模型响应超时，输入已保留；请稍后重试，或在 API 设置中降低思考强度。' };
  if (text === 'upstream_length') return { status: 502, code: 'model_length', error: '模型输出（含思考过程）达到长度上限，未得到完整结果；可在 API 设置中降低思考强度后重试。' };
  if (text === 'upstream_busy') return { status: 502, code: 'model_busy', error: '模型服务资源不足，本次未完成，请稍后重试。' };
  if (text === 'evaluation_parse') return { status: 502, code: 'model_json', error: '模型未返回有效的评估格式，可稍后重试。' };
  if (text === 'upstream_format') return { status: 502, code: 'model_format', error: '模型未返回有效文本，请确认服务商支持 Chat Completions。' };
  return { status: 502, code: 'model_network', error: '服务端连接模型失败，请稍后重试；若持续发生，请检查服务商状态和 API 地址。' };
}
