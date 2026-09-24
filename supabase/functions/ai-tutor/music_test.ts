import {handleRequest} from './index.ts';
import catalog from './musicCatalog.json' with {type:'json'};
import {COMPOSITION_VERSION,contextHash,handleMusic,musicContext,musicHistory,musicMessages,ROUTER_PHASE,validateSubject} from './music.ts';
const assert=(x:unknown,message='assertion failed')=>{if(!x)throw Error(message);};
const lesson=catalog.lessons[0];
const input={action:'music-chat',requestId:'20000000-0000-0000-0000-000000000001',kind:'lesson',subjectId:lesson.id,subjectVersion:lesson.version,message:'为什么 E 和 F 之间没有黑键？',context:{stats:{quizDone:1,quizTotal:3,attempts:4,correct:2}}};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status});
type Seen={tables:string[];rpcs:{name:string;args:any}[];updates:any[]};
function db({duplicate=false,status='complete',beginError='',history=[] as any[]}={}){
 const seen:Seen={tables:[],rpcs:[],updates:[]};
 const chain=(table:string)=>{
  let updating=false;
  const c:any={select(){return c;},eq(){return c;},lt(){return c;},order(){return c;},
   update(patch:any){updating=true;seen.updates.push({table,patch});return c;},
   limit:async()=>({data:history,error:null}),
   then(resolve:any){resolve({data:updating?[{body:'saved'}]:[],error:null});}};
  return c;
 };
 return {seen,from:(table:string)=>{seen.tables.push(table);return chain(table);},
  rpc:async(name:string,args:any)=>{seen.rpcs.push({name,args});if(beginError)return {data:null,error:{message:beginError}};return {data:name==='music_clear'?2:{duplicate,message:{status,body:'saved answer',model:'m'}},error:null};}};
}
const tutor=(body='回答',calls={n:0})=>async(messages:unknown[],meta:any)=>{calls.n++;return {body,execution:{model:'deepseek-flash',provider:'deepseek',tier:'fast'},decision:{pedagogyAction:'EXPLAIN'},messages,meta};};

