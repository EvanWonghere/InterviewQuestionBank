import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BossPage from './BossPage';
import { useGameStore } from '@/store/gameStore';
import { useReviewStore } from '@/store/reviewStore';
import { dayKey } from '@/lib/practiceCalendar';

// 6 questions → one stage; three of them are hard and make the boss deck.
const questions = Array.from({ length: 6 }, (_, i) => ({
  id: `q${i}`, title: `题${i}`, question: `Q${i}?`, categoryId: 'cid', difficulty: i < 3 ? 'hard' : 'easy', order: i, status: 'published',
}));
const auth = vi.hoisted(() => ({ value: { user: null, isAdmin: false } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => auth.value }));
vi.mock('@/context/QuestionsContext', () => ({
  useQuestions: () => ({ questions, categories: [{ id: 'cid', slug: 'cpp-basics', name: 'C++ 基础', order: 1 }], loading: false, error: null }),
}));
vi.mock('@/components/quiz/QuestionContent', () => ({ default: ({ content }) => <p>{content}</p> }));
vi.mock('@/components/ai/InterviewReport', () => ({ default: () => <p>战报内容</p> }));
vi.mock('@/components/quiz/AnswerPanel', () => ({
  default: ({ onRated, onEvaluated }) => (
    <div>
      <button type="button" onClick={() => onEvaluated?.({ round: 1, score: 60 })}>首答 60 分</button>
      <button type="button" onClick={() => onEvaluated?.({ round: 2, score: 90 })}>追问 90 分</button>
      <button type="button" onClick={() => onRated('mastered', { quality: 5 })}>评简单</button>
      <button type="button" onClick={() => onRated('mastered', { quality: 4 })}>评良好</button>
      <button type="button" onClick={() => onRated('wrong', { quality: 0 })}>评重来</button>
    </div>
  ),
}));

const ready = { 'cid:1': { cleared: true, flawless: true } };
const renderBoss = () => render(
  <MemoryRouter initialEntries={['/boss/cpp-basics']}>
    <Routes><Route path="/boss/:categoryId" element={<BossPage />} /></Routes>
  </MemoryRouter>,
);
const hp = () => screen.getAllByRole('meter')[0].getAttribute('aria-valuenow');
const next = () => fireEvent.click(screen.getByRole('button', { name: /下一题|结算/ }));

beforeEach(() => {
  auth.value = { user: null, isAdmin: false };
  window.scrollTo = vi.fn();
  useGameStore.setState({ records: { ...ready }, bestStars: {}, bonusXp: 0, pendingBonus: 0, quiet: true, seenAchievements: [], localRev: 0, syncedRev: 0 });
  useReviewStore.setState({ reviewStates: {}, attempts: [] });
});
afterEach(cleanup);

describe('BossPage', () => {
  it('stays closed until every stage has two stars', () => {
    useGameStore.setState({ records: {} });
    renderBoss();
    expect(screen.getByText(/面试官才会出现/)).toBeVisible();
  });

  it('beats the boss with self-ratings when there is no AI, and records the win', () => {
    renderBoss();
    expect(screen.getByRole('heading', { name: 'C++ 面试官' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '开始面试' }));
    fireEvent.click(screen.getByRole('button', { name: '评简单' }));
    expect(hp()).toBe('60');
    next();
    fireEvent.click(screen.getByRole('button', { name: '评简单' }));
    next();
    fireEvent.click(screen.getByRole('button', { name: '评良好' }));
    expect(screen.getByText('K.O.')).toBeVisible();
    next();
    expect(screen.getByRole('heading', { name: /BOSS\s*DEFEATED/ })).toBeVisible();
    expect(useGameStore.getState().records['boss:cid']).toMatchObject({ defeated: true, bestDamage: 115, fightsToday: 1, fightDay: dayKey(Date.now()) });
  });

  it('turns AI scores into damage and a better follow-up into a critical hit', () => {
    auth.value = { user: { id: 'admin' }, isAdmin: true };
    renderBoss();
    fireEvent.click(screen.getByRole('button', { name: '开始面试' }));
    fireEvent.click(screen.getByRole('button', { name: '首答 60 分' }));
    expect(hp()).toBe('70');
    fireEvent.click(screen.getByRole('button', { name: '追问 90 分' }));
    expect(hp()).toBe('55');
    // The self-rating after an AI evaluation deals no extra damage.
    fireEvent.click(screen.getByRole('button', { name: '评简单' }));
    expect(hp()).toBe('55');
    next();
    fireEvent.click(screen.getByRole('button', { name: '评重来' }));
    next();
    fireEvent.click(screen.getByRole('button', { name: '评重来' }));
    next();
    expect(screen.getByRole('heading', { name: /NOT\s*THIS\s*TIME/ })).toBeVisible();
    expect(screen.getByText('战报内容')).toBeInTheDocument();
    expect(useGameStore.getState().records['boss:cid']).toMatchObject({ defeated: false, bestDamage: 45 });
  });

  it('allows three fights a day', () => {
    useGameStore.setState({ records: { ...ready, 'boss:cid': { fightDay: dayKey(Date.now()), fightsToday: 3, bestDamage: 80 } } });
    renderBoss();
    expect(screen.getByText(/今天已经挑战 3 次了/)).toBeVisible();
    expect(screen.queryByRole('button', { name: '开始面试' })).toBeNull();
  });
});
