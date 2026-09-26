/* global Deno */
import { costOf, createMeter, normalizeUsage, recordUsage, validatePricing } from './usage.js';
import { callModel, iterateChatEvents, openChatStream } from './modelClient.js';
import { BUILT_IN_PRICES, DEFAULT_USD_TO_CNY, deepSeekPeak, priceAt } from './prices.js';
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
 eq(meter.summary({models:{flash:price,luna:price}}),{input:1500,cached:1000,output:150,reasoning:0,calls:2,cost:Number(((1000*0.5+100*8+500*2+50*8)/1e6).toFixed(6))},'priced');
 eq(meter.summary({models:{flash:price}}).cost,null,'one unpriced model hides the total');
 eq(createMeter().summary({}),null,'no calls');
});

Deno.test('validates the price table', () => {
 eq(validatePricing({'deepseek-flash':{input:'2',cached:0.2,output:8}}),{models:{'deepseek-flash':{input:2,cached:0.2,output:8}}},'a flat map is read as models');
 eq(validatePricing({rate:'7.2',models:{}}),{rate:7.2,models:{}},'rate');
 eq(validatePricing(null),null,'cleared');
 for (const bad of [{rate:0},{rate:'x'},{models:[]},[],{'bad model':{input:1,cached:1,output:1}},{m:{input:-1,cached:0,output:0}},{m:{input:1,cached:1}},Object.fromEntries(Array.from({length:13},(_,i)=>[`m${i}`,{input:1,cached:1,output:1}]))]) {
  let threw=false;try{validatePricing(bad);}catch(e){threw=e.message.startsWith('无效价格表');}
  if(!threw)throw Error(`accepted ${JSON.stringify(bad).slice(0,40)}`);
 }
});

Deno.test('records one row per call and never throws', async () => {
 const meter=createMeter();
 meter.add({provider:'deepseek',model:'flash',usage:{prompt_tokens:10,completion_tokens:5}});
 let rows=null;
 await recordUsage({from:()=>({insert:async(r)=>{rows=r;return {error:null};}})},{userId:'u',action:'evaluate',requestId:'not-a-uuid',meter,pricing:{models:{flash:{input:1,cached:1,output:1}}}});
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

Deno.test('knows DeepSeek peak hours in Beijing time', () => {
 // 2026-09-28 is a Monday.
 eq(deepSeekPeak('2026-09-28T01:30:00Z'),true,'Mon 09:30');
 eq(deepSeekPeak('2026-09-28T04:30:00Z'),false,'Mon 12:30 lunch');
 eq(deepSeekPeak('2026-09-28T09:59:00Z'),true,'Mon 17:59');
 eq(deepSeekPeak('2026-09-28T10:00:00Z'),false,'Mon 18:00');
 eq(deepSeekPeak('2026-09-27T02:00:00Z'),false,'Sunday');
 eq(deepSeekPeak('2026-09-26T17:00:00Z'),false,'Sun 01:00 Beijing (Sat UTC)');
});

Deno.test('prices calls from the built-in table, off-peak and overrides', () => {
 const peak='2026-09-28T02:00:00Z', night='2026-09-28T16:00:00Z';
 eq(priceAt('deepseek-flash',peak,null),{input:2,cached:0.04,output:8},'deepseek peak');
 eq(priceAt('deepseek-flash',night,null),{input:1,cached:0.02,output:4},'deepseek off-peak');
 const luna=BUILT_IN_PRICES['gpt-6-luna'];
 eq(priceAt('gpt-6-luna',peak,null),{input:luna.input*DEFAULT_USD_TO_CNY,cached:luna.cached*DEFAULT_USD_TO_CNY,output:luna.output*DEFAULT_USD_TO_CNY},'usd at default rate');
 eq(priceAt('gpt-6-sol',peak,{rate:7}).output,70,'usd at saved rate');
 eq(priceAt('deepseek-flash',night,{models:{'deepseek-flash':{input:4,cached:0.1,output:16}}}),{input:2,cached:0.05,output:8},'override keeps off-peak');
 eq(priceAt('mystery',peak,null),null,'unknown model');
 eq(priceAt('mystery',peak,{models:{mystery:{input:1,cached:1,output:1}}}),{input:1,cached:1,output:1},'override prices an unknown model');
});

import { FX_TTL_MS, resetFxCache, usdToCny } from './fx.js';
Deno.test('fetches USD to CNY, falls back, validates and caches', async () => {
 resetFxCache();
 const calls=[];
 const ok=(body)=>new Response(JSON.stringify(body),{status:200});
 let fetchImpl=async(url)=>{calls.push(url);return url.includes('frankfurter')?ok({date:'2026-09-25',rates:{CNY:6.7132}}):ok({});};
 eq(await usdToCny({fetchImpl,now:0}),{rate:6.7132,date:'2026-09-25',source:'欧洲央行（Frankfurter）'},'primary');
 eq(await usdToCny({fetchImpl,now:FX_TTL_MS-1}),{rate:6.7132,date:'2026-09-25',source:'欧洲央行（Frankfurter）'},'cached');
 eq(calls.length,1,'one fetch within the ttl');
 fetchImpl=async(url)=>url.includes('frankfurter')?new Response('',{status:503}):ok({time_last_update_utc:'Sat, 26 Sep 2026 00:02:32 +0000',rates:{CNY:6.72}});
 eq(await usdToCny({fetchImpl,now:FX_TTL_MS+1}),{rate:6.72,date:'2026-09-26',source:'ExchangeRate-API'},'fallback source');
 fetchImpl=async()=>ok({rates:{CNY:720}});
 eq((await usdToCny({fetchImpl,now:3*FX_TTL_MS})).rate,6.72,'implausible rate keeps the last good one');
 resetFxCache();
 fetchImpl=async()=>{throw new TypeError('offline');};
 eq(await usdToCny({fetchImpl,now:0}),{rate:DEFAULT_USD_TO_CNY,date:null,source:'默认值'},'default before any success');
});
