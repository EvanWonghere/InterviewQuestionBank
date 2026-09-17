import { requireSupabase } from '@/lib/supabase';
import { sseData } from '../../supabase/functions/ai-tutor/core.js';
export async function aiRequest(input, { signal } = {}) {
  const { data, error } = await requireSupabase().auth.getSession();
  if (error || !data.session) throw new Error('请重新登录管理员账户');
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`, {
    method: 'POST', signal,
    headers: { Authorization: `Bearer ${data.session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    const error = new Error(detail.error || `请求失败（${response.status}）`);
    error.status = response.status;
    throw error;
  }
  if (input.action !== 'chat') return response.json();
  if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream')) throw new Error('模型响应不是流式格式');
  return response;
}
export async function streamChat(input, { signal, onEvent }) {
  const response = await aiRequest({ ...input, action: 'chat' }, { signal });
  let terminal = false;
  for await (const data of sseData(response.body)) {
    const event = JSON.parse(data);
    onEvent(event);
    if (event.status || event.message) terminal = true;
  }
  if (!terminal) throw new Error('连接中断，回复可能未完整保存，请检查历史');
}
