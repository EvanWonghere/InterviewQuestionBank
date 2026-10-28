import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import QuizPage from './QuizPage';
import MinigameTopicPage from './MinigameTopicPage';

const state = vi.hoisted(() => ({ questions: [], progress: {}, reviewStates: {} }));
vi.mock('@/context/QuestionsContext', () => ({ useQuestions: () => ({ questions: state.questions, loading: false, error: null }) }));
vi.mock('@/store/progressStore', () => ({ useProgressStore: (select) => select({ progress: state.progress }) }));
vi.mock('@/store/reviewStore', () => ({ useReviewStore: (select) => select({ reviewStates: state.reviewStates }) }));
vi.mock('@/components/quiz/QuestionCard', () => ({ default: ({ question }) => <div><h2>{question?.title}</h2><input aria-label="作答" /></div> }));
const q = (id, title = id, extra = {}) => ({ id, title, categoryId: 'c', type: 'short_answer', tags: [], difficulty: 'medium', status: 'published', visibility: 'public', ...extra });
const view = (path) => <MemoryRouter initialEntries={[path]}><Routes>
  <Route path="/topics/minigame-client" element={<MinigameTopicPage />} />
  <Route path="/quiz" element={<><Link to="/quiz?topic=minigame-client&section=basics">切换基础模块</Link><QuizPage /></>} />
</Routes></MemoryRouter>;
beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  state.questions = [q('q-001', '基础题'), q('minigame-001', '类型断言'), q('minigame-002', '事件解绑'), q('q-003', '无关题')];
  state.progress = {}; state.reviewStates = {};
});
afterEach(cleanup);

describe('minigame topic page and scoped practice', () => {
  it('shows available and missing counts and routes into each available section', () => {
    render(view('/topics/minigame-client'));
    expect(screen.getByRole('heading', { name: '小游戏客户端 · 技术复习' })).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('缺少 19 道');
    expect(screen.getByRole('link', { name: '练习03 · TypeScript、Laya 与异步' })).toHaveAttribute('href', '/quiz?topic=minigame-client&section=laya');
    expect(screen.queryByRole('link', { name: '练习02 · 渲染、资源与排查' })).toBeNull();
  });
  it('opens a permitted legacy ID and cloud UUID in its matching section', () => {
    state.questions = [q('uuid-1', '类型断言', { legacyId: 'minigame-001' }), q('uuid-2', '事件解绑', { legacyId: 'minigame-002' })];
    const { unmount } = render(view('/quiz?topic=minigame-client&section=laya&questionId=minigame-002'));
    expect(screen.getByRole('heading', { name: '事件解绑' })).toBeVisible();
    unmount();
    render(view('/quiz?topic=minigame-client&section=laya&questionId=uuid-1'));
    expect(screen.getByRole('heading', { name: '类型断言' })).toBeVisible();
  });
  it('does not detach an existing question outside the requested section', () => {
    render(view('/quiz?topic=minigame-client&section=laya&questionId=q-001'));
    expect(screen.getByRole('alert')).toHaveTextContent('不属于当前专题范围');
    expect(screen.queryByRole('heading', { name: '基础题' })).toBeNull();
  });
  it('rejects unknown section even when a real question ID was supplied', () => {
    render(view('/quiz?topic=minigame-client&section=unknown&questionId=q-001'));
    expect(screen.getByRole('alert')).toHaveTextContent('不属于当前专题范围');
    expect(screen.queryByRole('heading', { name: '基础题' })).toBeNull();
  });
  it('does not expose a private row sharing an expected stable ID', () => {
    state.questions.push(q('private-uuid', '私有合成标题', { legacyId: 'minigame-003', visibility: 'private' }));
    render(view('/quiz?topic=minigame-client&section=laya&questionId=private-uuid'));
    expect(screen.getByRole('alert')).toHaveTextContent('不属于当前专题范围');
    expect(screen.queryByText('私有合成标题')).toBeNull();
  });
  it('switches sections without retaining a question from the previous section', () => {
    render(view('/quiz?topic=minigame-client&section=laya&questionId=minigame-002'));
    expect(screen.getByRole('heading', { name: '事件解绑' })).toBeVisible();
    fireEvent.click(screen.getByRole('link', { name: '切换基础模块' }));
    expect(screen.getByRole('heading', { name: '基础题' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: '事件解绑' })).toBeNull();
  });
  it('keeps the selected in-scope answer open when a difficulty filter hides it', () => {
    state.questions = [q('minigame-001', '类型断言', { difficulty: 'medium' }), q('minigame-002', '事件解绑', { difficulty: 'easy' })];
    render(view('/quiz?topic=minigame-client&section=laya&questionId=minigame-001'));
    fireEvent.change(screen.getByLabelText('作答'), { target: { value: '写了一半' } });
    fireEvent.click(screen.getByRole('button', { name: '简单', exact: true }));
    expect(screen.getByRole('heading', { name: '类型断言' })).toBeVisible();
    expect(screen.getByLabelText('作答')).toHaveValue('写了一半');
  });
});
