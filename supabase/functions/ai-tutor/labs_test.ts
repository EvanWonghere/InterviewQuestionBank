import {handleRequest} from './index.ts';
import {handleLab,labHistory,labMessages,validateLab} from './labs.ts';
const assert=(x:unknown,message='assertion failed')=>{if(!x)throw Error(message);};
const input={action:'lab-chat',labId:'cpp-dispatch',labVersion:1,requestId:'20000000-0000-0000-0000-000000000001',phase:'explain',message:'Why Base?',context:{prediction:'Base',parameters:{virtual:true,dynamic:'Derived',static:'Base'},observation:'Synthetic measurement',explanation:'test'}};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status});
for(const action of ['lab-chat','lab-history','lab-sync'])Deno.test(`${action}: anonymous and non-admin rejected before service client`,async()=>{
 let calls=0;const factory=()=>{calls++;return {auth:{getUser:async()=>({data:{user:{id:'visitor'}},error:null})},rpc:async()=>({data:false,error:null})};};
 const request=(auth:boolean)=>new Request('http://localhost',{method:'POST',headers:auth?{Authorization:'Bearer synthetic'}:{},body:JSON.stringify({...input,action})});
 const anonymous=await handleRequest(request(false),factory as any); const afterAnonymous=calls; const denied=await handleRequest(request(true),factory as any); console.log('DEBUG',action,anonymous.status,afterAnonymous,denied.status,calls);
 assert(anonymous.status===401);assert(afterAnonymous===0);assert(denied.status===403);assert(calls===1);
});
Deno.test('trusted catalog and bounded context, no client system prompt',()=>{const lab=validateLab(input);const messages=labMessages(lab,{...input,system:'UNTRUSTED_SYSTEM_SENTINEL',context:{...input.context,system:'UNTRUSTED_SYSTEM_SENTINEL'}},[]);assert(messages[0].content.includes('不能宣布掌握'));assert(!messages[0].content.includes('Synthetic measurement'));assert(!messages[0].content.includes('UNTRUSTED_SYSTEM_SENTINEL'));let failed=false;try{validateLab({...input,labVersion:200});}catch{failed=true;}assert(failed);});
Deno.test('predict phase withholds the explanation and the check rules',()=>{
 const lab=validateLab(input);
 const predict=labMessages(lab,{...input,phase:'predict'},[])[0].content;
 assert(!predict.includes(lab.explanation),'predict phase must not carry the answer');
 assert(!predict.includes(lab.checkRules[0]),'predict phase must not carry the grading rules');
 assert(predict.includes(lab.challenge),'the challenge itself is still needed');
 assert(labMessages(lab,input,[])[0].content.includes(lab.explanation),'explain phase keeps the explanation');
});
Deno.test('predict phase keeps the teaching skeleton and withholds the selected function',()=>{
 const lab=validateLab(input);
 const predict=labMessages(lab,{...input,phase:'predict'},[])[0].content;
 assert(predict.includes('Base* p = &object'),'coach must see the same pointer declaration');
 assert(!predict.includes('选中 Derived::speak'),'predict must not name the selected function');
 const explain=labMessages(lab,input,[])[0].content;
 assert(explain.includes('选中 Derived::speak'),'explain may name the selected function');
});
Deno.test('history keeps only completed turns of the current phase',()=>{
 const turn=(request:string,phase:string,status='complete')=>([
  {request_id:request,role:'user',body:`q-${request}`,status:'complete',phase},
  {request_id:request,role:'assistant',body:`a-${request}`,status,phase},
 ]);
 const rows=[...turn('1','explain'),...turn('2','predict'),...turn('3','predict','failed')];
 const predict=labHistory(rows,'predict');
 assert(predict.messages.length===2,'only the completed predict turn survives');
 assert(predict.messages[0].content==='q-2'&&predict.messages[1].content==='a-2');
 assert(labHistory(rows,'explain').messages.map(m=>m.content).join()==='q-1,a-1');
 assert(labHistory(rows,'predict',{budget:1}).truncated===true,'budget overflow is reported');
});
function db(duplicate:boolean,status='complete',seen?:{name?:string,args?:any}){
 let updates=0;const chain:any={select(){return this;},eq(){return this;},order(){return this;},limit:async()=>({data:[],error:null}),update(){updates++;return this;},then(resolve:any){resolve({data:[{body:'answer'}],error:null});}};
 return {from:()=>chain,rpc:async(name:string,args:any)=>{if(seen){seen.name=name;seen.args=args;}return {data:{duplicate,message:{status,body:'saved answer'}},error:null};},updates:()=>updates};
}
Deno.test('completed request returns saved reply without model invocation',async()=>{let calls=0;const result=await handleLab(input,{uid:'a',db:db(true),json,model:'test',callModel:async()=>{calls++;return 'new';}});assert((await result.json()).body==='saved answer');assert(calls===0);});
Deno.test('running duplicate cannot generate again',async()=>{let calls=0;const result=await handleLab(input,{uid:'a',db:db(true,'running'),json,model:'test',callModel:async()=>{calls++;return 'new';}});assert(result.status===409);assert((await result.json()).settled===false);assert(calls===0);});
Deno.test('one explicit request uses contextual model once and persists',async()=>{let calls=0;const database=db(false);const result=await handleLab(input,{uid:'a',db:database,json,model:'test',callModel:async(messages:any[])=>{calls++;assert(messages.at(-1).content.includes('Synthetic measurement'));return 'answer';}});assert(result.status===200);assert(calls===1);assert(database.updates()===1);});
Deno.test('request origin is persisted with the deduplication record',async()=>{const seen:{name?:string,args?:any}={};const database=db(false,'complete',seen);const result=await handleLab({...input,context:{...input.context,runId:'30000000-0000-0000-0000-000000000001',draftId:'draft-a'},draftId:'draft-a'},{uid:'a',db:database,json,model:'test',callModel:async()=> 'answer'});assert(result.status===200);assert(seen.name==='lab_begin');assert(seen.args.p_attempt==='30000000-0000-0000-0000-000000000001');assert(seen.args.p_draft==='draft-a');});
Deno.test('upstream failure is settled only after persistence, never retried',async()=>{let calls=0;const result=await handleLab(input,{uid:'a',db:db(false),json,model:'test',callModel:async()=>{calls++;throw Error('upstream_http_503');}});assert(result.status>=400);assert((await result.json()).settled===true);assert(calls===1);});
Deno.test('permission revoked during generation withholds reply',async()=>{const result=await handleLab(input,{uid:'a',db:db(false),json,model:'test',callModel:async()=>'private result',authorize:async()=>false});assert(result.status===403);assert(!(await result.text()).includes('private result'));});

