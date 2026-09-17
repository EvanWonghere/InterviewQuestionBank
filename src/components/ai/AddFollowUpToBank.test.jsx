import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AddFollowUpToBank from './AddFollowUpToBank';

const state = vi.hoisted(() => ({ draft: vi.fn(), save: vi.fn(), refresh: vi.fn(), questions: [] }));
vi.mock('@/context/QuestionsContext', () => ({ useQuestions: () => ({ categories: [{ id: 'c1', name: '设计模式' }, { id: 'c2', name: 'C#' }], questions: state.questions, refresh: state.refresh }) }));
vi.mock('@/data/aiRepository', () => ({ draftQuestionFromFollowUp: (...a) => state.draft(...a) }));
vi.mock('@/data/questionRepository', () => ({ saveQuestion: (...a) => state.save(...a) }));
vi.mock('@/components/common/Markdown', () => ({ default: ({ content }) => <div>{content}</div> }));

const evalId = '00000000-0000-4000-8000-000000000001';
const evaluation = { id: evalId, round: 2, score: 80, result: { followUpAnswerScore: 40 } };
const generated = {
  type: 'algorithm', title: '用 C# 实现可退订的观察者', promptMd: '实现 Subject', difficulty: 'medium', tags: ['观察者'],
  payload: { language: 'C#', starterCode: 'class Subject {}' },
  solution: { referenceAnswerMd: '参考实现', rubricMd: '- 退订', explanationMd: '', caseSensitive: false },
  sourceTitle: 'AI 追问 · 事件订阅', originEvaluationId: evalId,
};
const renderIt = (props = {}) => render(<MemoryRouter><AddFollowUpToBank evaluation={evaluation} sourceCategoryId="c1" {...props} /></MemoryRouter>);

beforeEach(() => {
  state.draft.mockReset(); state.save.mockReset(); state.refresh.mockReset().mockResolvedValue();
  state.questions = [];
});
afterEach(cleanup);

describe('AddFollowUpToBank', () => {
  it('recommends weak follow-ups, drafts with the chosen type and saves a private draft', async () => {
    state.draft.mockResolvedValue(generated);
    state.save.mockResolvedValue('new-id');
    renderIt();
    expect(screen.getByText(/掌握不牢（40 分）/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '加入题库' }));
    fireEvent.change(screen.getByRole('combobox', { name: '生成题型' }), { target: { value: 'algorithm' } });
    fireEvent.click(screen.getByRole('button', { name: '生成题目' }));
    expect(await screen.findByDisplayValue('用 C# 实现可退订的观察者')).toBeVisible();
    expect(state.draft).toHaveBeenCalledWith({ evaluationId: evalId, type: 'algorithm' });
    expect(screen.getByText('语言：C#')).toBeVisible();
    expect(screen.getByRole('combobox', { name: '分类' })).toHaveValue('c1');

    fireEvent.change(screen.getByRole('textbox', { name: '标题' }), { target: { value: '观察者退订实现' } });
    fireEvent.click(screen.getByRole('button', { name: '保存到题库（私有草稿）' }));
    await waitFor(() => expect(state.save).toHaveBeenCalled());
    expect(state.save.mock.calls[0][0]).toMatchObject({ title: '观察者退订实现', categoryId: 'c1', status: 'draft', visibility: 'private', originEvaluationId: evalId, type: 'algorithm' });
    expect(state.refresh).toHaveBeenCalledWith({ silent: true });
    expect(await screen.findByRole('link', { name: '去编辑' })).toHaveAttribute('href', '/manage/questions/new-id/edit');
  });

  it('reports schema errors without saving', async () => {
    state.draft.mockResolvedValue({ ...generated, promptMd: '   ' });
    renderIt();
    fireEvent.click(screen.getByRole('button', { name: '加入题库' }));
    fireEvent.click(screen.getByRole('button', { name: '生成题目' }));
    fireEvent.click(await screen.findByRole('button', { name: '保存到题库（私有草稿）' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('题干不能为空');
    expect(state.save).not.toHaveBeenCalled();
  });

  it('shows questions already created from this follow-up and does not push again', () => {
    state.questions = [{ id: 'q9', title: '已有题', originEvaluationId: evalId }];
    renderIt({ evaluation: { ...evaluation, result: { followUpAnswerScore: 90 } } });
    expect(screen.getByRole('link', { name: '已有题' })).toHaveAttribute('href', '/manage/questions/q9/edit');
    expect(screen.queryByText(/掌握不牢/)).toBeNull();
    expect(screen.getByRole('button', { name: '再生成一道' })).toBeVisible();
  });
});
