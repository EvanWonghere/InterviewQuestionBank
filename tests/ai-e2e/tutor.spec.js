import { test, expect } from '@playwright/test';
const uid='00000000-0000-0000-0000-000000000001';
const questions=[1,2].map(n=>({id:`10000000-0000-0000-0000-${String(n).padStart(12,'0')}`,legacy_id:`q-90${n}`,category_id:'c',type:'short_answer',title:n===1?'事件订阅与生命周期':'服务器权威与状态同步',prompt_md:'请解释机制并给出一个项目中的边界例子。',difficulty:'medium',payload:{},question_tags:[],sort_order:n,status:'published',visibility:'public'}));
// Deliver a real SDK auth notification using only this fixture's synthetic session.
async function repeatSignIn(page) {
 await page.evaluate(() => {
  const channel = new BroadcastChannel('sb-ai-test-auth-token');
  channel.postMessage({ event: 'SIGNED_IN', session: JSON.parse(localStorage.getItem('sb-ai-test-auth-token')) });
  channel.close();
 });
}
async function setup(page,{admin=true,loggedIn=true,configured=true}={}) {
 const state={messages:{},chats:[],attempts:[],notes:[],calls:[],fail:false,slow:false,evaluations:[],evalInputs:[],reports:[],rpc:{},created:[],drafts:[]};
 if(loggedIn)await page.addInitScript(({uid})=>{
  const enc=x=>btoa(JSON.stringify(x)).replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
  const token=`${enc({alg:'HS256',typ:'JWT'})}.${enc({sub:uid,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})}.fake`;
  localStorage.setItem('sb-ai-test-auth-token',JSON.stringify({access_token:token,refresh_token:'fake',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user:{id:uid,email:'admin@example.test',aud:'authenticated',role:'authenticated'}}));
 },{uid});
 await page.route('https://ai-test.supabase.co/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  const input=route.request().postDataJSON() ?? {};
  const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data),headers:{'access-control-allow-origin':'*'}});
  if(path.includes('/auth/v1/user'))return reply({id:uid,email:'admin@example.test'});
  if(path.includes('/auth/v1/logout'))return reply({});
 if(path.endsWith('/rpc/is_app_admin')){state.rpc.adminChecks=(state.rpc.adminChecks??0)+1;return reply(admin);}
  if(path.endsWith('/rpc/grade_question'))return reply({correct:null,referenceAnswerMd:'发布者持有订阅者引用；销毁时退订，避免重复回调。',rubricMd:'说明生命周期与退订。',explanationMd:''});
  if(path.endsWith('/questions')){
   if(route.request().method()==='POST'){const row={...input,id:crypto.randomUUID(),question_tags:[]};state.created.push(row);return reply(row,201);}
   return reply([...questions,...state.created]);
  }
  if(path.endsWith('/question_solutions')){if(route.request().method()==='POST')state.solutions=[...(state.solutions??[]),input];return reply([]);}
  if(path.endsWith('/categories'))return reply([{id:'c',name:'Unity基础',slug:'unity',sort_order:1}]);
  if(path.endsWith('/attempts')){if(route.request().method()==='POST')state.attempts.push(input);return reply(state.attempts);}
  if(path.endsWith('/notes')){if(route.request().method()==='POST')state.notes=[input];return reply(state.notes);}
  if(path.endsWith('/review_states'))return reply([]);
  if(path.endsWith('/rpc/practice_calendar')){state.rpc.calendar=input;return reply([{day:input.p_to,attempts:3,questions:2,objective:0,correct:0,avg_quality:4,ai_avg_score:76,interviews:1}]);}
  if(path.endsWith('/rpc/practice_day'))return reply([]);
  if(path.endsWith('/ai_evaluations')){
   const session=new URL(route.request().url()).searchParams.get('session_id')?.replace(/^eq\./,'');
   return reply(state.evaluations.filter(e=>!session||e.session_id===session).slice().reverse());
  }
  if(path.endsWith('/ai_reports')){
   const url=new URL(route.request().url());const session=url.searchParams.get('session_id')?.replace(/^eq\./,'');const kind=url.searchParams.get('kind')?.replace(/^eq\./,'');
   return reply(state.reports.filter(r=>r.kind===kind&&(!session||r.session_id===session)).slice(-1));
  }
  if(path.endsWith('/functions/v1/ai-tutor')) {
   state.calls.push(input.action);
   if(!admin)return reply({error:'仅管理员可用'},403);
   if(input.action==='settings')return reply({configured,settings:{base_url:'https://model.example.test/v1',model:'synthetic-tutor',reasoning_effort:'high'},allowedOrigins:['https://model.example.test']});
   if(input.action==='history')return reply({messages:state.messages[input.questionId]??[],versionChanged:false});
   if(input.action==='clear'){state.messages[input.questionId]=[];return reply({ok:true});}
   if(input.action==='append-note'){state.notes=[{question_id:input.questionId,body_md:`原有笔记\n\n${input.body}`}];return reply({body:state.notes[0].body_md});}
   if(input.action==='evaluate'){
    state.evalInputs.push(input);
    if(!configured)return reply({error:'请先配置API地址、model和服务端密钥'},503);
    const parent=input.parentId&&state.evaluations.find(e=>e.id===input.parentId);
    const round=parent?parent.round+1:1;
    const result={score:round===1?58:76,verdict:round===1?'遗漏了禁用时的退订':'补充了禁用场景，仍可更严谨',suggestedRating:round===1?'again':'hard',
     dimensions:[{name:'正确性',score:3,comment:'主体正确'}],strengths:['说明了订阅关系'],
     weaknesses:[{tag:'事件退订',point:'没有区分 OnDisable 与 OnDestroy',errorReason:'boundary_case',severity:'high'}],
     followUp:round===1?{question:'对象被禁用而非销毁时，应该何时退订？',targets:'事件退订'}:null,followUpAnswerScore:round>1?45:null,summaryMd:'**建议**：把订阅与退订放在对称的生命周期回调里。'};
    const ev={id:crypto.randomUUID(),question_id:input.questionId,round,root_id:parent?(parent.root_id??parent.id):null,parent_id:input.parentId??null,
     follow_up_question:parent?parent.result.followUp.question:null,submission:parent?{answerMd:input.answerMd}:input.submission,mode:input.mode,
     session_id:parent?parent.session_id:(input.sessionId??null),score:result.score,suggested_rating:result.suggestedRating,result,status:'complete',created_at:new Date().toISOString()};
    state.evaluations.push(ev);return reply({evaluation:ev});
   }
   if(input.action==='draft-question'){
    state.drafts.push(input);
    return reply({question:{type:input.type==='auto'?'single_choice':input.type,title:'禁用时的事件退订时机',promptMd:'组件被 **禁用** 而非销毁时，应在哪个回调中退订事件？',difficulty:'medium',tags:['事件退订'],
     payload:{options:[{id:'a',text:'OnDisable'},{id:'b',text:'Update'},{id:'c',text:'OnApplicationQuit'}]},
     solution:{correctOptionIds:['a'],referenceAnswerMd:'OnDisable，并在 OnEnable 重新订阅。',rubricMd:'',explanationMd:'禁用不会触发 OnDestroy。',caseSensitive:false},
     sourceTitle:'AI 追问 · 事件订阅与生命周期',originKind:'follow_up',originEvaluationId:input.evaluationId}});
   }
   if(input.action==='draft-weakness-questions'){
    state.drafts.push(input);
    const all=[
     {type:'multiple_choice',title:'哪些回调适合成对订阅与退订',promptMd:'选出**成对**使用的回调组合。',difficulty:'medium',tags:['事件退订'],payload:{options:[{id:'a',text:'OnEnable / OnDisable'},{id:'b',text:'Awake / OnDestroy'},{id:'c',text:'Update / LateUpdate'}]},solution:{correctOptionIds:['a','b'],referenceAnswerMd:'',rubricMd:'',explanationMd:'成对回调保证对称。',caseSensitive:false}},
     {type:'algorithm',title:'用 C# 实现自动退订的事件订阅',promptMd:'实现 `Subscription : IDisposable`。',difficulty:'hard',tags:['事件退订','C#'],payload:{language:'C#',starterCode:'public sealed class Subscription : IDisposable {}'},solution:{referenceAnswerMd:'```csharp\n// 参考实现\n```',rubricMd:'- Dispose 幂等',explanationMd:'',caseSensitive:false}},
    ].slice(0,input.count);
    return reply({tag:input.tag,questions:all.map(q=>({...q,sourceTitle:`AI 针对薄弱点 · ${input.tag}`,originKind:'weakness',originWeaknessTag:input.tag}))});
   }
   if(input.action==='interview-report'||input.action==='weakness-report'){
    const interview=input.action==='interview-report';
    const result=interview
     ?{overallScore:71,summaryMd:'整体思路清楚，**生命周期边界**需要加强。',strengths:['表达结构清晰'],weaknesses:[{tag:'事件退订',detail:'禁用场景考虑不足',questionIds:[questions[0].id]}],studyPlan:['重做事件订阅题并口述 OnEnable/OnDisable 对称写法'],questionScores:[...new Set(state.evaluations.filter(e=>e.session_id===input.sessionId).map(e=>e.question_id))].map(id=>({questionId:id,title:'',score:76,rounds:2}))}
     :{summaryMd:'近期薄弱点集中在**生命周期边界**。',basedOn:state.evaluations.length,focusAreas:[{tag:'事件退订',diagnosis:'把销毁和禁用混为一谈',drills:['画出 Awake→OnEnable→OnDisable→OnDestroy 时序'],questionIds:[questions[0].id]}]};
    const report={id:crypto.randomUUID(),kind:interview?'interview':'weakness',session_id:input.sessionId??null,status:'complete',result,created_at:new Date().toISOString()};
    state.reports.push(report);return reply({report});
   }
   if(input.action==='chat'){
    state.chats.push(input);
    if(state.fail)return reply({error:'请求过于频繁，一分钟最多10次'},429);
    if(state.slow){await new Promise(r=>setTimeout(r,1500));return reply({error:'stopped'},409);}
    const text='先看对象生命周期：**谁订阅，谁负责退订**。\n\n```csharp\nsource.Changed -= OnChanged;\n```\n\n变式：如果对象只是禁用，应该何时恢复订阅？';
    state.messages[input.questionId]=[...(state.messages[input.questionId]??[]),{id:crypto.randomUUID(),role:'user',body:input.message,status:'complete',phase:input.phase},{id:crypto.randomUUID(),role:'assistant',body:text,status:'complete',phase:input.phase,model:'synthetic-tutor'}];
    return route.fulfill({contentType:'text/event-stream',body:`data: ${JSON.stringify({model:'synthetic-tutor'})}\n\ndata: ${JSON.stringify({text})}\n\ndata: ${JSON.stringify({status:'complete'})}\n\n`});
   }
   return reply({ok:true});
  }
  return reply([]);
 });
 return state;
}
test('anonymous and non-admin do not fetch tutor chunks or history',async({page})=>{
 for(const mode of [{loggedIn:false},{admin:false}]){
  await page.unrouteAll();await page.evaluate(()=>localStorage.clear()).catch(()=>{});
  const loaded=[];page.on('request',r=>{if(r.url().includes('TutorPanel'))loaded.push(r.url());});
  const s=await setup(page,mode);await page.goto('./#/quiz');
  await expect(page.getByRole('button',{name:'提交并查看参考答案'})).toBeVisible();
  await expect(page.getByRole('button',{name:'问学习助手'})).toHaveCount(0);
  expect(loaded).toEqual([]);expect(s.calls).toEqual([]);
 }
});
test('admin hint, review, history, note append and question isolation',async({page})=>{
 const s=await setup(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1440,height:1000});await page.goto('./#/quiz?q=q-901');
 await expect(page.getByRole('button',{name:'问学习助手'})).toBeVisible();expect(s.calls).toEqual([]);
 await page.getByRole('button',{name:'问学习助手'}).click();
 await page.getByRole('textbox',{name:'向学习教练提问'}).fill('请检查我的思路');
 await page.getByRole('button',{name:'发送',exact:true}).click();
 await expect(page.getByText('谁订阅，谁负责退订')).toBeVisible();expect(s.chats[0].phase).toBe('hint');
 await expect(page.getByText('本次作答使用过AI辅助',{exact:false})).toBeVisible();
 await page.screenshot({path:'test-results/ai-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'加入本题笔记'}).click();
 await page.getByRole('textbox',{name:'待追加笔记'}).fill('自己的归纳：先明确订阅生命周期');
 await page.getByRole('button',{name:'确认追加'}).click();await expect(page.getByText('已追加到本题笔记')).toBeVisible();
 expect(s.notes[0].body_md).toContain('原有笔记');
 await page.getByRole('button',{name:'关闭学习助手'}).click();
 await page.getByPlaceholder('用自己的话作答…').fill('对象销毁时退订');
 await page.getByRole('button',{name:'提交并查看参考答案'}).click();
 await page.getByRole('button',{name:'良好',exact:true}).click();expect(s.attempts[0].assistance_used).toBe(true);
 await page.getByRole('button',{name:'问学习助手'}).click();
 await page.getByRole('textbox',{name:'向学习教练提问'}).fill('再给一个项目例子');await page.getByRole('button',{name:'发送',exact:true}).click();
 await expect.poll(()=>s.chats.length).toBe(2);expect(s.chats[1].phase).toBe('review');
 await page.getByRole('button',{name:'关闭学习助手'}).click();
 await page.goto('./#/quiz?q=q-902');await page.getByRole('button',{name:'问学习助手'}).click();
 await expect(page.getByRole('log')).not.toContainText('谁订阅');
 await page.getByRole('button',{name:'关闭学习助手'}).click();
 await page.goto('./#/review/history');await expect(page.getByText('AI辅助作答')).toBeVisible();
 await page.getByRole('button',{name:'问学习助手'}).click();await expect(page.getByRole('log')).toContainText('谁订阅');
 expect(errors).toEqual([]);
});
test('mobile panel, errors, stop and logout cleanup',async({page})=>{
 const s=await setup(page);await page.setViewportSize({width:390,height:844});await page.goto('./#/quiz');
 await page.getByRole('button',{name:'问学习助手'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 s.fail=true;await page.getByRole('textbox',{name:'向学习教练提问'}).fill('为什么');await page.getByRole('button',{name:'发送',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('请求过于频繁');
 s.fail=false;s.slow=true;await page.getByRole('textbox',{name:'向学习教练提问'}).fill('换个例子');await page.getByRole('button',{name:'发送',exact:true}).click();
 await page.getByRole('button',{name:'停止',exact:true}).click();await expect(page.getByRole('alert')).toContainText('已停止');
 s.slow=false;await page.getByRole('textbox',{name:'向学习教练提问'}).fill('解释机制');await page.getByRole('button',{name:'发送',exact:true}).click();
 await expect(page.getByText('谁订阅，谁负责退订')).toBeVisible();await page.screenshot({path:'test-results/ai-mobile.png',fullPage:true});
 await page.getByRole('button',{name:'关闭学习助手'}).click();
 await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:'问学习助手'}).click();
 await page.getByRole('button',{name:'退出登录',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('unconfigured key and mock interview disable generation',async({page})=>{
 await setup(page,{configured:false});await page.goto('./#/quiz');await page.getByRole('button',{name:'问学习助手'}).click();
 await expect(page.getByText('未配置AI_API_KEY',{exact:false})).toBeVisible();await expect(page.getByRole('button',{name:'发送',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'关闭学习助手'}).click();await page.goto('./#/mock-interview');
 await page.getByRole('button',{name:/开始/}).click();await expect(page.getByRole('button',{name:'问学习助手'})).toHaveCount(0);
});

test('practice evaluation, follow-up and suggested rating stay advisory',async({page})=>{
 const s=await setup(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1440,height:1000});await page.goto('./#/quiz?q=q-901');
 await page.getByPlaceholder('用自己的话作答…').fill('对象销毁时退订');
 await page.getByRole('button',{name:'提交并查看参考答案'}).click();
 await expect(page.getByText('发布者持有订阅者引用',{exact:false})).toBeVisible();
 expect(s.evalInputs).toEqual([]);
 await page.getByRole('button',{name:'AI 评估我的回答'}).click();
 await expect(page.getByText('遗漏了禁用时的退订')).toBeVisible();
 expect(s.evalInputs[0]).toMatchObject({mode:'practice',submission:{answerMd:'对象销毁时退订'}});
 await expect(page.getByRole('button',{name:/重来\s*AI 建议/})).toBeVisible();
 await expect(page.getByLabel('边界遗漏')).toBeChecked();
 await page.getByRole('textbox',{name:'回答追问'}).fill('在 OnDisable 退订，OnEnable 重新订阅');
 const adminChecks=s.rpc.adminChecks;
 await repeatSignIn(page);
 await expect.poll(()=>s.rpc.adminChecks).toBeGreaterThan(adminChecks);
 await expect(page.getByRole('textbox',{name:'回答追问'})).toHaveValue('在 OnDisable 退订，OnEnable 重新订阅');
 await expect(page.getByText('遗漏了禁用时的退订')).toBeVisible();
 expect(s.evalInputs).toHaveLength(1);
 await page.getByRole('button',{name:'回答追问',exact:true}).click();
 await expect(page.getByText('补充了禁用场景，仍可更严谨')).toBeVisible();
 expect(s.evalInputs[1]).toMatchObject({parentId:s.evaluations[0].id,answerMd:'在 OnDisable 退订，OnEnable 重新订阅'});
 await expect(page.getByRole('button',{name:/困难\s*AI 建议/})).toBeVisible();
 await page.screenshot({path:'test-results/ai-evaluation.png',fullPage:true});
 // The suggestion is advisory: choosing a different rating is recorded as chosen.
 await page.getByRole('button',{name:'良好',exact:true}).click();
 await expect.poll(()=>s.attempts.length).toBe(1);
 expect(s.attempts[0]).toMatchObject({quality:4,ai_evaluation_id:s.evaluations[1].id,error_reasons:['boundary_case']});
 expect(errors).toEqual([]);
});
test('chat stays open across same-user auth events and restores unsent drafts on reopen',async({page})=>{
 const s=await setup(page);await page.goto('./#/quiz?q=q-901');
 await page.getByRole('button',{name:'问学习助手'}).click();
 const draft=page.getByRole('textbox',{name:'向学习教练提问'});
 await draft.fill('这个模式与 C++ 的 RAII 有什么关系？');
 const checks=s.rpc.adminChecks;await repeatSignIn(page);
 await expect.poll(()=>s.rpc.adminChecks).toBeGreaterThan(checks);
 await expect(page.getByRole('dialog')).toBeVisible();
 await expect(draft).toHaveValue('这个模式与 C++ 的 RAII 有什么关系？');
 await page.getByRole('button',{name:'关闭学习助手'}).click();
 await page.getByRole('button',{name:'问学习助手'}).click();
 await expect(draft).toHaveValue('这个模式与 C++ 的 RAII 有什么关系？');
 expect(s.chats).toHaveLength(0);
});
test('mock interview hides the reference during AI follow-ups and ends with a report',async({page})=>{
 const s=await setup(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1280,height:900});await page.goto('./#/mock-interview');
 await page.getByRole('button',{name:'5 题'}).click();await page.getByRole('button',{name:/开始/}).click();
 for(let i=0;i<2;i++){
  await page.getByPlaceholder('用自己的话作答…').fill(`第${i+1}题作答`);
  await page.getByRole('button',{name:'提交并查看参考答案'}).click();
  await expect(page.getByText('遗漏了禁用时的退订')).toBeVisible();
  await expect(page.getByText('发布者持有订阅者引用',{exact:false})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'良好',exact:true})).toHaveCount(0);
  if(i===0){
   await page.getByRole('textbox',{name:'回答追问'}).fill('OnDisable 退订');
   await page.getByRole('button',{name:'回答追问',exact:true}).click();
   await page.getByRole('button',{name:'查看参考答案并自评'}).click();
  } else {
   await page.getByRole('button',{name:'跳过追问，查看参考答案'}).click();
  }
  await expect(page.getByText('发布者持有订阅者引用',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'良好',exact:true}).click();
 }
 await expect(page.getByText('71')).toBeVisible();
 await expect(page.getByLabel('AI面试报告')).toContainText('生命周期边界');
 const sessions=new Set(s.evaluations.map(e=>e.session_id));
 expect(sessions.size).toBe(1);expect([...sessions][0]).toMatch(/^[0-9a-f-]{36}$/);
 expect(s.evaluations.filter(e=>e.round===2)).toHaveLength(1);
 expect(s.attempts.map(a=>Boolean(a.ai_evaluation_id))).toEqual([true,true]);
 expect(s.calls.filter(c=>c==='interview-report')).toHaveLength(1);
 await page.screenshot({path:'test-results/ai-interview-report.png',fullPage:true});
 expect(errors).toEqual([]);
});
test('weakness insights aggregate evaluations and heatmap reads cloud aggregates',async({page})=>{
 const s=await setup(page);
 await page.goto('./#/quiz?q=q-901');
 await page.getByPlaceholder('用自己的话作答…').fill('销毁时退订');
 await page.getByRole('button',{name:'提交并查看参考答案'}).click();
 await page.getByRole('button',{name:'AI 评估我的回答'}).click();
 await expect(page.getByText('遗漏了禁用时的退订')).toBeVisible();
 await page.goto('./#/review/weak');
 const insights=page.getByRole('region',{name:'AI 评估中的薄弱点'});
 await expect(insights.getByText('事件退订',{exact:true})).toBeVisible();
 await expect(insights.getByText('均分 58')).toBeVisible();
 await insights.getByRole('button',{name:'生成 AI 学习建议'}).click();
 await expect(insights.getByText('把销毁和禁用混为一谈')).toBeVisible();
 await expect(insights.getByRole('link',{name:'事件订阅与生命周期'}).first()).toBeVisible();
 await page.goto('./#/');
 await expect(page.getByText('云端作答记录')).toBeVisible();
 await expect.poll(()=>s.rpc.calendar?.p_tz).toBeTruthy();
 await expect(page.getByRole('button',{name:/· 3 次 · 2 题 · 平均评分 4\.0 · AI 均分 76 · 模拟面试 1 场$/})).toBeVisible();
});

test('submitted answers stay visible and a weak follow-up becomes a private draft question',async({page})=>{
 const s=await setup(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1440,height:1000});await page.goto('./#/quiz?q=q-901');
 await page.getByPlaceholder('用自己的话作答…').fill('对象销毁时在 OnDestroy 退订');
 await page.getByRole('button',{name:'提交并查看参考答案'}).click();
 const mine=page.locator('details.submission-card').first();
 await expect(mine).toContainText('对象销毁时在 OnDestroy 退订');
 await page.getByRole('button',{name:'AI 评估我的回答'}).click();
 await page.getByRole('textbox',{name:'回答追问'}).fill('好像也是 OnDestroy');
 await page.getByRole('button',{name:'回答追问',exact:true}).click();
 await expect(page.getByText('这轮追问回答得分 45')).toBeVisible();
 await expect(page.getByText(/掌握不牢（45 分）/)).toBeVisible();
 await page.getByRole('button',{name:'加入题库'}).click();
 await page.getByRole('combobox',{name:'生成题型'}).selectOption('single_choice');
 await page.getByRole('button',{name:'生成题目'}).click();
 await expect(page.getByRole('textbox',{name:'标题'})).toHaveValue('禁用时的事件退订时机');
 expect(s.drafts[0]).toEqual({action:'draft-question',evaluationId:s.evaluations[1].id,type:'single_choice'});
 await page.screenshot({path:'test-results/ai-follow-up-draft.png',fullPage:true});
 await page.getByRole('button',{name:'保存到题库（私有草稿）'}).click();
 await expect(page.getByText('已加入题库：')).toBeVisible();
 expect(s.created).toHaveLength(1);
 expect(s.created[0]).toMatchObject({type:'single_choice',status:'draft',visibility:'private',origin_kind:'follow_up',origin_evaluation_id:s.evaluations[1].id,category_id:'c',source_title:'AI 追问 · 事件订阅与生命周期'});
 expect(s.solutions.at(-1).solution.correctOptionIds).toEqual(['a']);
 // The practice screen stayed mounted through the silent list refresh.
 await expect(mine).toContainText('对象销毁时在 OnDestroy 退订');
 await page.getByRole('button',{name:'良好',exact:true}).click();
 await page.goto('./#/review/history');
 await page.getByText('我的回答').first().click();
 await expect(page.getByText('对象销毁时在 OnDestroy 退订')).toBeVisible();
 expect(errors).toEqual([]);
});

test('weakness card drafts targeted questions and saves only the ticked ones',async({page})=>{
 const s=await setup(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1280,height:900});
 await page.goto('./#/quiz?q=q-901');
 await page.getByPlaceholder('用自己的话作答…').fill('销毁时退订');
 await page.getByRole('button',{name:'提交并查看参考答案'}).click();
 await page.getByRole('button',{name:'AI 评估我的回答'}).click();
 await expect(page.getByText('遗漏了禁用时的退订')).toBeVisible();
 await page.goto('./#/review/weak');
 const card=page.locator('article.weakness-card',{hasText:'事件退订'});
 await card.getByRole('button',{name:'针对性出题'}).click();
 await card.getByRole('button',{name:'生成题目'}).click();
 await expect(card.getByRole('textbox',{name:'标题'}).first()).toHaveValue('哪些回调适合成对订阅与退订');
 expect(s.drafts.at(-1)).toEqual({action:'draft-weakness-questions',tag:'事件退订',count:2,types:'auto'});
 await expect(card.getByText('语言：C#')).toBeVisible();
 // The open generator spans the full grid row.
 const width=await card.evaluate(el=>el.getBoundingClientRect().width/el.parentElement.getBoundingClientRect().width);
 expect(width).toBeGreaterThan(0.95);
 await page.screenshot({path:'test-results/ai-weakness-drafts.png',fullPage:true});
 await card.getByRole('checkbox',{name:/保存第 1 道/}).uncheck();
 await card.getByRole('button',{name:'保存选中的 1 道（私有草稿）'}).click();
 await expect(card.getByText('已保存为私有草稿：')).toBeVisible();
 expect(s.created).toHaveLength(1);
 expect(s.created[0]).toMatchObject({type:'algorithm',status:'draft',visibility:'private',origin_kind:'weakness',origin_weakness_tag:'事件退订',origin_evaluation_id:null,category_id:'c'});
 expect(s.solutions.at(-1).solution.referenceAnswerMd).toContain('参考实现');
 await expect(card.getByText('已为此薄弱点出过 1 道')).toBeVisible();
 await expect(card.getByRole('textbox',{name:'标题'})).toHaveValue('哪些回调适合成对订阅与退订');
 expect(errors).toEqual([]);
});
