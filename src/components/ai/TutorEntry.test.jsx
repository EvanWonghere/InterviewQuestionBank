import { describe,it,expect,vi,beforeEach } from 'vitest';
import { render,screen,fireEvent,waitFor,cleanup } from '@testing-library/react';
import TutorEntry from './TutorEntry';
const state=vi.hoisted(()=>({auth:{},loaded:vi.fn()}));
vi.mock('@/context/AuthContext',()=>({useAuth:()=>state.auth}));
vi.mock('./TutorPanel',()=>({default: props=>{state.loaded();return <div>Loaded tutor {props.question.id}</div>;}}));
beforeEach(()=>{cleanup();state.loaded.mockClear();});
describe('admin-only lazy entry',()=>{
 it.each([{user:null,isAdmin:false},{user:{id:'u'},isAdmin:false},{user:{id:'u'},isAdmin:true,loading:true}])('does not load before verified admin',auth=>{
  state.auth=auth;render(<TutorEntry enabled question={{id:'q'}}/>);
  expect(screen.queryByRole('button')).toBeNull();expect(state.loaded).not.toHaveBeenCalled();
 });
 it('loads on explicit open and removes on signout',async()=>{
  state.auth={user:{id:'admin'},isAdmin:true,loading:false};
  const {rerender}=render(<TutorEntry enabled question={{id:'q'}}/>);
  expect(state.loaded).not.toHaveBeenCalled();fireEvent.click(screen.getByText('问学习助手'));
  await waitFor(()=>expect(screen.getByText('Loaded tutor q')).toBeVisible());
  state.auth={user:null,isAdmin:false,loading:false};rerender(<TutorEntry enabled question={{id:'q'}}/>);
  expect(screen.queryByText('Loaded tutor q')).toBeNull();
 });
 it('suppresses entry during mock interview',()=>{
  state.auth={user:{id:'admin'},isAdmin:true};render(<TutorEntry enabled={false} question={{id:'q'}}/>);
  expect(screen.queryByRole('button')).toBeNull();
 });
});

it('unregisters the pet opener and closes an open tutor when disabled', async () => {
 const { usePetStore } = await import('@/store/petStore');
 state.auth={user:{id:'admin'},isAdmin:true,loading:false};
 const {rerender}=render(<TutorEntry primary enabled question={{id:'q'}}/>);
 expect(usePetStore.getState().opener).toBeTypeOf('function');
 fireEvent.click(screen.getByText('问学习助手'));
 await waitFor(()=>expect(screen.getByText('Loaded tutor q')).toBeVisible());
 rerender(<TutorEntry primary enabled={false} question={{id:'q'}}/>);
 expect(screen.queryByText('Loaded tutor q')).toBeNull();
 expect(usePetStore.getState().opener).toBeNull();
});
