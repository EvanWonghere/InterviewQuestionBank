import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DungeonPage from './DungeonPage';
import { useGameStore } from '@/store/gameStore';
import { useReviewStore } from '@/store/reviewStore';

const questions = Array.from({ length: 3 }, (_, i) => ({
  id: `q${i}`, title: `题${i}`, question: `Q${i}?`, categoryId: 'c', difficulty: 'easy', order: i, status: 'published', tags: ['closures'],
}));
vi.mock('@/context/QuestionsContext', () => ({
  useQuestions: () => ({ questions, categories: [{ id: 'c', name: 'C# 基础', order: 1 }], loading: false, error: null }),
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ isAdmin: false }) }));
vi.mock('@/components/quiz/QuestionContent', () => ({ default: ({ content }) => <p>{content}</p> }));
vi.mock('@/components/quiz/AnswerPanel', () => ({
  default: ({ question, onRated }) => (
    <button type="button" onClick={() => onRated('wrong', { quality: 0, correct: false, assisted: false, aiScore: null })}>
      评{question.id}
    </button>
  ),
}));

beforeEach(() => {
  window.scrollTo = vi.fn();
  useGameStore.setState({ records: {}, bestStars: {}, bonusXp: 0, quiet: true, seenAchievements: [] });
  useReviewStore.setState({ reviewStates: {}, attempts: [] });
});
afterEach(cleanup);

describe('DungeonPage', () => {
  it('shows the weakest tag in the title and runs its questions', () => {
    useReviewStore.setState({
      reviewStates: { q0: { lapseCount: 2 }, q1: { lapseCount: 1 }, q2: { lapseCount: 1 } },
      attempts: [],
    });
    render(<MemoryRouter><DungeonPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: '弱点副本 · closures' })).toBeVisible();
  });

  it('says so when nothing is weak', () => {
    render(<MemoryRouter><DungeonPage /></MemoryRouter>);
    expect(screen.getByText(/还没有明显的薄弱点/)).toBeVisible();
    expect(screen.getByRole('link', { name: '返回闯关地图' })).toHaveAttribute('href', '/map');
  });
});
