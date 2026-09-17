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
export async function evaluateAnswer(input, { signal } = {}) {
  const data = await aiRequest({ ...input, action: 'evaluate' }, { signal });
  return data.evaluation;
}
export async function requestInterviewReport({ sessionId, requestId }, { signal } = {}) {
  const data = await aiRequest({ action: 'interview-report', sessionId, requestId }, { signal });
  return data.report;
}
export async function requestWeaknessReport({ requestId }, { signal } = {}) {
  const data = await aiRequest({ action: 'weakness-report', requestId }, { signal });
  return data.report;
}
// Reads go straight through RLS (owner + current admin); writes stay in the Edge Function.
export async function listEvaluations({ sessionId, limit = 200 } = {}) {
  let query = requireSupabase().from('ai_evaluations').select('id,question_id,round,root_id,parent_id,follow_up_question,score,suggested_rating,result,status,mode,session_id,created_at').eq('status', 'complete');
  if (sessionId) query = query.eq('session_id', sessionId);
  const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}
export async function latestReport(kind, { sessionId } = {}) {
  let query = requireSupabase().from('ai_reports').select('*').eq('kind', kind).eq('status', 'complete');
  if (sessionId) query = query.eq('session_id', sessionId);
  const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}
