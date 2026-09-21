import { createClient } from 'npm:@supabase/supabase-js@2.112.4';
import { endpoint, validateChat, buildContext, sseData, HISTORY_TURNS } from './core.js';
import { handleDraftQuestion, handleEvaluate, handleInterviewReport, handleWeaknessQuestions, handleWeaknessReport, latestEvaluationSummary } from './evaluate.ts';
import { modelFailure } from './modelErrors.js';
import { MODEL_TIMEOUT_MS, modelOptions, normalizeEffort, outputBudget, REASONING_EFFORTS } from './modelOptions.js';
import { callModel as callModelWith } from './modelClient.js';
import { handleLab } from './labs.ts';
const env = (key: string) => Deno.env.get(key) ?? '';
const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Cache-Control': 'no-store' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
const must = <T>(r: { data: T; error: { message: string } | null }): T => { if (r.error) throw new Error(r.error.message); return r.data; };
type ModelCall = { effort: string; json?: boolean; budgetScale?: number };
const callModel = (url: string, model: string, messages: unknown[], { effort, json = false, budgetScale = 1 }: ModelCall) =>
 callModelWith({ url, apiKey: env('AI_API_KEY'), model, messages, effort, json, budgetScale });
export async function handleRequest(req: Request, factory = createClient) {
 if (req.method === 'OPTIONS') return new Response(null, { headers });
 if (req.method !== 'POST') return json({ error: 'POST required' },405);
 try {
  const token = req.headers.get('Authorization')?.replace(/^Bearer /i,'');
  if (!token) return json({ error: '请登录管理员账户' },401);
  const client = factory(env('SUPABASE_URL'),env('SUPABASE_ANON_KEY'),{ global:{headers:{Authorization:`Bearer ${token}`}}, auth:{persistSession:false} });
  const auth = await client.auth.getUser(token);
  if (auth.error || !auth.data.user) return json({error:'登录已失效'},401);
  const admin = await client.rpc('is_app_admin');
  if (admin.error || admin.data !== true) return json({error:'仅管理员可用'},403);
  const uid = auth.data.user.id;
  const db = factory(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
  const raw = await req.text(); if (raw.length > 40000) return json({error:'请求过大'},413);
  const input = JSON.parse(raw); const action = input.action;
  if (typeof action === 'string' && action.startsWith('lab-')) {
   const settings = must(await db.from('ai_settings').select('base_url,model,reasoning_effort').eq('user_id',uid).maybeSingle());
   const configured = settings?.model && env('AI_API_KEY');
   return await handleLab(input,{uid,db,json,model:settings?.model,authorize:async()=>{const permission=await client.rpc('is_app_admin');return !permission.error&&permission.data===true;},
    callModel:configured ? (messages:unknown[])=>callModel(endpoint(settings.base_url,env('AI_ALLOWED_ORIGINS')),settings.model,messages,{effort:settings.reasoning_effort}) : undefined});
  }
  if (action === 'settings') {
   const settings = must(await db.from('ai_settings').select('base_url,model,reasoning_effort').eq('user_id',uid).maybeSingle());
   return json({ settings: settings ?? {base_url:'',model:'',reasoning_effort:'high'}, reasoningEfforts: REASONING_EFFORTS, configured: Boolean(env('AI_API_KEY')), allowedOrigins:env('AI_ALLOWED_ORIGINS').split(',').filter(Boolean) });
  }
  if (action === 'save-settings' || action === 'test') {
   const url = endpoint(input.baseUrl,env('AI_ALLOWED_ORIGINS'));
   if (typeof input.model !== 'string' || !input.model.trim() || input.model.length > 200) return json({error:'请填写model（最长200字）'},400);
   if (input.reasoningEffort != null && !REASONING_EFFORTS.includes(input.reasoningEffort)) return json({error:'无效思考强度'},400);
   const effort=normalizeEffort(input.reasoningEffort);
   if(action === 'save-settings') {
    must(await db.from('ai_settings').upsert({user_id:uid,base_url:input.baseUrl.trim().replace(/\/$/,''),model:input.model.trim(),reasoning_effort:effort})); return json({ok:true});
   }
   if (!env('AI_API_KEY')) return json({error:'尚未设置服务端AI_API_KEY'},503);
   must(await db.rpc('ai_take_rate',{p_user:uid}));
   // Same thinking mode, budget and timeout as real generation, so a passing test predicts real behaviour.
   try { await callModel(url,input.model,[{role:'user',content:'Reply with OK.'}],{effort}); return json({ok:true}); }
   catch(error) {
    const failure=modelFailure(error); return json(failure,failure.status);
   }
  }
  if (action === 'append-note') {
   const body=must(await db.rpc('ai_append_note',{p_user:uid,p_question:input.questionId,p_body:input.body,p_expected:input.expectedNote ?? ''})); return json({body});
  }
  if (action === 'cancel') {
   must(await db.from('ai_messages').update({status:'stopped'}).eq('user_id',uid).eq('request_id',input.requestId).eq('role','assistant').eq('status','running')); return json({ok:true});
  }
  if (action === 'clear') { must(await db.rpc('ai_clear',{p_user:uid,p_question:input.questionId})); return json({ok:true}); }
  if (action === 'history') {
   const c=must(await db.from('ai_conversations').select('*').eq('user_id',uid).eq('question_id',input.questionId).maybeSingle());
   if(!c) return json({conversation:null,messages:[]});
   must(await db.from('ai_messages').update({status:'failed'}).eq('conversation_id',c.id).eq('status','running').lt('created_at',new Date(Date.now()-150000).toISOString()));
   const messages=must(await db.from('ai_messages').select('*').eq('conversation_id',c.id).order('created_at',{ascending:false}).order('request_id',{ascending:false}).order('role',{ascending:true}).limit(200));
   const q=must(await db.from('questions').select('updated_at').eq('id',input.questionId).single());
   if(!q)return json({error:'题目不存在'},404);
   return json({conversation:c,messages:(messages ?? []).reverse(),versionChanged:c.question_version !== q.updated_at});
  }
  if (action === 'evaluate' || action === 'interview-report' || action === 'weakness-report' || action === 'draft-question' || action === 'draft-weakness-questions') {
   const settings=must(await db.from('ai_settings').select('base_url,model,reasoning_effort').eq('user_id',uid).maybeSingle());
   if(!settings?.model || !env('AI_API_KEY')) return json({error:'请先配置API地址、model和服务端密钥'},503);
   const url=endpoint(settings.base_url,env('AI_ALLOWED_ORIGINS'));
   const ctx={uid,client,db,model:settings.model,json,must,callModel:(messages:unknown[],options:{budgetScale?:number}={})=>callModel(url,settings.model,messages,{effort:settings.reasoning_effort,json:true,budgetScale:options.budgetScale})};
   if(action==='evaluate') return await handleEvaluate(input,ctx);
   if(action==='interview-report') return await handleInterviewReport(input,ctx);
   if(action==='draft-question') return await handleDraftQuestion(input,ctx);
   if(action==='draft-weakness-questions') return await handleWeaknessQuestions(input,ctx);
   return await handleWeaknessReport(input,ctx);
  }
  if(action !== 'chat') return json({error:'未知操作'},400);
  validateChat(input);
  const settings=must(await db.from('ai_settings').select('base_url,model,reasoning_effort').eq('user_id',uid).maybeSingle());
  if(!settings?.model || !env('AI_API_KEY')) return json({error:'请先配置API地址、model和服务端密钥'},503);
  const url=endpoint(settings.base_url,env('AI_ALLOWED_ORIGINS'));
  const q=must(await db.from('questions').select('id,title,prompt_md,type,payload,updated_at').eq('id',input.questionId).single());
  if(!q)return json({error:'题目不存在'},404);
  const solution=input.phase==='review' ? must(await db.from('question_solutions').select('solution').eq('question_id',q.id).maybeSingle())?.solution : undefined;
  const note=input.includeNote ? must(await db.from('notes').select('body_md').eq('user_id',uid).eq('question_id',q.id).maybeSingle())?.body_md : undefined;
  const c=must(await db.from('ai_conversations').select('id').eq('user_id',uid).eq('question_id',q.id).maybeSingle());
  // One row past the window so buildContext can tell a hit row cap from a phase filter.
  const history=c ? (must(await db.from('ai_messages').select('role,body,phase,status').eq('conversation_id',c.id).order('created_at',{ascending:false}).order('request_id',{ascending:false}).order('role',{ascending:true}).limit(HISTORY_TURNS+1)) ?? []).reverse() : [];
  const evaluation=input.phase==='review' ? await latestEvaluationSummary(db,uid,q.id,must) : undefined;
  const context=buildContext({question:q,solution,submission:input.submission,phase:input.phase,note,history,evaluation});
  const begin=must(await db.rpc('ai_begin',{p_user:uid,p_question:q.id,p_version:q.updated_at,p_request:input.requestId,p_body:input.message,p_phase:input.phase,p_model:settings.model}));
  if(begin.duplicate) return json({error:'此请求已接收，请重新加载历史确认结果；不会重复调用',duplicate:true},409);
  const abort=new AbortController(); let disconnected=false;
  req.signal.addEventListener('abort',()=>{disconnected=true;abort.abort();},{once:true});
  const timer=setTimeout(()=>abort.abort(),MODEL_TIMEOUT_MS);
  const encoder=new TextEncoder();
  const stream=new ReadableStream({async start(controller) {
   let body=''; let status='failed'; let failure=''; let lastSave=0; let polling=false; let lastThinking=0;
   const emit=(event:string,data:unknown)=>{try{controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));}catch{disconnected=true;abort.abort();}};
   const persist=async()=>must(await db.from('ai_messages').update({body}).eq('id',begin.message.id));
   const poll=setInterval(async()=>{if(polling)return;polling=true;try{const m=must(await db.from('ai_messages').select('status').eq('id',begin.message.id).single());if(!m || m.status!=='running'){disconnected=true;abort.abort();}}catch{abort.abort();}finally{polling=false;}},1000);
   try {
    emit('meta',{truncated:context.truncated,phaseFiltered:context.phaseFiltered,model:settings.model,version:q.updated_at});
    const upstream=await fetch(url,{method:'POST',redirect:'error',signal:abort.signal,headers:{Authorization:`Bearer ${env('AI_API_KEY')}`,'Content-Type':'application/json'},body:JSON.stringify({model:settings.model,messages:[...context.messages,{role:'user',content:input.message}],max_tokens:outputBudget(url,settings.reasoning_effort),stream:true,...modelOptions(url,{effort:settings.reasoning_effort})})});
    if(!upstream.ok) throw new Error(`upstream_http_${upstream.status}`);
    if(!upstream.body) throw new Error('upstream_format');
    let finished=false;
    for await(const data of sseData(upstream.body)) {
     if(data==='[DONE]'){finished=true;break;}
     const parsed=JSON.parse(data); if(parsed.error) throw new Error('模型服务返回错误');
     const delta=parsed.choices?.[0]?.delta?.content;
     // Reasoning text is not forwarded; a throttled marker shows progress and keeps the connection active.
     if(parsed.choices?.[0]?.delta?.reasoning_content && Date.now()-lastThinking>5000){lastThinking=Date.now();emit('thinking',{thinking:true});}
     if(typeof delta==='string'){body+=delta;if(body.length>60000)throw new Error('回复超过长度限制');emit('delta',{text:delta});}
     if(parsed.choices?.[0]?.finish_reason==='length') throw new Error('upstream_length');
     if(parsed.choices?.[0]?.finish_reason==='insufficient_system_resource') throw new Error('upstream_busy');
     if(parsed.choices?.[0]?.finish_reason) finished=true;
     if(Date.now()-lastSave>700){await persist();lastSave=Date.now();}
    }
    if(!finished || !body)throw new Error('响应中断或为空，请手动重试');
    status='complete';
   } catch(error) { status=disconnected?'stopped':'failed';failure=disconnected?'已停止；部分内容保留':modelFailure(error).error; }
   finally {
    clearTimeout(timer);clearInterval(poll);
    try {
     await persist();
     const updated=must(await db.from('ai_messages').update({status}).eq('id',begin.message.id).eq('status','running').select('status'));
     if(!updated?.length) status='stopped';
     emit('done',{status,error:failure});
    } catch {emit('error',{message:'回复保存失败，当前内容仅为临时副本；请复制后检查历史'});}
    try{controller.close();}catch{/* client closed */}
   }
  },cancel(){disconnected=true;abort.abort();}});
  return new Response(stream,{headers:{...headers,'Content-Type':'text/event-stream'}});
 } catch(error) {
  const text=error instanceof Error?error.message:'';
  if(text.includes('note_conflict'))return json({error:'笔记已更改或尚未同步；请保留编辑内容，刷新笔记后再追加'},409);
  if(text.includes('rate_limit'))return json({error:'请求过于频繁，一分钟最多10次'},429);
  if(text.includes('generation_busy'))return json({error:'本题还有生成中的请求，请停止或稍后刷新'},409);
  if(text.includes('followup_invalid'))return json({error:'追问已回答、已达轮次上限或不属于本题，请刷新后重试'},400);
  // Input validation messages are authored in evaluation.js and safe to show.
  if(/^(无效|模拟面试评估需要|追问回答需为|作答过长|只能把|薄弱点数据过长)/.test(text))return json({error:text},400);
  // Do not reflect database internals, upstream response bodies or secrets.
  return json({error:'请求未完成，请检查输入与配置；已有内容未被清空'},400);
 }
}
if (import.meta.main) Deno.serve(req => handleRequest(req));
