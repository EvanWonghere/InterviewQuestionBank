import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import StagePage from './StagePage';
import { useGameStore } from '@/store/gameStore';
import { useReviewStore } from '@/store/reviewStore';

// 7 questions → stages of 4 and 3.
const questions = Array.from({ length: 7 }, (_, i) => ({ id: `q${i}`, title: `题${i}`, question: `Q${i}?`, categoryId: 'c', difficulty: 'easy', order: i, status: 'published' }));
vi.mock('@/context/QuestionsContext', () => ({
  useQuestions: () => ({ questions, categories: [{ id: 'c', name: 'C# 基础', order: 1 }], loading: false, error: null }),
}));
vi.mock('@/components/quiz/QuestionContent', () => ({ default: ({ content }) => <p>{content}</p> }));
vi.mock('@/components/quiz/AnswerPanel', () => ({
  default: ({ onRated }) => (
    <div>
      <button type="button" onClick={() => onRated('mastered', { quality: 4, correct: null, assisted: false, aiScore: null })}>评良好</button>
      <button type="button" onClick={() => onRated('wrong', { quality: 0, correct: false, assisted: false, aiScore: null })}>评重来</button>
      <button type="button" onClick={() => onRated('mastered', { quality: 5, correct: true, assisted: true, aiScore: null })}>用提示后答对</button>
    </div>
  ),
}));

function renderStage(path = '/stage/c/1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route path="/stage/:categoryId/:index" element={<StagePage />} /></Routes>
    </MemoryRouter>,
  );
}

const answer = (name) => {
  fireEvent.click(screen.getByRole('button', { name }));
  fireEvent.click(screen.getByRole('button', { name: /下一题|结算|查看结算/ }));
};

beforeEach(() => {
  window.scrollTo = vi.fn();
  useGameStore.setState({ records: {}, bestStars: {}, bonusXp: 0, quiet: true, seenAchievements: [] });
  useReviewStore.setState({ reviewStates: {}, attempts: [] });
});
afterEach(cleanup);

describe('StagePage', () => {
  it('clears a stage without losing a heart, builds a combo and records a flawless run', () => {
    renderStage();
    fireEvent.click(screen.getByRole('button', { name: '开始' }));
    expect(screen.getByText('题0')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '评良好' }));
    expect(screen.getByText('NICE')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '下一题' }));
    fireEvent.click(screen.getByRole('button', { name: '评良好' }));
    expect(screen.getByText('COMBO ×2')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '下一题' }));
    answer('评良好');
    answer('评良好');

    expect(screen.getByRole('heading', { name: /STAGE\s*CLEAR/ })).toBeVisible();
    expect(screen.getByRole('img', { name: '本关 2 颗星' })).toBeVisible();
    expect(screen.getByRole('link', { name: '下一关' })).toHaveAttribute('href', '/stage/c/2');
    expect(screen.getByText('新成就：第一关')).toBeVisible();
    expect(useGameStore.getState().seenAchievements).toContain('first-clear');
    expect(useGameStore.getState().records['c:1']).toMatchObject({ cleared: true, flawless: true, runs: 1 });
    // combo ×2..×4 on easy questions: 10% / 20% / 30% of 10 XP
    expect(useGameStore.getState().bonusXp).toBe(1 + 2 + 3);
  });

  it('keeps the combo on an assisted answer but gives only one star', () => {
    renderStage();
    fireEvent.click(screen.getByRole('button', { name: '开始' }));
    answer('评良好');
    fireEvent.click(screen.getByRole('button', { name: '评良好' }));
    expect(screen.getByText('COMBO ×2')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '下一题' }));
    fireEvent.click(screen.getByRole('button', { name: '用提示后答对' }));
    expect(screen.getByText('OK')).toBeVisible();
    expect(screen.getByText('COMBO ×2')).toBeVisible();
  });

  it('fails the stage when the hearts run out and keeps it uncleared', () => {
    renderStage();
    fireEvent.click(screen.getByRole('button', { name: '开始' }));
    answer('评重来');
    answer('评重来');
    fireEvent.click(screen.getByRole('button', { name: '评重来' }));
    expect(screen.getByRole('img', { name: '剩余 0 颗心' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '查看结算' }));

    expect(screen.getByRole('heading', { name: /STAGE\s*FAILED/ })).toBeVisible();
    expect(screen.queryByRole('link', { name: '下一关' })).toBeNull();
    expect(useGameStore.getState().records['c:1']).toMatchObject({ cleared: false, flawless: false });
  });

  it('refuses a locked stage', () => {
    renderStage('/stage/c/2');
    expect(screen.getByText(/这一关还没解锁/)).toBeVisible();
  });
});
