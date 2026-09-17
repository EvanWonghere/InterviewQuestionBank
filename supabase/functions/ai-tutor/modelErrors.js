export function modelFailure(error) {
  const text = error instanceof Error ? error.message : '';
  const code = text.match(/upstream_http_(\d{3})/)?.[1];
  const known = {
    '401': '模型服务拒绝密钥，请检查 Supabase 中的 AI_API_KEY。',
    '403': '模型服务拒绝访问，请检查密钥权限与服务地区。',
    '402': '模型账户余额不足，请检查服务商余额。',
    '404': '模型或 API 路径不存在，请检查 Base URL 和 model。',
    '429': '模型服务限流，请稍后重试。',
  };
  if (code) return { status: 502, code: `upstream_${code}`, error: known[code] ?? `模型服务暂时不可用（上游HTTP ${code}）。` };
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return { status: 504, code: 'model_timeout', error: '模型响应超时，输入已保留；请稍后重试或选择响应更快的模型。' };
  if (text === 'upstream_length') return { status: 502, code: 'model_length', error: '模型输出达到长度上限，未得到完整结果；请缩短作答或选择非推理模型。' };
  if (text === 'evaluation_parse') return { status: 502, code: 'model_json', error: '模型未返回有效的评估格式，可稍后重试。' };
  if (text === 'upstream_format') return { status: 502, code: 'model_format', error: '模型未返回有效文本，请确认服务商支持 Chat Completions。' };
  return { status: 502, code: 'model_network', error: '服务端连接模型失败，请稍后重试；若持续发生，请检查服务商状态和 API 地址。' };
}
