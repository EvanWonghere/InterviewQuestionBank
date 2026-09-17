import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PracticeHeatmap from './PracticeHeatmap';
import { dayKey } from '@/lib/practiceCalendar';

const state = vi.hoisted(() => ({ auth: {}, attempts: [], calendar: vi.fn(), day: vi.fn(), first: vi.fn() }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => state.auth }));
vi.mock('@/context/QuestionsContext', () => ({ useQuestions: () => ({ questions: [{ id: 'q1', title: '协程生命周期' }] }) }));
vi.mock('@/store/reviewStore', () => ({ useReviewStore: (select) => select({ attempts: state.attempts }) }));
vi.mock('@/data/calendarRepository', () => ({
  loadPracticeCalendar: (...args) => state.calendar(...args),
  loadPracticeDay: (...args) => state.day(...args),
  loadFirstAttemptAt: (...args) => state.first(...args),
}));

const renderHeatmap = () => render(<MemoryRouter><PracticeHeatmap /></MemoryRouter>);
// Role queries over ~370 cells are slow in jsdom; address cells by their date instead.
const cellFor = (key) => document.querySelector(`button[data-day="${key}"]`);
const now = new Date();
const today = dayKey(now);

beforeEach(() => {
  state.calendar.mockReset(); state.day.mockReset(); state.first.mockReset();
  state.first.mockResolvedValue(null);
});
afterEach(cleanup);

describe('PracticeHeatmap', () => {
  it('aggregates local attempts for anonymous practice and opens a day detail', () => {
    state.auth = { user: null, isAdmin: false, loading: false };
    state.attempts = [
      { id: 'a1', question_id: 'q1', answered_at: now.toISOString(), is_correct: true, quality: 5 },
      { id: 'a2', question_id: 'q1', answered_at: now.toISOString(), is_correct: null, quality: 3 },
    ];
    renderHeatmap();
    expect(state.calendar).not.toHaveBeenCalled();
    expect(screen.getByText('仅本设备最近 500 次作答')).toBeVisible();
    const cell = cellFor(today);
    expect(cell.getAttribute('aria-label')).toMatch(new RegExp(`^${today} · 2 次 · 1 题 · 正确率 100%`));
    expect(cell).toHaveAttribute('data-level', '4');
    expect([...document.querySelectorAll('button.heat-cell')].filter((b) => b.getAttribute('aria-label').endsWith('未刷题')).length).toBeGreaterThanOrEqual(364);
    expect(screen.getAllByText('1 天', { selector: 'p' })).toHaveLength(2);

    fireEvent.click(cell);
    const detail = screen.getAllByRole('link', { name: '协程生命周期' })[0].closest('ul');
    expect(within(detail).getAllByRole('listitem')).toHaveLength(2);
    expect(within(detail).getByText('简单')).toBeVisible();
  });

  it('switches metric coloring', () => {
    state.auth = { user: null, isAdmin: false, loading: false };
    state.attempts = [{ id: 'a1', question_id: 'q1', answered_at: now.toISOString(), is_correct: false, quality: 0 }];
    renderHeatmap();
    const cell = () => cellFor(today);
    expect(cell()).toHaveAttribute('data-level', '4');
    fireEvent.click(screen.getByRole('button', { name: '掌握质量' }));
    expect(cell()).toHaveAttribute('data-level', '1');
  });

  it('loads cloud aggregates and day attempts for administrators', async () => {
    state.auth = { user: { id: 'admin' }, isAdmin: true, loading: false };
    state.attempts = [];
    state.calendar.mockResolvedValue([{ day: today, attempts: 3, questions: 2, objective: 0, correct: 0, avg_quality: '4.00' }]);
    state.day.mockResolvedValue([{ id: 'c1', question_id: 'missing', answered_at: now.toISOString(), is_correct: null, quality: 4, assistance_used: true }]);
    renderHeatmap();
    await screen.findByText('云端作答记录');
    await waitFor(() => expect(cellFor(today)).toHaveAttribute('aria-label', `${today} · 3 次 · 2 题 · 平均评分 4.0`));
    const cell = cellFor(today);
    expect(state.calendar).toHaveBeenCalledWith(expect.objectContaining({ to: today }));
    expect(screen.getByText('云端作答记录')).toBeVisible();
    fireEvent.click(cell);
    expect(await screen.findByText('已归档题目')).toBeVisible();
    expect(screen.getByText('AI辅助')).toBeVisible();
    expect(state.day).toHaveBeenCalledWith(expect.objectContaining({ day: today }));
  });

  it('moves focus with arrow keys', async () => {
    state.auth = { user: null, isAdmin: false, loading: false };
    state.attempts = [];
    renderHeatmap();
    const cell = cellFor(today);
    expect(cell).toHaveAttribute('aria-label', `${today} · 未刷题`);
    expect(cell).toHaveAttribute('tabindex', '0');
    cell.focus();
    fireEvent.keyDown(cell, { key: 'ArrowLeft' });
    await waitFor(() => expect(document.activeElement).toHaveAttribute('aria-label', expect.stringMatching(/未刷题$/)));
    expect(document.activeElement).not.toBe(cell);
  });
});
