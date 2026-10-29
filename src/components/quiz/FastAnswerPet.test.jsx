import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import QuestionCard from './QuestionCard';
import { usePetStore } from '@/store/petStore';

vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'admin' }, isAdmin: true, loading: false }) }));
vi.mock('@/components/ai/TutorPanel', async () => {
  const { useEffect } = await import('react');
  const { usePetStore } = await import('@/store/petStore');
  function FakeTutorPanel() {
    useEffect(() => { usePetStore.getState().setPanelOpen(true); return () => usePetStore.getState().setPanelOpen(false); }, []);
    return <div>模拟已打开的助手</div>;
  }
  return { default: FakeTutorPanel };
});
vi.mock('@/components/common/Markdown', () => ({ default: ({ content }) => <div>{content}</div> }));
vi.mock('./ConceptLabLinks', () => ({ default: () => null }));
vi.mock('./NoteEditor', () => ({ default: () => null }));
vi.mock('@/components/ai/EvaluationEntry', () => ({ default: () => null }));
const question = { id: 'q', type: 'short_answer', title: '题目', question: '题干', payload: {}, solution: { referenceAnswerMd: '参考' } };
beforeEach(() => usePetStore.setState({ opener: null, panelOpen: false }));
afterEach(cleanup);

it('unregisters the pet opener and closes an open tutor on switching to fast mode', async () => {
  const { rerender } = render(<QuestionCard question={question} />);
  expect(usePetStore.getState().opener).toBeTypeOf('function');
  fireEvent.click(screen.getByRole('button', { name: '问学习助手' }));
  expect(await screen.findByText('模拟已打开的助手')).toBeVisible();
  expect(usePetStore.getState().panelOpen).toBe(true);
  rerender(<QuestionCard question={question} fast />);
  await waitFor(() => expect(usePetStore.getState().panelOpen).toBe(false));
  expect(usePetStore.getState().opener).toBeNull();
  expect(screen.queryByText('模拟已打开的助手')).toBeNull();
  rerender(<QuestionCard question={question} />);
  expect(usePetStore.getState().opener).toBeTypeOf('function');
});
