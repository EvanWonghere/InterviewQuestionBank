import { createClient } from 'npm:@supabase/supabase-js@2.112.4';
import { validateChat, buildContext, HISTORY_TURNS } from './core.js';
import { handleDraftQuestion, handleEvaluate, handleInterviewReport, handleWeaknessQuestions, handleWeaknessReport, latestEvaluationSummary } from './evaluate.ts';
import { modelFailure } from './modelErrors.js';
import { MODEL_TIMEOUT_MS, normalizeEffort, REASONING_EFFORTS } from './modelOptions.js';
import { canProviderFallback, iterateChatEvents, openChatStream, requestDeadline } from './modelClient.js';
import { insertPedagogyNote, pedagogyNote } from './pedagogy.js';
import { completeTutorText, CREDIT_POLICIES, describeConnectionProbes, effectivePolicy, planInteractiveTurn, planTaskTurn, publicRouting, routedCall, testModelConnections } from './router.js';
import { handleLab } from './labs.ts';
import { handleMusic } from './music.ts';
import { handleArrange } from './musicArrange.ts';
import { handleStrudel } from './musicStrudel.ts';
const env = (key: string) => Deno.env.get(key) ?? '';
const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Cache-Control': 'no-store' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
const must = <T>(r: { data: T; error: { message: string } | null }): T => { if (r.error) throw new Error(r.error.message); return r.data; };
async function saveRouting(db: { from: (table: string) => any }, table: string, userId: string, requestId: string, patch: Record<string, unknown>) {
 try {
  const saved = await db.from(table).update(patch).eq('user_id', userId).eq('request_id', requestId);
  if (saved.error) console.error('routing metadata not saved', saved.error.message);
 } catch (error) {
  console.error('routing metadata not saved', error instanceof Error ? error.message : 'unknown');
 }
}
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
  const deadline = requestDeadline();
  if (typeof action === 'string' && action.startsWith('lab-')) {
   const settings = must(await db.from('ai_settings').select('reasoning_effort,credit_policy').eq('user_id',uid).maybeSingle());
   const effort = normalizeEffort(settings?.reasoning_effort);
   const policy = settings?.credit_policy;
   return await handleLab(input,{uid,db,json,model:'pending',authorize:async()=>{const permission=await client.rpc('is_app_admin');return !permission.error&&permission.data===true;},
    completeTutorText: env('AI_API_KEY') ? (messages: unknown[], meta: { phase: string; message: string; subject: string; recent: unknown[] }) => completeTutorText({ env, policy, phase: meta.phase, message: meta.message, subject: meta.subject, recent: meta.recent, messages, effort, deadline }) : undefined});
  }
  if (typeof action === 'string' && action.startsWith('music-')) {
   const settings = must(await db.from('ai_settings').select('reasoning_effort,credit_policy').eq('user_id',uid).maybeSingle());
   const effort = normalizeEffort(settings?.reasoning_effort);
   const policy = settings?.credit_policy;
   const authorize = async () => { const permission = await client.rpc('is_app_admin'); return !permission.error && permission.data === true; };
   if (action === 'music-arrange' || action === 'music-strudel') {
    // Structured proposals and snippets use the task route (JSON output), like question drafting.
    const callTask = env('AI_API_KEY') ? () => {
     const planned = planTaskTurn({ env, action, policy });
     const routed = routedCall({ target: planned.target, fallback: planned.fallback, effort, deadline });
     routed.execution.tier = planned.route.tier;
     return routed;
    } : undefined;
    return await (action === 'music-arrange' ? handleArrange : handleStrudel)(input, { uid, db, json, authorize, callTask });
   }
   return await handleMusic(input,{uid,db,json,model:'pending',authorize:async()=>{const permission=await client.rpc('is_app_admin');return !permission.error&&permission.data===true;},
    completeTutorText: env('AI_API_KEY') ? (messages: unknown[], meta: { phase: string; message: string; subject: string; recent: unknown[] }) => completeTutorText({ env, policy, phase: meta.phase, message: meta.message, subject: meta.subject, recent: meta.recent, messages, effort, deadline }) : undefined});
  }
  if (action === 'settings') {
   const settings = must(await db.from('ai_settings').select('base_url,model,reasoning_effort,credit_policy').eq('user_id',uid).maybeSingle());
   const routing = publicRouting(env);
   // Cached copies of the previous quiz page still require settings.model before they enable send and evaluation.
   // Routing no longer reads that column; the value only keeps those copies usable.
   return json({ settings: { base_url: settings?.base_url ?? '', model: settings?.model || routing.models.fast, reasoning_effort: settings?.reasoning_effort ?? 'high' }, reasoningEfforts: REASONING_EFFORTS, configured: routing.keys.deepseek, allowedOrigins: env('AI_ALLOWED_ORIGINS').split(',').filter(Boolean), ...routing, creditPolicy: effectivePolicy(settings?.credit_policy, routing.creditPolicy) });
  }
  if (action === 'save-settings' || action === 'test') {
   if (input.reasoningEffort != null && !REASONING_EFFORTS.includes(input.reasoningEffort)) return json({error:'无效思考强度'},400);
   if (input.creditPolicy != null && !CREDIT_POLICIES.includes(input.creditPolicy)) return json({error:'无效额度策略'},400);
   const effort=normalizeEffort(input.reasoningEffort);
   if(action === 'save-settings') {
    const patch: { user_id: string; reasoning_effort: string; credit_policy?: string } = { user_id: uid, reasoning_effort: effort };
    if (CREDIT_POLICIES.includes(input.creditPolicy)) patch.credit_policy = input.creditPolicy;
    must(await db.from('ai_settings').upsert(patch)); return json({ok:true});
   }
   if (!env('AI_API_KEY')) return json({error:'尚未设置服务端AI_API_KEY'},503);
   const probe = planTaskTurn({ env, action: 'draft-question' });
   must(await db.rpc('ai_take_rate',{p_user:uid}));
   // Same thinking mode, budget and timeout as real generation, so a passing test predicts real behaviour.
   try {
    const report = await testModelConnections({ catalog: probe.catalog, effort, deadline });
    const testedModels = report.probes.filter((probe) => probe.status === 'ok').map((probe) => probe.model);
    const body = { ok: report.ok, probes: report.probes, testedModels };
    if (!report.ok) return json({ ...body, error: describeConnectionProbes(report.probes) }, report.status);
    return json(body);
   }
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
   const settings=must(await db.from('ai_settings').select('reasoning_effort,credit_policy').eq('user_id',uid).maybeSingle());
   if(!env('AI_API_KEY')) return json({error:'尚未设置服务端 AI_API_KEY'},503);
   const planned=planTaskTurn({ env, action, policy: settings?.credit_policy });
   const routed=routedCall({ target: planned.target, fallback: planned.fallback, effort: normalizeEffort(settings?.reasoning_effort), deadline });
   routed.execution.tier=planned.route.tier;
   const ctx={uid,client,db,model:planned.target.model,json,must,callModel:routed.callModel};
   const table=action==='evaluate' ? 'ai_evaluations' : action==='interview-report' || action==='weakness-report' ? 'ai_reports' : null;
   const respond=action==='evaluate' ? await handleEvaluate(input,ctx)
    : action==='interview-report' ? await handleInterviewReport(input,ctx)
    : action==='draft-question' ? await handleDraftQuestion(input,ctx)
    : action==='draft-weakness-questions' ? await handleWeaknessQuestions(input,ctx)
    : await handleWeaknessReport(input,ctx);
   if(routed.execution.fallbackUsed && table && typeof input.requestId==='string') await saveRouting(db, table, uid, input.requestId, { model: routed.execution.model });
   return respond;
  }
  if(action !== 'chat') return json({error:'未知操作'},400);
  validateChat(input);
  const settings=must(await db.from('ai_settings').select('reasoning_effort,credit_policy').eq('user_id',uid).maybeSingle());
  if(!env('AI_API_KEY')) return json({error:'尚未设置服务端 AI_API_KEY'},503);
  const q=must(await db.from('questions').select('id,title,prompt_md,type,payload,updated_at').eq('id',input.questionId).single());
  if(!q)return json({error:'题目不存在'},404);
  const solution=input.phase==='review' ? must(await db.from('question_solutions').select('solution').eq('question_id',q.id).maybeSingle())?.solution : undefined;
  const note=input.includeNote ? must(await db.from('notes').select('body_md').eq('user_id',uid).eq('question_id',q.id).maybeSingle())?.body_md : undefined;
  const c=must(await db.from('ai_conversations').select('id').eq('user_id',uid).eq('question_id',q.id).maybeSingle());
  // One row past the window so buildContext can tell a hit row cap from a phase filter.
  const history=c ? (must(await db.from('ai_messages').select('role,body,phase,status').eq('conversation_id',c.id).order('created_at',{ascending:false}).order('request_id',{ascending:false}).order('role',{ascending:true}).limit(HISTORY_TURNS+1)) ?? []).reverse() : [];
  const evaluation=input.phase==='review' ? await latestEvaluationSummary(db,uid,q.id,must) : undefined;
  const context=buildContext({question:q,solution,submission:input.submission,phase:input.phase,note,history,evaluation});
  const effort=normalizeEffort(settings?.reasoning_effort);
  const begin=must(await db.rpc('ai_begin',{p_user:uid,p_question:q.id,p_version:q.updated_at,p_request:input.requestId,p_body:input.message,p_phase:input.phase,p_model:'pending'}));
  if(begin.duplicate) return json({error:'此请求已接收，请重新加载历史确认结果；不会重复调用',duplicate:true},409);
  const abort=new AbortController(); let disconnected=false;
  req.signal.addEventListener('abort',()=>{disconnected=true;abort.abort();},{once:true});
  const timer=setTimeout(()=>abort.abort(),MODEL_TIMEOUT_MS);
  const encoder=new TextEncoder();
  const stream=new ReadableStream({async start(controller) {
   let body=''; let status='failed'; let failure=''; let lastSave=0; let polling=false; let lastThinking=0;
   let active:{model:string;provider:string}|null=null; let tier:string|null=null; let pedagogy:string|null=null; let fallbackUsed=false;
   const emit=(event:string,data:unknown)=>{try{controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));}catch{disconnected=true;abort.abort();}};
   const persist=async()=>must(await db.from('ai_messages').update({body}).eq('id',begin.message.id));
   const poll=setInterval(async()=>{if(polling)return;polling=true;try{const m=must(await db.from('ai_messages').select('status').eq('id',begin.message.id).single());if(!m || m.status!=='running'){disconnected=true;abort.abort();}}catch{abort.abort();}finally{polling=false;}},1000);
   const startedAt=Date.now();
   const attemptSignal=()=>{
    const left=MODEL_TIMEOUT_MS-(Date.now()-startedAt);
    if(abort.signal.aborted||left<1000) return AbortSignal.abort();
    return AbortSignal.any([abort.signal,AbortSignal.timeout(left)]);
   };
   const pull=async(target:{url:string;apiKey:string;model:string;provider:string},messages:unknown[])=>{
    const upstream=await openChatStream({url:target.url,apiKey:target.apiKey,model:target.model,messages,effort,signal:attemptSignal()});
    for await(const event of iterateChatEvents(upstream.body)){
     if(event.thinking && Date.now()-lastThinking>5000){lastThinking=Date.now();emit('thinking',{thinking:true});}
     if(event.text){body+=event.text;if(body.length>60000)throw new Error('回复超过长度限制');emit('delta',{text:event.text});}
     if(event.finishReason==='length') throw new Error('upstream_length');
     if(event.finishReason==='insufficient_system_resource') throw new Error('upstream_busy');
     if(Date.now()-lastSave>700){await persist();lastSave=Date.now();}
    }
    if(!body) throw new Error('响应中断或为空，请手动重试');
   };
   try {
    emit('meta',{truncated:context.truncated,phaseFiltered:context.phaseFiltered,version:q.updated_at});
    const recent=history.filter((message:{status?:string;phase?:string})=>message.status==='complete'&&(input.phase==='review'||message.phase==='hint')).slice(-4);
    const plan=await planInteractiveTurn({env,policy:settings?.credit_policy,phase:input.phase,message:input.message,subject:q.title,recent});
    active=plan.target; tier=plan.route.tier; pedagogy=plan.decision.pedagogyAction;
    const messages=insertPedagogyNote([...context.messages,{role:'user',content:input.message}],pedagogyNote(plan.decision.pedagogyAction,input.phase));
    emit('meta',{model:plan.target.model,pedagogy:plan.decision.pedagogyAction,version:q.updated_at});
    try { await pull(plan.target,messages); }
    catch(error){
     const fallback=plan.fallback;
     if(!fallback||!canProviderFallback({emitted:Boolean(body),cancelled:disconnected,aborted:abort.signal.aborted,fallback,error})) throw error;
     fallbackUsed=true; active=fallback;
     emit('meta',{model:fallback.model,fallback:true});
     await pull(fallback,messages);
    }
    status='complete';
   } catch(error) { status=disconnected?'stopped':'failed';failure=disconnected?'已停止；部分内容保留':modelFailure(error,active?.provider).error; }
   finally {
    clearTimeout(timer);clearInterval(poll);
    try {
     await persist();
     const updated=must(await db.from('ai_messages').update({status}).eq('id',begin.message.id).eq('status','running').select('status'));
     if(!updated?.length) status='stopped';
     if(active) await saveRouting(db,'ai_messages',uid,input.requestId,{model:active.model,provider:active.provider,model_tier:tier,pedagogy_action:pedagogy,fallback_used:fallbackUsed});
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
  if(text==='missing_openai_key'||text==='missing_deepseek_key'||text.startsWith('API必须使用服务端允许的HTTPS域名')){const failure=modelFailure(error);return json(failure,failure.status);}
  if(text.includes('followup_invalid'))return json({error:'追问已回答、已达轮次上限或不属于本题，请刷新后重试'},400);
  // Input validation messages are authored in evaluation.js and safe to show.
  if(/^(无效|模拟面试评估需要|追问回答需为|作答过长|只能把|薄弱点数据过长)/.test(text))return json({error:text},400);
  // Do not reflect database internals, upstream response bodies or secrets.
  return json({error:'请求未完成，请检查输入与配置；已有内容未被清空'},400);
 }
}
if (import.meta.main) Deno.serve(req => handleRequest(req));
