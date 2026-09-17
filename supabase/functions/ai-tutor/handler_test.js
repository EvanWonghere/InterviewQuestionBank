import { handleRequest } from './index.ts';
const req=()=>new Request('http://localhost',{method:'POST',headers:{Authorization:'Bearer fake'},body:JSON.stringify({action:'settings'})});
Deno.test('anonymous request stops before any client creation',async()=>{
 const res=await handleRequest(new Request('http://localhost',{method:'POST'}),()=>{throw Error('must not reach db');});
 if(res.status!==401)throw Error('expected401');
});
Deno.test('non-admin cannot create service client',async()=>{
 let calls=0;
 const fake=()=>{calls++;return {auth:{getUser:async()=>({data:{user:{id:'user'}},error:null})},rpc:async()=>({data:false,error:null})};};
 const res=await handleRequest(req(),fake);
 if(res.status!==403||calls!==1)throw Error('permission bypass');
});
Deno.test('expired token cannot check admin or access service role',async()=>{
 const fake=()=>({auth:{getUser:async()=>({data:{user:null},error:Error('expired')})},rpc:()=>{throw Error('must not query');}});
 const res=await handleRequest(req(),fake);if(res.status!==401)throw Error('expected401');
});
for (const action of ['evaluate','interview-report','weakness-report','draft-question','draft-weakness-questions']) {
 Deno.test(`${action} is admin-only before any service client`,async()=>{
  let calls=0;
  const fake=()=>{calls++;return {auth:{getUser:async()=>({data:{user:{id:'user'}},error:null})},rpc:async()=>({data:false,error:null})};};
  const res=await handleRequest(new Request('http://localhost',{method:'POST',headers:{Authorization:'Bearer fake'},body:JSON.stringify({action})}),fake);
  if(res.status!==403||calls!==1)throw Error('permission bypass');
 });
}