for(const action of ['music-chat','music-history','music-clear'])Deno.test(`${action}: anonymous and non-admin rejected before service client`,async()=>{
 let calls=0;const factory=()=>{calls++;return {auth:{getUser:async()=>({data:{user:{id:'visitor'}},error:null})},rpc:async()=>({data:false,error:null})};};
 const request=(auth:boolean)=>new Request('http://localhost',{method:'POST',headers:auth?{Authorization:'Bearer synthetic'}:{},body:JSON.stringify({...input,action})});
 const anonymous=await handleRequest(request(false),factory as any);const afterAnonymous=calls;const denied=await handleRequest(request(true),factory as any);
 assert(anonymous.status===401);assert(afterAnonymous===0);assert(denied.status===403);assert(calls===1);
});
Deno.test('unknown music action is rejected',async()=>{const r=await handleMusic({...input,action:'music-arrange'},{uid:'a',db:db(),json});assert(r.status===400);});
Deno.test('subject validation: kinds, lesson ids and catalog versions',()=>{
 assert(validateSubject(input).lesson?.id===lesson.id);
 const fails=(value:any,status=400)=>{try{validateSubject(value);}catch(e:any){return e.status===status;}return false;};
 assert(fails({...input,kind:'arrangement'}),'arrangement is not a chat kind yet');
 assert(fails({...input,subjectId:'missing-lesson'}));
 assert(fails({...input,subjectId:'../x'}));
 assert(fails({...input,subjectVersion:'stale'},409),'stale catalog version is a settled 409');
 assert(validateSubject({kind:'composition',subjectId:'draft',subjectVersion:COMPOSITION_VERSION}).lesson===null);
 assert(fails({kind:'composition',subjectId:'draft',subjectVersion:'score-v0'}));
 assert(validateSubject({kind:'homework',subjectId:lesson.id},{requireVersion:false}).subjectVersion===lesson.version);
});
Deno.test('stale catalog version never reaches the database',async()=>{const database=db();const r=await handleMusic({...input,subjectVersion:'old'},{uid:'a',db:database,json,completeTutorText:tutor()});assert(r.status===409);assert((await r.json()).settled===true);assert(database.seen.rpcs.length===0);});
Deno.test('context keeps only whitelisted fields and bounds sizes',()=>{
 const lessonCtx=musicContext('lesson',{stats:{attempts:3,correct:9e9,quizDone:-1},system:'SENTINEL'});
 assert(!JSON.stringify(lessonCtx).includes('SENTINEL'));assert((lessonCtx as any).stats.quizDone===0);
 const hw=musicContext('homework',{tasks:[true,'yes',false,...Array(20).fill(true)],journal:[{text:'a'},{text:'b'},{text:'c'},{text:'d'.repeat(5000),bpm:500}]}) as any;
 assert(hw.tasks.length===12&&hw.tasks[1]===false);assert(hw.journal.length===3&&hw.journal[2].text.length===1200&&hw.journal[2].bpm===200);
 const bad=(kind:string,value:unknown)=>{try{musicContext(kind,value);}catch{return true;}return false;};
 assert(bad('composition',{abc:''}));assert(bad('composition',{abc:'x'.repeat(12001)}));assert(bad('lesson',{big:'x'.repeat(17000)}));assert(bad('lesson',[]));
 assert((musicContext('composition',{abc:'X:1\nK:C\nCDEF|',title:'t',extra:1}) as any).extra===undefined);
});
Deno.test('system prompt: trusted catalog, no mastery claims, no quiz answers, no client system text',()=>{
 const messages=musicMessages('lesson',lesson,{note:'UNTRUSTED_SENTINEL'},'问题',[]) as any[];
 const system=messages[0].content;
 assert(system.includes('不能宣布用户已掌握'));assert(system.includes(lesson.title));
 assert(!system.includes('UNTRUSTED_SENTINEL'));assert(messages.at(-1).content.includes('UNTRUSTED_SENTINEL'));
 assert(!JSON.stringify(catalog).includes('中央 C 的记法是？'),'quiz prompts and answers stay out of the catalog');
 assert(!('questions' in lesson));
 const comp=musicMessages('composition',null,{abc:'K:C'},'点评',[]) as any[];
 assert(comp[0].content.includes('不是录音'));assert(!comp[0].content.includes('可信课程内容'));
});
Deno.test('router phase: homework is hint-first',()=>{assert(ROUTER_PHASE.homework==='hint');assert(ROUTER_PHASE.lesson==='review');assert(ROUTER_PHASE.composition==='review');});
Deno.test('history keeps completed turns only',()=>{
 const turn=(id:string,status='complete')=>[{request_id:id,role:'user',body:`q${id}`,status:'complete'},{request_id:id,role:'assistant',body:`a${id}`,status}];
 const h=musicHistory([...turn('1'),...turn('2','failed'),...turn('3')]);
 assert(h.messages.map(m=>m.content).join()==='q1,a1,q3,a3');assert(musicHistory([...turn('1')],{budget:1}).truncated);
});
Deno.test('context hash is stable across key order and changes with content',async()=>{
 const a=await contextHash({b:1,a:{d:2,c:3}}),b=await contextHash({a:{c:3,d:2},b:1});
 assert(a===b&&/^[0-9a-f]{64}$/.test(a));assert(a!==await contextHash({b:1,a:{d:2,c:4}}));
});
Deno.test('one request calls the model once, persists, and records routing',async()=>{
 const calls={n:0};const database=db();
 const r=await handleMusic(input,{uid:'a',db:database,json,completeTutorText:tutor('回答',calls)});
 assert(r.status===200);assert((await r.json()).body==='回答');assert(calls.n===1);
 const begin=database.seen.rpcs[0];assert(begin.name==='music_begin');assert(begin.args.p_kind==='lesson'&&begin.args.p_version===lesson.version&&/^[0-9a-f]{64}$/.test(begin.args.p_hash));
 assert(database.seen.updates.some(u=>u.patch.status==='complete'));assert(database.seen.updates.some(u=>u.patch.provider==='deepseek'));
});
Deno.test('the same payload produces the same hash, a changed payload a different one',async()=>{
 const one=db(),two=db(),three=db();
 await handleMusic(input,{uid:'a',db:one,json,completeTutorText:tutor()});await handleMusic(input,{uid:'a',db:two,json,completeTutorText:tutor()});
 await handleMusic({...input,message:'另一个问题'},{uid:'a',db:three,json,completeTutorText:tutor()});
 assert(one.seen.rpcs[0].args.p_hash===two.seen.rpcs[0].args.p_hash);assert(one.seen.rpcs[0].args.p_hash!==three.seen.rpcs[0].args.p_hash);
});
Deno.test('only music tables and music RPCs are touched',async()=>{
 const database=db();await handleMusic(input,{uid:'a',db:database,json,completeTutorText:tutor()});
 await handleMusic({...input,action:'music-history'},{uid:'a',db:database,json});await handleMusic({...input,action:'music-clear'},{uid:'a',db:database,json});
 assert(database.seen.tables.every(t=>t==='music_messages'),database.seen.tables.join());
 assert(database.seen.rpcs.every(r=>['music_begin','music_clear'].includes(r.name)));
});
Deno.test('completed duplicate returns the saved reply without calling the model',async()=>{const calls={n:0};const r=await handleMusic(input,{uid:'a',db:db({duplicate:true}),json,completeTutorText:tutor('new',calls)});const body=await r.json();assert(body.body==='saved answer'&&body.recovered===true);assert(calls.n===0);});
Deno.test('running duplicate stays unsettled; failed duplicate is settled',async()=>{
 const calls={n:0};
 const running=await handleMusic(input,{uid:'a',db:db({duplicate:true,status:'running'}),json,completeTutorText:tutor('x',calls)});
 assert(running.status===409&&(await running.json()).settled===false);
 const failed=await handleMusic(input,{uid:'a',db:db({duplicate:true,status:'failed'}),json,completeTutorText:tutor('x',calls)});
 assert(failed.status===409&&(await failed.json()).settled===true);assert(calls.n===0);
});
Deno.test('begin errors map to settled responses',async()=>{
 const run=async(error:string)=>{const r=await handleMusic(input,{uid:'a',db:db({beginError:error}),json,completeTutorText:tutor()});return {status:r.status,body:await r.json()};};
 assert((await run('request_context_conflict')).body.conflict===true);
 assert((await run('rate_limit')).status===429);assert((await run('generation_busy')).body.settled===true);
 assert((await run('admin_required')).status===403);assert((await run('connection reset')).body.settled===false);
});
Deno.test('permission revoked during generation withholds the reply',async()=>{const database=db();const r=await handleMusic(input,{uid:'a',db:database,json,completeTutorText:tutor('private result'),authorize:async()=>false});assert(r.status===403);assert(!(await r.text()).includes('private result'));assert(database.seen.updates.some(u=>u.patch.status==='failed'));});
Deno.test('upstream failure is persisted and settled, never retried',async()=>{let calls=0;const database=db();const r=await handleMusic(input,{uid:'a',db:database,json,completeTutorText:async()=>{calls++;throw Error('upstream_http_503');}});assert(r.status>=400);assert((await r.json()).settled===true);assert(calls===1);assert(database.seen.updates.some(u=>u.patch.status==='failed'));});
Deno.test('missing model key stops before any database write',async()=>{const database=db();const r=await handleMusic(input,{uid:'a',db:database,json});assert(r.status===503);assert(database.seen.rpcs.length===0);});
Deno.test('bad request id and empty message are rejected before the database',async()=>{
 for(const bad of [{requestId:'x'},{message:''},{message:'x'.repeat(4001)}]){const database=db();const r=await handleMusic({...input,...bad},{uid:'a',db:database,json,completeTutorText:tutor()});assert(r.status===400);assert(database.seen.rpcs.length===0);}
});
Deno.test('composition requests pass the score as untrusted data and a router subject',async()=>{
 let meta:any,msgs:any[]=[];const database=db();
 const r=await handleMusic({...input,kind:'composition',subjectId:'draft',subjectVersion:COMPOSITION_VERSION,context:{abc:'X:1\nT:夜曲\nK:C\nCDEF|',title:'夜曲',check:'ok'}},{uid:'a',db:database,json,completeTutorText:async(m:any[],x:any)=>{meta=x;msgs=m;return {body:'点评'};}});
 assert(r.status===200);assert(meta.phase==='review');assert(meta.subject.includes('夜曲'));assert(msgs.at(-1).content.includes('CDEF'));
});
