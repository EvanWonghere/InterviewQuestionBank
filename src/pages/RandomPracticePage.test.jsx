import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RandomPracticePage from './RandomPracticePage';

const state = vi.hoisted(() => ({ setProgress: vi.fn() }));
vi.mock('@/context/QuestionsContext', () => ({
  useQuestions: () => ({
    questions: [
      { id: 'a', title: '题A', question: 'A?', categoryId: 'c', difficulty: 'easy' },
      { id: 'b', title: '题B', question: 'B?', categoryId: 'c', difficulty: 'easy' },
    ],
    categories: [{ id: 'c', name: '分类', order: 1 }],
    loading: false,
    error: null,
  }),
}));
vi.mock('@/store/progressStore', () => ({
  useProgressStore: (select) => select({ setProgress: state.setProgress }),
}));
vi.mock('@/components/quiz/QuestionContent', () => ({ default: ({ content }) => <p>{content}</p> }));
vi.mock('@/components/quiz/AnswerPanel', () => ({
  default: ({ onRated }) => <button type="button" onClick={() => onRated('wrong')}>标为错题</button>,
}));

beforeEach(() => {
  state.setProgress.mockReset();
  vi.spyOn(Math, 'random').mockReturnValue(0);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('RandomPracticePage skip gate', () => {
  it('keeps next disabled until rated when the default gate is on', () => {
    render(<MemoryRouter><RandomPracticePage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /开始随机刷题/ }));
    expect(screen.getByRole('button', { name: '下一题' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '标为错题' }));
    expect(state.setProgress).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '下一题' })).toBeEnabled();
  });

  it('allows skipping without writing progress when the gate is off', () => {
    render(<MemoryRouter><RandomPracticePage /></MemoryRouter>);
    fireEvent.click(screen.getByLabelText(/必须先标记再下一题/));
    fireEvent.click(screen.getByRole('button', { name: /开始随机刷题/ }));
    expect(screen.getByText('可跳过')).toBeVisible();
    expect(screen.getByRole('button', { name: '下一题' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: '下一题' }));
    expect(state.setProgress).not.toHaveBeenCalled();
    expect(screen.getByText(/已跳过 1/)).toBeVisible();
  });
});
