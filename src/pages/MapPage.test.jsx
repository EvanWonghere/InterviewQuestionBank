import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MapPage from './MapPage';
import { useGameStore } from '@/store/gameStore';
import { useReviewStore } from '@/store/reviewStore';
import { ACHIEVEMENTS } from '@/lib/gameRules';

const questions = [
  { id: 'q1', title: '题1', categoryId: 'cat-a', difficulty: 'easy', status: 'published' },
  { id: 'q2', title: '题2', categoryId: 'cat-a', difficulty: 'easy', status: 'published' },
  { id: 'q3', title: '题3', categoryId: 'cat-a', difficulty: 'medium', status: 'published' },
  { id: 'q4', title: '题4', categoryId: 'cat-a', difficulty: 'medium', status: 'published' },
  { id: 'q5', title: '题5', categoryId: 'cat-a', difficulty: 'hard', status: 'published', tags: ['edge-cases'] },
  { id: 'q6', title: '题6', categoryId: 'cat-a', difficulty: 'hard', status: 'published', tags: ['edge-cases'] },
  { id: 'q7', title: '题7', categoryId: 'cat-a', difficulty: 'hard', status: 'published', tags: ['edge-cases'] },
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
  useGameStore.setState({ records: {}, bestStars: {}, bonusXp: 0, quiet: false, seenAchievements: [] });
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

  it('shows no due questions by default and lists every achievement as locked', () => {
    render(<MemoryRouter><MapPage /></MemoryRouter>);

    expect(screen.getByText('今天没有到期题')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '开始巡检' })).not.toBeInTheDocument();

    expect(screen.getByText(`成就 · 已解锁 0 / ${ACHIEVEMENTS.length}`)).toBeInTheDocument();
  });

  it('links to the patrol page when a question is due for review', () => {
    useReviewStore.setState({
      reviewStates: {
        q1: { lastQuality: 4, repetitions: 1, lapseCount: 0, dueAt: new Date(Date.now() - 86400000).toISOString() },
      },
      attempts: [],
    });

    render(<MemoryRouter><MapPage /></MemoryRouter>);

    expect(screen.getByText(/1 道题到期/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '开始巡检' })).toHaveAttribute('href', '/patrol');
  });

  it('shows a 1-day streak when an attempt was answered today', () => {
    useReviewStore.setState({
      reviewStates: {},
      attempts: [{ question_id: 'q1', quality: 4, answered_at: new Date().toISOString() }],
    });

    render(<MemoryRouter><MapPage /></MemoryRouter>);

    expect(screen.getByText('连续 1 天')).toBeInTheDocument();
  });

  it('links the boss node once every stage is flawlessly cleared, otherwise leaves it unlinked', () => {
    render(<MemoryRouter><MapPage /></MemoryRouter>);
    const boss = screen.getByLabelText(/章末 Boss/);
    expect(boss.tagName).not.toBe('A');

    useGameStore.setState({
      records: {
        'cat-a:1': { cleared: true, flawless: true, unassisted: true, maxCombo: 0, completed: true, runs: 1 },
        'cat-a:2': { cleared: true, flawless: true, unassisted: true, maxCombo: 0, completed: true, runs: 1 },
      },
    });
    cleanup();
    render(<MemoryRouter><MapPage /></MemoryRouter>);
    const bossLink = screen.getByRole('link', { name: 'C# 基础 章末 Boss' });
    expect(bossLink).toHaveAttribute('href', '/boss/cat-a');
  });

  it('shows a dungeon card for a tag with at least 3 lapsed questions', () => {
    render(<MemoryRouter><MapPage /></MemoryRouter>);
    expect(screen.queryByText('弱点副本')).not.toBeInTheDocument();

    useReviewStore.setState({
      reviewStates: {
        q5: { lapseCount: 2 },
        q6: { lapseCount: 1 },
        q7: { lapseCount: 1 },
      },
      attempts: [],
    });
    cleanup();
    render(<MemoryRouter><MapPage /></MemoryRouter>);
    expect(screen.getByText('薄弱点「edge-cases」集结了 3 道题')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '挑战副本' })).toHaveAttribute('href', '/dungeon');
  });
});
