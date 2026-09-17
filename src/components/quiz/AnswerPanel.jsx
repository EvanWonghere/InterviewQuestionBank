import { useCallback, useMemo, useRef, useState } from 'react';
import Markdown from '@/components/common/Markdown';
import { gradeCloudQuestion } from '@/data/questionRepository';
import { gradeObjective, isObjectiveType } from '@/lib/grading';
import { REVIEW_RATINGS } from '@/lib/sm2';
import { useAuth } from '@/context/AuthContext';
import { useReviewStore } from '@/store/reviewStore';
import { useProgressStore } from '@/store/progressStore';
import NoteEditor from './NoteEditor';
import SubmissionView from './SubmissionView';
import TutorEntry from '@/components/ai/TutorEntry';
import EvaluationEntry from '@/components/ai/EvaluationEntry';
import { constrainRating } from '../../../supabase/functions/ai-tutor/evaluation.js';

const ERROR_REASONS = [
  ['concept_gap', '知识盲区'],
  ['pattern_missing', '模式未识别'],
  ['spec_misread', '规格误读'],
  ['boundary_case', '边界遗漏'],
  ['complexity', '复杂度错误'],
  ['implementation_bug', '实现错误'],
  ['careless', '粗心'],
];

function initialSubmission(question) {
  if (question.type === 'single_choice') return { optionId: '' };
  if (question.type === 'multiple_choice') return { optionIds: [] };
  if (question.type === 'fill_blank') return { answers: {} };
  return { answerMd: '' };
}

export default function AnswerPanel(props) {
  return <AnswerPanelState key={props.question.id} {...props} />;
}

