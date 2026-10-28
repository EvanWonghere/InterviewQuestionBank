import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  auth: { configured: true, loading: false, user: { id: 'admin' }, isAdmin: true },
  listQuestions: vi.fn(),
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => state.auth }));
vi.mock('@/data/questionRepository', () => ({ listQuestions: state.listQuestions }));
vi.mock('@/store/progressStore', () => ({ useProgressStore: (select) => select({ progress: {}, setProgress: () => {} }) }));
vi.mock('@/store/reviewStore', () => ({ useReviewStore: (select) => select({ attempts: [] }) }));
vi.mock('@/components/quiz/AnswerPanel', () => ({ default: () => null }));
vi.mock('@/components/quiz/QuestionContent', () => ({ default: () => null }));
vi.mock('@/components/quiz/SubmissionView', () => ({ default: () => null }));
vi.mock('@/components/ai/TutorEntry', () => ({ default: () => null }));
vi.mock('@/components/ai/InterviewReport', () => ({ default: () => null }));

import { QuestionsProvider } from './QuestionsContext';
import MockInterviewPage from '@/pages/MockInterviewPage';

const pack = (prefix) => ({
  categories: [{ id: 'c', name: '合成分类', order: 1 }],
  questions: Array.from({ length: 5 }, (_, i) => ({ id: prefix + i, title: prefix + i, categoryId: 'c', order: i })),
  source: 'supabase',
});
const app = () => <QuestionsProvider><MemoryRouter><MockInterviewPage /></MemoryRouter></QuestionsProvider>;

describe('interview page privacy on logout', () => {
  it('clears its locally stored private deck after the next user loads', async () => {
    state.listQuestions.mockResolvedValueOnce(pack('synthetic private ')).mockResolvedValueOnce(pack('synthetic public '));
    const { rerender } = render(app());
    await screen.findByRole('button', { name: '开始模拟面试' });
    fireEvent.click(screen.getByRole('button', { name: '5 题' }));
    fireEvent.click(screen.getByRole('button', { name: '开始模拟面试' }));
    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('synthetic private');
    state.auth = { configured: true, loading: false, user: null, isAdmin: false };
    rerender(app());
    await screen.findByRole('button', { name: '开始模拟面试' });
    expect(screen.queryByText(/synthetic private/)).toBeNull();
  });
});
