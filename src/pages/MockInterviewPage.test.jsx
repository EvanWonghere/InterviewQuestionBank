import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MockInterviewPage from './MockInterviewPage';

const state = vi.hoisted(() => ({ questions: [], categories: [], progress: {} }));
vi.mock('@/context/QuestionsContext', () => ({
  useQuestions: () => ({ questions: state.questions, categories: state.categories, loading: false, error: null }),
}));
vi.mock('@/store/progressStore', () => ({
  useProgressStore: (select) => select({ progress: state.progress, setProgress: () => {} }),
}));
vi.mock('@/store/reviewStore', () => ({ useReviewStore: (select) => select({ attempts: [] }) }));
vi.mock('@/components/quiz/AnswerPanel', () => ({
  default: ({ onRated }) => <button type="button" onClick={() => onRated('wrong')}>下一题</button>,
}));
vi.mock('@/components/quiz/QuestionContent', () => ({ default: () => null }));
vi.mock('@/components/quiz/SubmissionView', () => ({ default: () => null }));
vi.mock('@/components/ai/TutorEntry', () => ({ default: () => null }));
vi.mock('@/components/ai/InterviewReport', () => ({ default: () => null }));

const cat = (id, name, order) => ({ id, name, order });
const qs = (categoryId, prefix, n) =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i + 1}`, title: `${prefix}${i + 1}`, order: i + 1, categoryId }));

/** 选好分类和题数后开始，一路点到复盘，返回出过的题目标题。 */
function runInterview({ category, count }) {
  const view = render(<MemoryRouter><MockInterviewPage /></MemoryRouter>);
  if (category) fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${category}`) }));
  fireEvent.click(screen.getByRole('button', { name: `${count} 题` }));
  fireEvent.click(screen.getByRole('button', { name: '开始模拟面试' }));
  const titles = [];
  while (screen.queryByRole('button', { name: '下一题' })) {
    titles.push(screen.getByRole('heading', { level: 2 }).textContent);
    fireEvent.click(screen.getByRole('button', { name: '下一题' }));
  }
  view.unmount();
  return titles;
}

beforeEach(() => {
  state.categories = [cat('basics', '基础', 1), cat('render', '渲染', 2)];
  state.questions = [...qs('basics', 'b', 6), ...qs('render', 'r', 6)];
  state.progress = {};
});
afterEach(cleanup);

describe('MockInterviewPage category selection', () => {
  it('draws from every category by default', () => {
    const titles = runInterview({ count: 5 });
    expect(titles).toHaveLength(5);
    expect(titles.some((t) => t.startsWith('b'))).toBe(true);
    expect(titles.some((t) => t.startsWith('r'))).toBe(true);
  });

  it('draws only from the chosen category', () => {
    const titles = runInterview({ category: '渲染', count: 5 });
    expect(titles).toHaveLength(5);
    expect(titles.every((t) => t.startsWith('r'))).toBe(true);
  });

  it('asks every question of a category that has fewer than the requested count', () => {
    state.questions = [...qs('basics', 'b', 6), ...qs('render', 'r', 3)];
    const titles = runInterview({ category: '渲染', count: 5 });
    expect([...titles].sort()).toEqual(['r1', 'r2', 'r3']);
  });

  it('shows question counts and cannot start on an empty category', () => {
    state.categories = [...state.categories, cat('empty', '空分类', 3)];
    render(<MemoryRouter><MockInterviewPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /^渲染\s*6$/ })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /^空分类/ }));
    expect(screen.getByRole('button', { name: '开始模拟面试' })).toBeDisabled();
  });

  it('picks unmastered questions at random before mastered ones', () => {
    state.questions = qs('render', 'r', 8);
    state.progress = { r1: 'mastered', r2: 'mastered' };
    const draws = new Set();
    for (let i = 0; i < 20; i++) {
      const titles = runInterview({ category: '渲染', count: 5 });
      expect(titles).not.toContain('r1');
      expect(titles).not.toContain('r2');
      draws.add([...titles].sort().join(','));
    }
    // 6 道未掌握题里抽 5 道：按固定顺序抽每次都是同一组，随机抽 20 次几乎不可能全相同
    expect(draws.size).toBeGreaterThan(1);
  });
});
