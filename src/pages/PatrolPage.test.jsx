import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PatrolPage from './PatrolPage';
import { useGameStore } from '@/store/gameStore';
import { useReviewStore } from '@/store/reviewStore';
import { patrolKey } from '@/lib/gameRules';
import { dayKey } from '@/lib/practiceCalendar';

const questions = Array.from({ length: 3 }, (_, i) => ({ id: `q${i}`, title: `题${i}`, question: `Q${i}?`, categoryId: 'c', difficulty: 'easy', order: i, status: 'published' }));
vi.mock('@/context/QuestionsContext', () => ({
  useQuestions: () => ({ questions, categories: [{ id: 'c', name: 'C# 基础', order: 1 }], loading: false, error: null }),
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: null, isAdmin: false }) }));
vi.mock('@/components/quiz/QuestionContent', () => ({ default: ({ content }) => <p>{content}</p> }));
vi.mock('@/components/quiz/AnswerPanel', () => ({
  default: ({ question, onRated }) => (
    <div>
      <button type="button" onClick={() => {
        // A second pass on another day lights the third star.
        useReviewStore.setState((s) => ({
          reviewStates: { ...s.reviewStates, [question.id]: { lastQuality: 5, repetitions: 2, dueAt: '2099-01-01T00:00:00Z' } },
          attempts: [{ question_id: question.id, quality: 5, answered_at: new Date().toISOString() }, ...s.attempts],
        }));
        onRated('mastered', { quality: 5, correct: null, assisted: false, aiScore: null });
      }}>评简单</button>
      <button type="button" onClick={() => {
        // A lapse is due again tomorrow, so it leaves today's due list mid-run.
        useReviewStore.setState((s) => ({
          reviewStates: { ...s.reviewStates, [question.id]: { lastQuality: 0, repetitions: 0, lapseCount: 1, dueAt: '2099-01-01T00:00:00Z' } },
          attempts: [{ question_id: question.id, quality: 0, answered_at: new Date().toISOString() }, ...s.attempts],
        }));
        onRated('wrong', { quality: 0, correct: false, assisted: false, aiScore: null });
      }}>评重来</button>
    </div>
  ),
}));

const past = '2026-01-01T00:00:00Z';
beforeEach(() => {
  window.scrollTo = vi.fn();
  useGameStore.setState({ records: {}, bestStars: {}, bonusXp: 0, quiet: true, seenAchievements: [] });
  useReviewStore.setState({
    reviewStates: { q0: { lastQuality: 4, repetitions: 1, dueAt: past }, q1: { lastQuality: 4, repetitions: 1, dueAt: past } },
    attempts: [
      { question_id: 'q0', quality: 4, answered_at: '2026-01-01T00:00:00Z' },
      { question_id: 'q1', quality: 4, answered_at: '2026-01-01T00:00:00Z' },
    ],
  });
});
afterEach(cleanup);

const next = () => fireEvent.click(screen.getByRole('button', { name: /下一题|结算/ }));

describe('PatrolPage', () => {
  it('runs the due questions without hearts, lights third stars and records today', () => {
    render(<MemoryRouter><PatrolPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: '开始' }));
    expect(screen.getByText('第 1 / 2 题')).toBeVisible();
    expect(screen.queryByRole('img', { name: /颗心/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '评重来' }));
    expect(screen.getByText(/没过/)).toBeVisible();
    next();
    fireEvent.click(screen.getByRole('button', { name: '评简单' }));
    expect(screen.getByText('复习再次通过，第 3 颗星点亮！')).toBeVisible();
    next();

    expect(screen.getByRole('heading', { name: /PATROL\s*DONE/ })).toBeVisible();
    expect(screen.getByRole('img', { name: '点亮 1 颗第 3 颗星' })).toBeVisible();
    expect(useGameStore.getState().records[patrolKey(dayKey(Date.now()))]).toMatchObject({ completed: true });
  });

  it('says so when nothing is due', () => {
    useReviewStore.setState({ reviewStates: {}, attempts: [] });
    render(<MemoryRouter><PatrolPage /></MemoryRouter>);
    expect(screen.getByText(/今天没有到期题/)).toBeVisible();
  });
});
