import { it,expect,vi,beforeEach } from 'vitest';
import { act,render,screen,waitFor } from '@testing-library/react';
import { AuthProvider,useAuth } from './AuthContext';
const mock=vi.hoisted(()=>({listener:null,resolve:null}));
vi.mock('@/lib/supabase',()=>({isSupabaseConfigured:true,supabase:{
 auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:fn=>{mock.listener=fn;return {data:{subscription:{unsubscribe:()=>{}}}};}},
 rpc:()=>({then:resolve=>{mock.resolve=resolve;}}),
}}));
beforeEach(()=>{mock.resolve=null;sessionStorage.clear();});
function Probe(){const a=useAuth();return <><div>{a.user?.id ?? 'anonymous'}:{String(a.isAdmin)}</div>{a.isAdmin && !a.loading && <input aria-label="ongoing work" defaultValue="draft"/>}</>;}
it('rejects stale admin lookup after signout',async()=>{
 render(<AuthProvider><Probe/></AuthProvider>);
 await waitFor(()=>expect(screen.getByText('anonymous:false')).toBeVisible());
 await act(async()=>mock.listener('SIGNED_IN',{user:{id:'admin'}}));
 await waitFor(()=>expect(mock.resolve).toBeTypeOf('function'));
 const resolve=mock.resolve;
 await act(async()=>mock.listener('SIGNED_OUT',null));
 await act(async()=>resolve({data:true,error:null}));
 expect(screen.getByText('anonymous:false')).toBeVisible();
});
it('keeps mounted work across focus and token refresh, but revokes on explicit false',async()=>{
 render(<AuthProvider><Probe/></AuthProvider>);
 await act(async()=>mock.listener('SIGNED_IN',{user:{id:'admin'}}));
 await waitFor(()=>expect(mock.resolve).toBeTypeOf('function'));
 await act(async()=>mock.resolve({data:true,error:null}));
 const input=screen.getByLabelText('ongoing work');input.value='my follow-up';
 for(const event of ['SIGNED_IN','TOKEN_REFRESHED']){
  mock.resolve=null;
  await act(async()=>mock.listener(event,{user:{id:'admin'}}));
  expect(screen.getByLabelText('ongoing work')).toBe(input);
  await waitFor(()=>expect(mock.resolve).toBeTypeOf('function'));
  await act(async()=>mock.resolve({data:null,error:{message:'offline'}}));
  expect(screen.getByLabelText('ongoing work')).toHaveValue('my follow-up');
 }
 mock.resolve=null;
 await act(async()=>mock.listener('SIGNED_IN',{user:{id:'admin'}}));
 await waitFor(()=>expect(mock.resolve).toBeTypeOf('function'));
 await act(async()=>mock.resolve({data:false,error:null}));
 expect(screen.queryByLabelText('ongoing work')).toBeNull();
});
it('hides old work immediately on account switch and clears tab drafts',async()=>{
 render(<AuthProvider><Probe/></AuthProvider>);
 await act(async()=>mock.listener('SIGNED_IN',{user:{id:'admin'}}));
 await waitFor(()=>expect(mock.resolve).toBeTypeOf('function'));
 await act(async()=>mock.resolve({data:true,error:null}));
 sessionStorage.setItem('iqb:ai-draft:admin:q','private');
 await act(async()=>mock.listener('SIGNED_IN',{user:{id:'other'}}));
 expect(screen.queryByLabelText('ongoing work')).toBeNull();
 expect(sessionStorage.getItem('iqb:ai-draft:admin:q')).toBeNull();
});
