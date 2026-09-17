import { it,expect,vi } from 'vitest';
import { act,render,screen,waitFor } from '@testing-library/react';
import { AuthProvider,useAuth } from './AuthContext';
const mock=vi.hoisted(()=>({listener:null,resolve:null}));
vi.mock('@/lib/supabase',()=>({isSupabaseConfigured:true,supabase:{
 auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:fn=>{mock.listener=fn;return {data:{subscription:{unsubscribe:()=>{}}}};}},
 rpc:()=>({then:resolve=>{mock.resolve=resolve;}}),
}}));
function Probe(){const a=useAuth();return <div>{a.user?.id ?? 'anonymous'}:{String(a.isAdmin)}</div>;}
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
