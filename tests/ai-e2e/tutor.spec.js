import { test, expect } from '@playwright/test';
const uid='00000000-0000-0000-0000-000000000001';
const questions=[1,2].map(n=>({id:`10000000-0000-0000-0000-${String(n).padStart(12,'0')}`,legacy_id:`q-90${n}`,category_id:'c',type:'short_answer',title:n===1?'事件订阅与生命周期':'服务器权威与状态同步',prompt_md:'请解释机制并给出一个项目中的边界例子。',difficulty:'medium',payload:{},question_tags:[],sort_order:n,status:'published',visibility:'public'}));
async function setup(page,{admin=true,loggedIn=true,configured=true}={}) {
 const state={messages:{},chats:[],attempts:[],notes:[],calls:[],fail:false,slow:false};
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
  if(path.endsWith('/rpc/is_app_admin'))return reply(admin);
  if(path.endsWith('/rpc/grade_question'))return reply({correct:null,referenceAnswerMd:'发布者持有订阅者引用；销毁时退订，避免重复回调。',rubricMd:'说明生命周期与退订。',explanationMd:''});
  if(path.endsWith('/questions'))return reply(questions);
  if(path.endsWith('/categories'))return reply([{id:'c',name:'Unity基础',slug:'unity',sort_order:1}]);
  if(path.endsWith('/attempts')){if(route.request().method()==='POST')state.attempts.push(input);return reply(state.attempts);}
  if(path.endsWith('/notes')){if(route.request().method()==='POST')state.notes=[input];return reply(state.notes);}
  if(path.endsWith('/review_states'))return reply([]);
  if(path.endsWith('/functions/v1/ai-tutor')) {
   state.calls.push(input.action);
   if(!admin)return reply({error:'仅管理员可用'},403);
   if(input.action==='settings')return reply({configured,settings:{base_url:'https://model.example.test/v1',model:'synthetic-tutor'},allowedOrigins:['https://model.example.test']});
   if(input.action==='history')return reply({messages:state.messages[input.questionId]??[],versionChanged:false});
   if(input.action==='clear'){state.messages[input.questionId]=[];return reply({ok:true});}
   if(input.action==='append-note'){state.notes=[{question_id:input.questionId,body_md:`原有笔记\n\n${input.body}`}];return reply({body:state.notes[0].body_md});}
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
