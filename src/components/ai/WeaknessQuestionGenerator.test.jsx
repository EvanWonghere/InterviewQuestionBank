import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WeaknessQuestionGenerator from './WeaknessQuestionGenerator';

const state = vi.hoisted(() => ({ draft: vi.fn(), save: vi.fn(), refresh: vi.fn(), questions: [] }));
vi.mock('@/context/QuestionsContext', () => ({ useQuestions: () => ({ categories: [{ id: 'c1', name: 'C#' }, { id: 'c2', name: 'Unity' }], questions: state.questions, refresh: state.refresh }) }));
vi.mock('@/data/aiRepository', () => ({ draftQuestionsForWeakness: (...a) => state.draft(...a) }));
vi.mock('@/data/questionRepository', () => ({ saveQuestion: (...a) => state.save(...a) }));
vi.mock('@/components/common/Markdown', () => ({ default: ({ content }) => <div>{content}</div> }));

const group = { tag: '事件退订', questionIds: ['q1', 'q2', 'q3'], points: [] };
const questionMap = new Map([['q1', { categoryId: 'c2' }], ['q2', { categoryId: 'c2' }], ['q3', { categoryId: 'c1' }]]);
const draft = (title, type, extra = {}) => ({
  type, title, promptMd: `题干 ${title}`, difficulty: 'medium', tags: ['事件退订'], payload: {},
  solution: { referenceAnswerMd: '参考', rubricMd: '', explanationMd: '', caseSensitive: false },
  sourceTitle: 'AI 针对薄弱点 · 事件退订', originKind: 'weakness', originWeaknessTag: '事件退订', ...extra,
});
const renderIt = () => render(<MemoryRouter><WeaknessQuestionGenerator group={group} questionMap={questionMap} /></MemoryRouter>);

beforeEach(() => {
  state.draft.mockReset(); state.save.mockReset(); state.refresh.mockReset().mockResolvedValue();
  state.questions = [];
});
afterEach(cleanup);

describe('WeaknessQuestionGenerator', () => {
  it('drafts with explicit types, saves only ticked drafts and defaults to the dominant category', async () => {
    state.draft.mockResolvedValue({ tag: '事件退订', questions: [draft('禁用时退订', 'short_answer'), draft('实现安全订阅', 'algorithm', { payload: { language: 'C#' } })] });
    state.save.mockResolvedValue('new-1');
    renderIt();
    fireEvent.click(screen.getByRole('button', { name: '针对性出题' }));
    fireEvent.click(screen.getByRole('checkbox', { name: '让 AI 搭配题型' }));
    fireEvent.change(screen.getByRole('combobox', { name: '第 1 道' }), { target: { value: 'short_answer' } });
    fireEvent.change(screen.getByRole('combobox', { name: '第 2 道' }), { target: { value: 'algorithm' } });
    fireEvent.click(screen.getByRole('button', { name: '生成题目' }));
    expect(await screen.findByDisplayValue('禁用时退订')).toBeVisible();
    expect(state.draft).toHaveBeenCalledWith({ tag: '事件退订', count: 2, types: ['short_answer', 'algorithm'] });
    expect(screen.getAllByRole('combobox', { name: '分类' }).map((s) => s.value)).toEqual(['c2', 'c2']);

    fireEvent.click(screen.getByRole('checkbox', { name: /保存第 2 道/ }));
    fireEvent.click(screen.getByRole('button', { name: '保存选中的 1 道（私有草稿）' }));
    await waitFor(() => expect(state.save).toHaveBeenCalledTimes(1));
    expect(state.save.mock.calls[0][0]).toMatchObject({ title: '禁用时退订', status: 'draft', visibility: 'private', originKind: 'weakness', originWeaknessTag: '事件退订', categoryId: 'c2' });
    expect(state.refresh).toHaveBeenCalledWith({ silent: true });
    expect(await screen.findByRole('link', { name: '禁用时退订' })).toHaveAttribute('href', '/manage/questions/new-1/edit');
    expect(screen.getByDisplayValue('实现安全订阅')).toBeVisible();
  });

  it('keeps a draft that fails validation while saving the others', async () => {
    state.draft.mockResolvedValue({ tag: '事件退订', questions: [draft('好题', 'short_answer'), draft('坏题', 'short_answer', { promptMd: ' ' })] });
    state.save.mockResolvedValue('ok-1');
    renderIt();
    fireEvent.click(screen.getByRole('button', { name: '针对性出题' }));
    fireEvent.click(screen.getByRole('button', { name: '生成题目' }));
    expect(state.draft.mock.calls.length).toBe(1);
    expect(state.draft.mock.calls[0][0]).toEqual({ tag: '事件退订', count: 2, types: 'auto' });
    fireEvent.click(await screen.findByRole('button', { name: '保存选中的 2 道（私有草稿）' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('题干不能为空');
    expect(state.save).toHaveBeenCalledTimes(1);
    expect(screen.queryByDisplayValue('好题')).toBeNull();
    expect(within(alert.closest('article')).getByDisplayValue('坏题')).toBeVisible();
  });

  it('counts questions already drafted for the same weakness case-insensitively', () => {
    state.questions = [{ id: 'x', originKind: 'weakness', originWeaknessTag: '事件退订' }, { id: 'y', originKind: 'follow_up', originWeaknessTag: null }];
    renderIt();
    expect(screen.getByText('已为此薄弱点出过 1 道')).toBeVisible();
  });
});
