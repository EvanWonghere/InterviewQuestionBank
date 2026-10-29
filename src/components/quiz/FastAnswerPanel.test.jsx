import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import FastAnswerPanel from './FastAnswerPanel';
import QuestionCard from './QuestionCard';

const state = vi.hoisted(() => ({ reveal: vi.fn(), submitted: vi.fn(), assistant: vi.fn() }));
vi.mock('@/data/questionRepository', () => ({ revealCloudQuestion: (...args) => state.reveal(...args) }));
vi.mock('@/components/common/Markdown', () => ({ default: ({ content }) => content ? <div>{content}</div> : null }));
vi.mock('./QuestionContent', () => ({ default: ({ content }) => <p>{content}</p> }));
vi.mock('./ConceptLabLinks', () => ({ default: () => null }));
vi.mock('./AnswerPanel', () => ({ default: ({ assistantEnabled }) => { state.assistant(assistantEnabled); return <div><input aria-label="作答" /><button onClick={state.submitted}>提交</button></div>; } }));
const q = (type, solution, payload = {}) => ({ id: type, type, title: type, question: '题干', payload, solution });
beforeEach(() => state.reveal.mockReset());
afterEach(cleanup);

describe('fast answer', () => {
  it.each(['single_choice', 'multiple_choice'])('shows all options and the correct choice for %s', (type) => {
    render(<FastAnswerPanel question={q(type, { correctOptionIds: ['b'] }, { options: [{ id: 'a', text: '选项甲' }, { id: 'b', text: '选项乙' }] })} />);
    expect(screen.getByText('选项甲')).toBeVisible();
    expect(screen.getByText('选项乙').closest('li')).toHaveTextContent('正确答案');
    expect(screen.getByText('选项甲').closest('li')).not.toHaveTextContent('正确答案');
    expect(state.reveal).not.toHaveBeenCalled();
  });
  it('shows accepted answers per blank and reports a missing blank', () => {
    render(<FastAnswerPanel question={q('fill_blank', { acceptedAnswers: { x: ['甲', '乙'] } }, { blanks: [{ id: 'x', label: '第一空' }, { id: 'y', label: '第二空' }] })} />);
    expect(screen.getByText('第一空')).toBeVisible();
    expect(screen.getByText('甲')).toBeVisible(); expect(screen.getByText('乙')).toBeVisible();
    expect(screen.getByText('第二空').parentElement).toHaveTextContent('暂无此空的参考答案');
  });
  it.each(['short_answer', 'algorithm', 'engineering'])('renders reference and explanation for %s', (type) => {
    render(<FastAnswerPanel question={q(type, { referenceAnswerMd: '参考内容', explanationMd: '解析内容' })} />);
    expect(screen.getByText('参考内容')).toBeVisible(); expect(screen.getByText('解析内容')).toBeVisible();
  });
  it('reports a missing solution instead of pretending it loaded', () => {
    render(<FastAnswerPanel question={q('short_answer', {})} />);
    expect(screen.getByText('暂无参考答案。')).toBeVisible();
  });
  it('allows retry after a cloud failure', async () => {
    state.reveal.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ referenceAnswerMd: '云端答案' });
    render(<FastAnswerPanel question={q('short_answer', null)} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('加载失败');
    fireEvent.click(screen.getByRole('button', { name: '重新加载答案' }));
    expect(await screen.findByText('云端答案')).toBeVisible();
    expect(state.reveal).toHaveBeenCalledTimes(2);
  });
  it('ignores a stale request after switching questions or leaving', async () => {
    let resolveFirst;
    state.reveal.mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce({ referenceAnswerMd: '第二题答案' });
    const { rerender, unmount } = render(<FastAnswerPanel key="first" question={{ ...q('short_answer', null), id: 'first' }} />);
    rerender(<FastAnswerPanel key="second" question={{ ...q('short_answer', null), id: 'second' }} />);
    expect(await screen.findByText('第二题答案')).toBeVisible();
    resolveFirst({ referenceAnswerMd: '第一题私有答案' });
    await waitFor(() => expect(screen.queryByText('第一题私有答案')).toBeNull());
    unmount();
  });
  it('hides the existing form in fast mode without submitting and retains its draft when returning', () => {
    const question = q('short_answer', { referenceAnswerMd: '参考内容' });
    const { rerender } = render(<QuestionCard question={question} />);
    fireEvent.change(screen.getByLabelText('作答'), { target: { value: '未提交草稿' } });
    rerender(<QuestionCard question={question} fast />);
    expect(screen.queryByRole('textbox')).toBeNull(); expect(screen.queryByRole('button', { name: '提交' })).toBeNull();
    expect(screen.getByText('参考内容')).toBeVisible(); expect(state.submitted).not.toHaveBeenCalled();
    expect(state.assistant).toHaveBeenLastCalledWith(false);
    rerender(<QuestionCard question={question} />);
    expect(screen.getByRole('textbox')).toHaveValue('未提交草稿');
    expect(state.assistant).toHaveBeenLastCalledWith(true);
  });
});