function AnswerPanelState({ question, onRated, assistantEnabled = true, evaluationMode = 'practice', sessionId }) {
  const { user, isAdmin } = useAuth();
  const recordAttempt = useReviewStore((state) => state.recordAttempt);
  const setProgress = useProgressStore((state) => state.setProgress);
  const assistance = useRef(false);
  const submitted = useRef(false);
  const [assisted, setAssisted] = useState(false);
  const [submission, setSubmission] = useState(() => initialSubmission(question));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [errorReasons, setErrorReasons] = useState([]);
  const [customErrorReason, setCustomErrorReason] = useState('');
  const [aiEvaluation, setAiEvaluation] = useState(null);
  // Interview mode keeps the reference hidden until the AI follow-ups finish, are skipped, or AI is unavailable.
  const [revealed, setRevealed] = useState(evaluationMode !== 'interview');
  const reveal = useCallback(() => setRevealed(true), []);
  const applyEvaluation = useCallback((evaluation) => {
    setAiEvaluation(evaluation);
    const reasons = (evaluation.result?.weaknesses ?? []).map((w) => w.errorReason).filter(Boolean);
    if (reasons.length) setErrorReasons((items) => [...new Set([...items, ...reasons])]);
  }, []);

  const canSubmit = useMemo(() => {
    if (question.type === 'single_choice') return Boolean(submission.optionId);
    if (question.type === 'multiple_choice') return submission.optionIds.length > 0;
    if (question.type === 'fill_blank') return (question.payload?.blanks ?? []).every((blank) => submission.answers[blank.id]?.trim());
    return Boolean(submission.answerMd.trim());
  }, [question, submission]);

  const submit = async () => {
    if (!canSubmit || loading) return;
    submitted.current = true;
    setLoading(true);
    setError('');
    try {
      if (question.solution) {
        setResult({
          correct: gradeObjective(question, submission),
          referenceAnswerMd: question.solution.referenceAnswerMd ?? question.answer ?? '',
          rubricMd: question.solution.rubricMd ?? '',
          explanationMd: question.solution.explanationMd ?? '',
        });
      } else {
        setResult(await gradeCloudQuestion(question.id, submission));
      }
    } catch (err) {
      submitted.current = false;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const rate = async (ratingKey) => {
    const rating = REVIEW_RATINGS[ratingKey];
    if (!rating || saved) return;
    setLoading(true);
    setError('');
    try {
      await recordAttempt({
        userId: isAdmin ? user?.id ?? null : null,
        questionId: question.id,
        submission,
        correct: result?.correct,
        quality: rating.quality,
        errorReasons,
        customErrorReason,
        assistanceUsed: assistance.current,
        aiEvaluationId: aiEvaluation?.id ?? null,
        aiScore: aiEvaluation?.score ?? null,
      });
      const legacyStatus = rating.quality < 3 ? 'wrong' : rating.quality === 3 ? 'review' : 'mastered';
      setProgress(question.id, legacyStatus);
      setSaved(true);
      onRated?.(legacyStatus);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const allowedRatings = result?.correct === false ? ['again'] : result?.correct === true ? ['hard', 'good', 'easy'] : ['again', 'hard', 'good', 'easy'];
  const suggestedRating = aiEvaluation?.suggested_rating ? constrainRating(aiEvaluation.suggested_rating, result?.correct) : null;
  const evaluation = result && evaluationMode !== 'off' && (
    <EvaluationEntry
      key={question.id}
      question={question}
      submission={submission}
      mode={evaluationMode}
      sessionId={sessionId}
      onEvaluated={applyEvaluation}
      onDone={reveal}
      onUnavailable={reveal}
    />
  );

  return (
    <section className="mt-6 divider-subtle pt-6">
      {!result && (
        <div className="space-y-4">
          <ResponseInput question={question} submission={submission} setSubmission={setSubmission} />
          <button type="button" className="btn-blue" disabled={!canSubmit || loading} onClick={submit}>
            {loading ? '提交中…' : isObjectiveType(question.type) ? '提交答案' : '提交并查看参考答案'}
          </button>
        </div>
      )}

      {result && (
        <details className="submission-card mb-5" open>
          <summary><span className="type-eyebrow" style={{ color: 'var(--apple-blue)' }}>我的回答</span></summary>
          <SubmissionView question={question} submission={submission} />
        </details>
      )}

      {/* One stable position so revealing the reference does not remount (and re-run) the evaluation. */}
      {evaluation && <div className="mb-5">{evaluation}</div>}

      {result && revealed && (
        <div className="space-y-5">
          {typeof result.correct === 'boolean' && (
            <div className={`result-banner ${result.correct ? 'is-correct' : 'is-wrong'}`} role="status">
              {result.correct ? '回答正确' : '回答错误'}
            </div>
          )}
          {(result.referenceAnswerMd || result.explanationMd || result.rubricMd) && (
            <div className="answer-block rounded-2xl p-6" style={{ background: 'var(--filter-bg)', border: '1px solid var(--border-subtle)' }}>
              <p className="type-eyebrow mb-3" style={{ color: 'var(--apple-blue)' }}>参考答案与解析</p>
              <Markdown content={result.referenceAnswerMd || result.explanationMd} />
              {result.explanationMd && result.referenceAnswerMd && <Markdown content={result.explanationMd} className="mt-4" />}
              {result.rubricMd && <><p className="type-eyebrow mt-5 mb-2">评分标准</p><Markdown content={result.rubricMd} /></>}
            </div>
          )}

          {(!result.correct || allowedRatings.includes('again')) && !saved && (
            <div>
              <p className="type-caption-bold mb-2" style={{ color: 'var(--text-secondary)' }}>错误原因（可多选）</p>
              <div className="flex flex-wrap gap-2">
                {ERROR_REASONS.map(([value, label]) => (
                  <label key={value} className={`filter-pill cursor-pointer ${errorReasons.includes(value) ? 'is-active' : ''}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={errorReasons.includes(value)}
                      onChange={() => setErrorReasons((items) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value])}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <input className="input-apple mt-3" value={customErrorReason} onChange={(event) => setCustomErrorReason(event.target.value)} placeholder="其他原因（可选）" />
            </div>
          )}

          {!saved ? (
            <div>
              <p className="type-caption mb-2" style={{ color: 'var(--text-tertiary)' }}>本次掌握程度</p>
              <div className="flex flex-wrap gap-2">
                {allowedRatings.map((key) => (
                  <button key={key} type="button" disabled={loading} onClick={() => rate(key)} className={`btn-status rating-${key}${key === suggestedRating ? ' is-suggested' : ''}`}>
                    {REVIEW_RATINGS[key].label}
                    {key === suggestedRating && <span className="ai-suggest-badge">AI 建议</span>}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="type-caption" style={{ color: 'var(--success-fg)' }}>已记录，本题已进入自适应复习计划。</p>
          )}
          <NoteEditor questionId={question.id} />
        </div>
      )}
      {assisted && <p className="type-caption mt-3">本次作答使用过AI辅助；对错与自评仍由原流程记录。</p>}
      <TutorEntry enabled={assistantEnabled} question={question} phase={result ? 'review' : 'hint'} submission={submission} onAssistance={() => { if (!submitted.current) { assistance.current = true; setAssisted(true); } }} />
      {error && <p className="type-caption mt-3" style={{ color: 'var(--error-fg)' }}>{error}</p>}
    </section>
  );
}

function ResponseInput({ question, submission, setSubmission }) {
  if (question.type === 'single_choice' || question.type === 'multiple_choice') {
    const multiple = question.type === 'multiple_choice';
    return (
      <fieldset className="space-y-2">
        <legend className="type-caption-bold mb-2">{multiple ? '选择所有正确答案' : '选择一个答案'}</legend>
        {(question.payload?.options ?? []).map((option) => {
          const checked = multiple ? submission.optionIds.includes(option.id) : submission.optionId === option.id;
          return (
            <label key={option.id} className={`answer-option ${checked ? 'is-selected' : ''}`}>
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name={`answer-${question.id}`}
                checked={checked}
                onChange={() => setSubmission(multiple
                  ? { optionIds: checked ? submission.optionIds.filter((id) => id !== option.id) : [...submission.optionIds, option.id] }
                  : { optionId: option.id })}
              />
              <Markdown content={option.text} />
            </label>
          );
        })}
      </fieldset>
    );
  }
  if (question.type === 'fill_blank') {
    return (
      <div className="space-y-3">
        {(question.payload?.blanks ?? []).map((blank) => (
          <label key={blank.id} className="block">
            <span className="type-caption-bold mb-1 block">{blank.label}</span>
            <input className="input-apple" value={submission.answers[blank.id] ?? ''} onChange={(event) => setSubmission({ answers: { ...submission.answers, [blank.id]: event.target.value } })} />
          </label>
        ))}
      </div>
    );
  }
  return (
    <textarea
      className="input-apple min-h-40 resize-y font-mono"
      value={submission.answerMd}
      onChange={(event) => setSubmission({ answerMd: event.target.value })}
      placeholder={question.type === 'algorithm' ? '写下思路、复杂度或代码…' : question.type === 'engineering' ? '写下设计、状态、边界和验收方法…' : '用自己的话作答…'}
    />
  );
}
