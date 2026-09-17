import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import AnswerPanel from './AnswerPanel';

const state = vi.hoisted(() => ({ recordAttempt: vi.fn(), grade: vi.fn(), rendered: vi.fn(), mounted: vi.fn() }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'admin' }, isAdmin: true, loading: false }) }));
vi.mock('@/data/questionRepository', () => ({ gradeCloudQuestion: (...args) => state.grade(...args) }));
vi.mock('@/store/reviewStore', () => ({ useReviewStore: (select) => select({ recordAttempt: state.recordAttempt }) }));
vi.mock('@/components/ai/TutorEntry', () => ({ default: () => null }));
vi.mock('./NoteEditor', () => ({ default: () => null }));
vi.mock('@/components/common/Markdown', () => ({ default: ({ content }) => <div>{content}</div> }));
vi.mock('@/components/ai/EvaluationEntry', async () => {
  const { useEffect } = await import('react');
  function FakeEvaluationEntry(props) {
    state.rendered(props);
    useEffect(() => { state.mounted(); }, []);
    return <div data-testid="evaluation">evaluation:{props.mode}</div>;
  }
  return { default: FakeEvaluationEntry };
});

const question = { id: 'q1', type: 'short_answer', payload: {} };
const aiEvaluation = { id: 'eval-1', score: 64, suggested_rating: 'hard', result: { weaknesses: [{ tag: '边界', errorReason: 'boundary_case' }, { tag: '实现', errorReason: null }] } };

beforeEach(() => {
  state.recordAttempt.mockReset().mockResolvedValue({});
  state.grade.mockReset().mockResolvedValue({ correct: null, referenceAnswerMd: '参考答案内容', rubricMd: '', explanationMd: '' });
  state.rendered.mockReset();
  state.mounted.mockReset();
});
afterEach(cleanup);

const entryProps = () => state.rendered.mock.lastCall[0];

async function submit(props) {
  render(<AnswerPanel question={question} {...props} />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '我的回答' } });
  fireEvent.click(screen.getByRole('button', { name: /提交/ }));
  await screen.findByTestId('evaluation');
}

describe('AnswerPanel AI evaluation', () => {
  it('keeps the reference hidden in interview mode until the evaluation hands back control', async () => {
    await submit({ evaluationMode: 'interview', sessionId: 's1' });
    expect(entryProps()).toMatchObject({ mode: 'interview', sessionId: 's1', submission: { answerMd: '我的回答' } });
    expect(screen.queryByText('参考答案内容')).toBeNull();
    expect(screen.queryByRole('button', { name: '良好' })).toBeNull();
    entryProps().onEvaluated(aiEvaluation);
    entryProps().onDone();
    expect(await screen.findByText('参考答案内容')).toBeVisible();
    // Revealing keeps the same entry mounted; a remount would re-run the evaluation.
    expect(screen.getByTestId('evaluation')).toBeVisible();
    expect(state.mounted).toHaveBeenCalledTimes(1);
  });

  it('falls back to the normal flow when AI is unavailable', async () => {
    await submit({ evaluationMode: 'interview', sessionId: 's1' });
    entryProps().onUnavailable();
    expect(await screen.findByText('参考答案内容')).toBeVisible();
  });

  it('marks the suggested rating, pre-selects error reasons and links the evaluation to the attempt', async () => {
    await submit({});
    expect(screen.getByText('参考答案内容')).toBeVisible();
    entryProps().onEvaluated(aiEvaluation);
    const hard = await screen.findByRole('button', { name: /困难\s*AI 建议/ });
    expect(hard).toHaveClass('is-suggested');
    expect(screen.getByLabelText('边界遗漏')).toBeChecked();
    expect(screen.getByLabelText('实现错误')).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: '良好' }));
    await waitFor(() => expect(state.recordAttempt).toHaveBeenCalled());
    expect(state.recordAttempt.mock.calls[0][0]).toMatchObject({ quality: 4, aiEvaluationId: 'eval-1', aiScore: 64, errorReasons: ['boundary_case'] });
  });

  it('does not render the evaluation entry when disabled', async () => {
    render(<AnswerPanel question={question} evaluationMode="off" />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: /提交/ }));
    expect(await screen.findByText('参考答案内容')).toBeVisible();
    expect(screen.queryByTestId('evaluation')).toBeNull();
  });
});

describe('AnswerPanel question identity', () => {
  it('keeps the submitted answer when the question list refreshes with new objects', async () => {
    const { rerender } = render(<AnswerPanel question={question} evaluationMode="off" />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '保留我' } });
    fireEvent.click(screen.getByRole('button', { name: /提交/ }));
    expect(await screen.findByText('参考答案内容')).toBeVisible();
    rerender(<AnswerPanel question={{ ...question }} evaluationMode="off" />);
    expect(screen.getByText('参考答案内容')).toBeVisible();
    expect(screen.getByText('保留我')).toBeVisible();
    rerender(<AnswerPanel question={{ ...question, id: 'q2' }} evaluationMode="off" />);
    expect(screen.queryByText('参考答案内容')).toBeNull();
  });
});