const syncRun={id:'30000000-0000-0000-0000-000000000001',at:'2026-09-21T00:00:00.000Z',parameters:{virtual:true},prediction:'Derived',answer:'Derived',observation:{labId:'cpp-dispatch',labVersion:1},correct:true,assisted:false,explanation:'local'};
Deno.test('lab sync sends a CAS envelope and preserves explicit false flags',async()=>{
 let call:any;
 const fake={rpc:async(name:string,args:any)=>{call={name,args};return {data:{ok:true,runs:[],flags:args.p_flags?.flags,flagsRevision:4},error:null};}};
 const result=await handleLab({...input,action:'lab-sync',direction:'push',runs:[{id:syncRun.id,baseRevision:3,payload:syncRun}],flags:{flags:{seen:false,hint:true,independent:false,variant:false},baseRevision:4}},{uid:'a',db:fake,json});
 assert(result.status===200);assert(call.name==='lab_sync');assert(call.args.p_runs[0].baseRevision===3);assert(call.args.p_flags.flags.seen===false);assert(call.args.p_flags.flags.independent===false);
});
Deno.test('lab sync rejects malformed revisions before touching the database',async()=>{
 let called=false;
 const fake={rpc:async()=>{called=true;return {data:{},error:null};}};
 const result=await handleLab({...input,action:'lab-sync',direction:'push',runs:[{id:syncRun.id,baseRevision:-1,payload:syncRun}]},{uid:'a',db:fake,json});
 assert(result.status===400);assert(!called);
});
