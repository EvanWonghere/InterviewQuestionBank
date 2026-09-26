import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MapPage from './MapPage';
import { useGameStore } from '@/store/gameStore';
import { useReviewStore } from '@/store/reviewStore';

const questions = [
  { id: 'q1', title: '题1', categoryId: 'cat-a', difficulty: 'easy', status: 'published' },
  { id: 'q2', title: '题2', categoryId: 'cat-a', difficulty: 'easy', status: 'published' },
  { id: 'q3', title: '题3', categoryId: 'cat-a', difficulty: 'medium', status: 'published' },
  { id: 'q4', title: '题4', categoryId: 'cat-a', difficulty: 'medium', status: 'published' },
  { id: 'q5', title: '题5', categoryId: 'cat-a', difficulty: 'hard', status: 'published' },
  { id: 'q6', title: '题6', categoryId: 'cat-a', difficulty: 'hard', status: 'published' },
  { id: 'q7', title: '题7', categoryId: 'cat-a', difficulty: 'hard', status: 'published' },
];

vi.mock('@/context/QuestionsContext', () => ({
  useQuestions: () => ({
    questions,
    categories: [
      { id: 'cat-a', name: 'C# 基础', order: 1 },
      { id: 'cat-b', name: '空分类', order: 2 },
    ],
    loading: false,
    error: null,
  }),
}));

beforeEach(() => {
  useGameStore.setState({ records: {}, bestStars: {}, bonusXp: 0, quiet: false });
  // Only q1 has any review history; that alone isn't enough to clear stage 1 (needs every
  // question in the stage at >=2 stars), so stage 1 stays unlocked-but-not-cleared and
  // stage 2 (4/3 split of 7 questions) stays locked.
  useReviewStore.setState({
    reviewStates: {
      q1: { lastQuality: 4, repetitions: 1, lapseCount: 0 },
    },
    attempts: [],
  });
});

afterEach(() => {
  cleanup();
});

describe('MapPage', () => {
  it('links the first stage, locks a later one, hides empty categories and keeps the boss unlinked', () => {
    render(<MemoryRouter><MapPage /></MemoryRouter>);

    const firstStageLink = screen.getByRole('link', { name: /C# 基础 第 1 关/ });
    expect(firstStageLink).toHaveAttribute('href', '/stage/cat-a/1');

    const secondStage = screen.getByLabelText(/C# 基础 第 2 关.*未解锁/);
    expect(secondStage.tagName).not.toBe('A');

    expect(screen.queryByText('空分类')).not.toBeInTheDocument();

    const boss = screen.getByLabelText(/章末 Boss/);
    expect(boss.tagName).not.toBe('A');
  });
});
