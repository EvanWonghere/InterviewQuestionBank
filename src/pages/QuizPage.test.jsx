import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import QuizPage from './QuizPage';

const state = vi.hoisted(() => ({ questions: [], progress: {} }));
vi.mock('@/context/QuestionsContext', () => ({ useQuestions: () => ({ questions: state.questions, loading: false, error: null }) }));
vi.mock('@/store/progressStore', () => ({ useProgressStore: (select) => select({ progress: state.progress }) }));
// Uncontrolled input: its value survives re-renders but not a remount, which is what we assert on.
vi.mock('@/components/quiz/QuestionCard', () => ({
  default: ({ question }) => <div><h2>{question?.title}</h2><input aria-label="作答" /></div>,
}));

const q = (id, order, title = id) => ({ id, order, title, categoryId: 'c', type: 'short_answer', tags: [] });
const view = (path) => (
  <MemoryRouter initialEntries={[path]}>
    <Routes><Route path="/quiz" element={<QuizPage />} /><Route path="/list/:status" element={<QuizPage />} /></Routes>
  </MemoryRouter>
);
const heading = () => screen.getByRole('heading', { level: 2 }).textContent;

beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  state.questions = [q('a', 1), q('b', 2), q('c', 3)];
  state.progress = {};
});
afterEach(cleanup);

describe('QuizPage current question', () => {
  it('stays on the same question when a new one is inserted before it', () => {
    const { rerender } = render(view('/quiz'));
    fireEvent.click(screen.getByRole('button', { name: 'b' }));
    fireEvent.change(screen.getByLabelText('作答'), { target: { value: '写了一半' } });
    expect(screen.getByText('2 / 3')).toBeVisible();

    // An AI draft saved with sort_order 0 lands first; refreshed objects are new identities too.
    state.questions = [q('new', 0), ...state.questions.map((x) => ({ ...x }))];
    rerender(view('/quiz'));
    expect(heading()).toBe('b');
    expect(screen.getByLabelText('作答')).toHaveValue('写了一半');
    expect(screen.getByText('3 / 4')).toBeVisible();
    expect(screen.getByRole('button', { name: 'b' })).toHaveClass('is-active');
    fireEvent.click(screen.getByRole('button', { name: '下一题' }));
    expect(heading()).toBe('c');
  });

  it('keeps a question that was rated out of the wrong list until the user moves on', () => {
    state.progress = { a: 'wrong', b: 'wrong', c: 'wrong' };
    const { rerender } = render(view('/list/wrong'));
    fireEvent.click(screen.getByRole('button', { name: 'b' }));
    fireEvent.change(screen.getByLabelText('作答'), { target: { value: '已评分' } });

    state.progress = { a: 'wrong', b: 'mastered', c: 'wrong' };
    rerender(view('/list/wrong'));
    expect(heading()).toBe('b');
    expect(screen.getByLabelText('作答')).toHaveValue('已评分');
    expect(screen.getByText('已移出列表')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '下一题' }));
    expect(heading()).toBe('c');
    fireEvent.click(screen.getByRole('button', { name: '上一题' }));
    expect(heading()).toBe('a');
  });

  it('does not replace the page with the empty state when the last wrong question is rated', () => {
    state.questions = [q('only', 1)];
    state.progress = { only: 'wrong' };
    const { rerender } = render(view('/list/wrong'));
    fireEvent.click(screen.getByRole('button', { name: 'only' }));
    state.progress = { only: 'mastered' };
    rerender(view('/list/wrong'));
    expect(heading()).toBe('only');
    expect(screen.getByRole('button', { name: '下一题' })).toBeDisabled();
  });
});
