import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  auth: { configured: true, loading: false, user: { id: 'admin' }, isAdmin: true },
  listQuestions: vi.fn(),
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => state.auth }));
vi.mock('@/data/questionRepository', () => ({ listQuestions: state.listQuestions }));
import { QuestionsProvider, useQuestions } from './QuestionsContext';

const data = (title) => ({ categories: [], questions: [{ id: title, title }], source: 'supabase' });
function deferred() {
  let resolve, reject;
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}
function View() {
  const { questions, loading, error, refresh } = useQuestions();
  return <div><span>{loading ? 'loading' : 'ready'}</span><span>{error}</span>
    {questions.map((q) => <p key={q.id}>{q.title}</p>)}
    <button onClick={() => void refresh({ silent: true })}>silent</button><button onClick={() => { state.savedRefresh = refresh; }}>stash</button></div>;
}
const app = () => <QuestionsProvider><View /></QuestionsProvider>;
beforeEach(() => {
  state.auth = { configured: true, loading: false, user: { id: 'admin' }, isAdmin: true };
  state.listQuestions.mockReset();
});

describe('question visibility follows authentication', () => {
  it('hides private data immediately on logout and loads public data', async () => {
    const anon = deferred();
    state.listQuestions.mockResolvedValueOnce(data('private synthetic')).mockReturnValueOnce(anon.promise);
    const { rerender } = render(app());
    await screen.findByText('private synthetic');
    state.auth = { configured: true, loading: false, user: null, isAdmin: false };
    rerender(app());
    expect(screen.queryByText('private synthetic')).toBeNull();
    expect(screen.getByText('loading')).toBeTruthy();
    await act(async () => anon.resolve(data('public synthetic')));
    expect(screen.getByText('public synthetic')).toBeTruthy();
  });

  it('ignores a late result from the previous identity', async () => {
    const old = deferred();
    state.listQuestions.mockReturnValueOnce(old.promise).mockResolvedValueOnce(data('public synthetic'));
    const { rerender } = render(app());
    state.auth = { configured: true, loading: false, user: null, isAdmin: false };
    rerender(app());
    await screen.findByText('public synthetic');
    await act(async () => old.resolve(data('private synthetic')));
    expect(screen.queryByText('private synthetic')).toBeNull();
    expect(screen.getByText('public synthetic')).toBeTruthy();
  });

  it('does not retain the previous account data if the next load fails', async () => {
    state.listQuestions.mockResolvedValueOnce(data('private synthetic')).mockRejectedValueOnce(new Error('load failed'));
    const { rerender } = render(app());
    await screen.findByText('private synthetic');
    state.auth = { configured: true, loading: false, user: { id: 'other' }, isAdmin: false };
    rerender(app());
    expect(screen.queryByText('private synthetic')).toBeNull();
    await screen.findByText('load failed');
    expect(screen.queryByText('private synthetic')).toBeNull();
  });

  it('waits for auth resolution and masks data on privilege revocation', async () => {
    state.listQuestions.mockResolvedValueOnce(data('private synthetic')).mockResolvedValueOnce(data('public synthetic'));
    const { rerender } = render(app());
    await screen.findByText('private synthetic');
    state.auth = { ...state.auth, loading: true, isAdmin: false };
    rerender(app());
    expect(screen.queryByText('private synthetic')).toBeNull();
    expect(state.listQuestions).toHaveBeenCalledTimes(1);
    state.auth = { ...state.auth, loading: false };
    rerender(app());
    await screen.findByText('public synthetic');
    expect(screen.queryByText('private synthetic')).toBeNull();
  });

  it('does not restore an old cache when switching A to B and back to A', async () => {
    const other = deferred(), again = deferred();
    state.listQuestions.mockResolvedValueOnce(data('old private')).mockReturnValueOnce(other.promise).mockReturnValueOnce(again.promise);
    const { rerender } = render(app());
    await screen.findByText('old private');
    state.auth = { configured: true, loading: false, user: { id: 'other' }, isAdmin: false };
    rerender(app());
    expect(screen.queryByText('old private')).toBeNull();
    state.auth = { configured: true, loading: false, user: { id: 'admin' }, isAdmin: true };
    rerender(app());
    expect(screen.queryByText('old private')).toBeNull();
    await act(async () => other.resolve(data('other data')));
    expect(screen.queryByText('old private')).toBeNull();
    await act(async () => again.resolve(data('new private')));
    expect(screen.getByText('new private')).toBeTruthy();
  });

  it('ignores refresh callbacks retained from a previous identity', async () => {
    const next = deferred();
    state.listQuestions.mockResolvedValueOnce(data('old private')).mockReturnValueOnce(next.promise);
    const { rerender } = render(app());
    await screen.findByText('old private');
    fireEvent.click(screen.getByText('stash'));
    state.auth = { configured: true, loading: false, user: null, isAdmin: false };
    rerender(app());
    await act(async () => { await state.savedRefresh(); });
    expect(state.listQuestions).toHaveBeenCalledTimes(2);
    await act(async () => next.resolve(data('new public')));
    expect(screen.getByText('new public')).toBeTruthy();
  });

  it('keeps the list visible during a silent refresh for the same identity', async () => {
    const next = deferred();
    state.listQuestions.mockResolvedValueOnce(data('original')).mockReturnValueOnce(next.promise);
    render(app());
    await screen.findByText('original');
    fireEvent.click(screen.getByText('silent'));
    expect(screen.getByText('original')).toBeTruthy();
    await act(async () => next.resolve(data('updated')));
    await waitFor(() => expect(screen.getByText('updated')).toBeTruthy());
  });
});
