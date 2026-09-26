/* global Deno */
import { costOf, createMeter, normalizeUsage, recordUsage, validatePricing } from './usage.js';
import { callModel, iterateChatEvents, openChatStream } from './modelClient.js';
const eq=(a,b,msg)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw Error(`${msg}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);};

Deno.test('normalizes DeepSeek and OpenAI usage', () => {
 eq(normalizeUsage({prompt_tokens:1000,prompt_cache_hit_tokens:800,prompt_cache_miss_tokens:200,completion_tokens:300,completion_tokens_details:{reasoning_tokens:200}}),{input:1000,cached:800,output:300,reasoning:200},'deepseek');
 eq(normalizeUsage({prompt_tokens:1500,prompt_tokens_details:{cached_tokens:1024},completion_tokens:90}),{input:1500,cached:1024,output:90,reasoning:0},'openai');
 eq(normalizeUsage({prompt_tokens:10,prompt_cache_hit_tokens:99,completion_tokens:5,completion_tokens_details:{reasoning_tokens:50}}),{input:10,cached:10,output:5,reasoning:5},'clamped');
 eq(normalizeUsage(null),null,'none');
 eq(normalizeUsage({prompt_tokens:0,completion_tokens:0}),null,'empty');
});

Deno.test('prices cached input separately and sums a request', () => {
 const price={input:2,cached:0.5,output:8};
 eq(costOf({input:1000,cached:800,output:300,reasoning:200},price),(200*2+800*0.5+300*8)/1e6,'cost');
 eq(costOf({input:1,cached:0,output:1,reasoning:0},undefined),null,'unpriced');
 const meter=createMeter();
 meter.add({provider:'deepseek',model:'flash',usage:{prompt_tokens:1000,prompt_cache_hit_tokens:1000,completion_tokens:100}});
 meter.add({provider:'openai',model:'luna',usage:{prompt_tokens:500,completion_tokens:50}});
 eq(meter.summary({flash:price,luna:price}),{input:1500,cached:1000,output:150,reasoning:0,calls:2,cost:Number(((1000*0.5+100*8+500*2+50*8)/1e6).toFixed(6))},'priced');
 eq(meter.summary({flash:price}).cost,null,'one unpriced model hides the total');
 eq(createMeter().summary({}),null,'no calls');
});

Deno.test('validates the price table', () => {
 eq(validatePricing({'deepseek-flash':{input:'2',cached:0.2,output:8}}),{'deepseek-flash':{input:2,cached:0.2,output:8}},'ok');
 eq(validatePricing(null),null,'cleared');
 for (const bad of [[],{'bad model':{input:1,cached:1,output:1}},{m:{input:-1,cached:0,output:0}},{m:{input:1,cached:1}},Object.fromEntries(Array.from({length:13},(_,i)=>[`m${i}`,{input:1,cached:1,output:1}]))]) {
  let threw=false;try{validatePricing(bad);}catch(e){threw=e.message.startsWith('无效价格表');}
  if(!threw)throw Error(`accepted ${JSON.stringify(bad).slice(0,40)}`);
 }
});

Deno.test('records one row per call and never throws', async () => {
 const meter=createMeter();
 meter.add({provider:'deepseek',model:'flash',usage:{prompt_tokens:10,completion_tokens:5}});
 let rows=null;
 await recordUsage({from:()=>({insert:async(r)=>{rows=r;return {error:null};}})},{userId:'u',action:'evaluate',requestId:'not-a-uuid',meter,pricing:{flash:{input:1,cached:1,output:1}}});
 eq(rows,[{user_id:'u',action:'evaluate',request_id:null,provider:'deepseek',model:'flash',input_tokens:10,cached_tokens:0,output_tokens:5,reasoning_tokens:0,cost:0.000015}],'row');
 await recordUsage({from:()=>({insert:async()=>{throw Error('db down');}})},{userId:'u',action:'x',meter,pricing:null});
});

Deno.test('callModel reports usage of a successful call only', async () => {
 const seen=[];
 const ok=async()=>new Response(JSON.stringify({choices:[{message:{content:'{"ok":1}'},finish_reason:'stop'}],usage:{prompt_tokens:7,completion_tokens:3}}),{status:200});
 await callModel({url:'https://api.deepseek.com/chat/completions',apiKey:'k',model:'flash',provider:'deepseek',messages:[],effort:'none',fetchImpl:ok,onUsage:(u)=>seen.push(u)});
 eq(seen,[{provider:'deepseek',model:'flash',usage:{prompt_tokens:7,completion_tokens:3}}],'reported');
 const fail=async()=>new Response('{}',{status:500});
 try{await callModel({url:'https://api.deepseek.com/chat/completions',apiKey:'k',model:'flash',provider:'deepseek',messages:[],effort:'none',fetchImpl:fail,onUsage:(u)=>seen.push(u)});}catch{/* expected */}
 eq(seen.length,1,'failed call not reported');
});

Deno.test('streams ask for usage and yield the usage chunk', async () => {
 let sent=null;
 const sse=['data: {"choices":[{"delta":{"content":"hi"}}]}','data: {"choices":[{"delta":{},"finish_reason":"stop"}]}','data: {"choices":[],"usage":{"prompt_tokens":9,"completion_tokens":2}}','data: [DONE]'].join('\n\n')+'\n\n';
 const fetchImpl=async(_url,init)=>{sent=JSON.parse(init.body);return new Response(sse,{status:200,headers:{'Content-Type':'text/event-stream'}});};
 const res=await openChatStream({url:'https://api.openai.com/v1/chat/completions',apiKey:'k',model:'luna',messages:[],effort:'low',signal:AbortSignal.timeout(5000),fetchImpl});
 eq(sent.stream_options,{include_usage:true},'stream_options');
 const usages=[];let text='';
 for await (const e of iterateChatEvents(res.body)){text+=e.text;if(e.usage)usages.push(e.usage);}
 eq(text,'hi','text');eq(usages,[{prompt_tokens:9,completion_tokens:2}],'usage');
});
