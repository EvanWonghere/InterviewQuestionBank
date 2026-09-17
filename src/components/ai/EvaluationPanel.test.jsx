import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import EvaluationPanel from './EvaluationPanel';

const state = vi.hoisted(() => ({ settings: null, evaluate: vi.fn() }));
vi.mock('@/data/aiRepository', () => ({
  aiRequest: async () => state.settings,
  evaluateAnswer: (...args) => state.evaluate(...args),
}));
vi.mock('./TutorPanel', () => ({ ChatMarkdown: ({ content }) => <div>{content}</div> }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'admin' } }) }));
vi.mock('./AddFollowUpToBank', () => ({ default: ({ evaluation }) => <div data-testid="add-to-bank">bank:{evaluation.id}</div> }));

const question = { id: 'q1' };
const evaluation = (round, followUp, extra = {}) => ({
  id: `e${round}`, round, score: 50 + round * 10, suggested_rating: 'hard', follow_up_question: round > 1 ? `追问${round - 1}` : null,
  submission: round > 1 ? { answerMd: `回答${round}` } : { answerMd: '初答' },
  result: { verdict: `第${round}轮结论`, dimensions: [{ name: '正确性', score: 3, comment: '' }], strengths: ['清晰'], weaknesses: [{ tag: '边界', point: '漏了空输入', errorReason: 'boundary_case', severity: 'high' }], followUp, summaryMd: '' },
  ...extra,
});

beforeEach(() => {
  sessionStorage.clear();
  state.settings = { configured: true, settings: { model: 'm' } };
  state.evaluate.mockReset();
});
afterEach(cleanup);

describe('EvaluationPanel', () => {
  it('evaluates on open, answers a follow-up as a chained request and reports each round', async () => {
    const onEvaluated = vi.fn();
    state.evaluate
      .mockResolvedValueOnce(evaluation(1, { question: '追问1', targets: '边界' }))
      .mockResolvedValueOnce(evaluation(2, null));
    render(<EvaluationPanel question={question} submission={{ answerMd: '初答' }} onEvaluated={onEvaluated} />);
    expect(await screen.findByText('第1轮结论')).toBeVisible();
    expect(state.evaluate).toHaveBeenCalledWith(expect.objectContaining({ questionId: 'q1', mode: 'practice', submission: { answerMd: '初答' } }));
    expect(screen.getByText('建议掌握程度：困难')).toBeVisible();
    expect(screen.getByText('考察：边界')).toBeVisible();

    fireEvent.change(screen.getByLabelText('回答追问'), { target: { value: '返回空列表' } });
    fireEvent.click(screen.getByRole('button', { name: '回答追问' }));
    expect(await screen.findByText('第2轮结论')).toBeVisible();
    expect(state.evaluate.mock.calls[1][0]).toMatchObject({ parentId: 'e1', answerMd: '返回空列表' });
    expect(state.evaluate.mock.calls[1][0].requestId).not.toBe(state.evaluate.mock.calls[0][0].requestId);
    expect(onEvaluated).toHaveBeenCalledTimes(2);
    expect(screen.queryByLabelText('回答追问')).toBeNull();
    // Answered follow-ups offer the question-bank action in practice mode.
    expect(screen.getByTestId('add-to-bank')).toHaveTextContent('bank:e2');
  });

  it('hides follow-ups at the interview round limit and hands control back', async () => {
    const onDone = vi.fn();
    state.evaluate.mockResolvedValueOnce(evaluation(3, { question: '还想追问', targets: '' }));
    render(<EvaluationPanel question={question} submission={{}} mode="interview" sessionId="s" onDone={onDone} />);
    expect(await screen.findByText('第3轮结论')).toBeVisible();
    expect(screen.queryByLabelText('回答追问')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '查看参考答案并自评' }));
    expect(onDone).toHaveBeenCalled();
  });

  it('keeps the request id until the server confirms a terminal failure', async () => {
    state.evaluate
      .mockRejectedValueOnce(Object.assign(new Error('网络中断'), { status: undefined }))
      .mockRejectedValueOnce(Object.assign(new Error('仍在进行'), { status: 409, settled: false }))
      .mockRejectedValueOnce(Object.assign(new Error('模型未返回有效的评估格式'), { status: 502, settled: true }))
      .mockResolvedValueOnce(evaluation(1, null));
    render(<EvaluationPanel question={question} submission={{}} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('网络中断');
    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('仍在进行');
    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('有效的评估格式');
    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(await screen.findByText('第1轮结论')).toBeVisible();
    const ids = state.evaluate.mock.calls.map((c) => c[0].requestId);
    expect(ids[1]).toBe(ids[0]);
    expect(ids[2]).toBe(ids[1]);
    expect(ids[3]).not.toBe(ids[2]);
  });

  it('reports unavailability when the model is not configured', async () => {
    state.settings = { configured: false, settings: { model: '' } };
    const onUnavailable = vi.fn();
    const { container } = render(<EvaluationPanel question={question} submission={{}} mode="interview" sessionId="s" onUnavailable={onUnavailable} />);
    await waitFor(() => expect(onUnavailable).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
    expect(state.evaluate).not.toHaveBeenCalled();
  });
});
