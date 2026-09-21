import { useEffect, useRef, useState } from 'react';
import { aiRequest, evaluateAnswer } from '@/data/aiRepository';
import { REVIEW_RATINGS } from '@/lib/sm2';
import { ChatMarkdown } from './TutorPanel';
import Elapsed from './Elapsed';
import AddFollowUpToBank from './AddFollowUpToBank';
import { ownFollowUpScore } from '../../../supabase/functions/ai-tutor/questionDraft.js';
import { MAX_ROUNDS, partitionWeaknesses } from '../../../supabase/functions/ai-tutor/evaluation.js';
import { useAuth } from '@/context/AuthContext';
import { useAIDraft } from '@/lib/aiDrafts';

const SEVERITY = { high: ['严重', 'chip-difficulty-hard'], mid: ['中等', 'chip-difficulty-medium'], low: ['轻微', 'chip-difficulty-easy'] };

export default function EvaluationPanel({ question, submission, mode = 'practice', sessionId, onEvaluated, onDone, onUnavailable }) {
  const interview = mode === 'interview';
  const { user } = useAuth();
  const [status, setStatus] = useState('checking');
  const [rounds, setRounds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useAIDraft(`${user.id}:${question.id}:${sessionId ?? mode}:followup`);
  const [ended, setEnded] = useState(false);
  const [retry, setRetry] = useState(null);
  const alive = useRef(true);
  const started = useRef(false);
  const callbacks = useRef({ onEvaluated, onDone, onUnavailable });
  useEffect(() => { callbacks.current = { onEvaluated, onDone, onUnavailable }; }, [onEvaluated, onDone, onUnavailable]);

  const run = async (input) => {
    setRetry(null);
    setBusy(true);
    setError('');
    try {
      const evaluation = await evaluateAnswer(input);
      if (!alive.current) return;
      setRounds((prev) => [...prev.filter((r) => r.id !== evaluation.id), evaluation]);
      setDraft('');
      callbacks.current.onEvaluated?.(evaluation);
    } catch (e) {
      if (!alive.current) return;
      // Network loss, gateway errors and a still-running request may have saved a
      // result. Only a confirmed terminal failure permits a new generation id.
      setRetry(e.settled === true ? { ...input, requestId: crypto.randomUUID() } : input);
      setError(e.message);
    } finally {
      if (alive.current) setBusy(false);
    }
  };

  useEffect(() => {
    alive.current = true;
    if (started.current) return () => { alive.current = false; };
    started.current = true;
    aiRequest({ action: 'settings' })
      .then((config) => {
        if (!alive.current) return;
        if (!config.configured || !config.settings.model) {
          setStatus('unavailable');
          callbacks.current.onUnavailable?.();
          return;
        }
        setStatus('ready');
        void run({ questionId: question.id, requestId: crypto.randomUUID(), mode, sessionId, submission: structuredClone(submission ?? {}) });
      })
      .catch((e) => {
        if (!alive.current) return;
        setStatus('unavailable');
        setError(e.message);
        callbacks.current.onUnavailable?.();
      });
    return () => { alive.current = false; };
    // The panel evaluates the submission that existed when it opened; AnswerPanel keys it per question.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const latest = rounds.at(-1);
  const followUp = latest?.result?.followUp;
  const canFollowUp = Boolean(followUp) && !ended && latest.round < MAX_ROUNDS[mode];
  const finished = Boolean(latest) && !busy && !canFollowUp;

  const answerFollowUp = (event) => {
    event.preventDefault();
    if (!draft.trim() || busy || !latest) return;
    void run({ questionId: question.id, requestId: crypto.randomUUID(), mode, sessionId, parentId: latest.id, answerMd: draft });
  };
  const finish = () => {
    setEnded(true);
    callbacks.current.onDone?.();
  };

  if (status === 'unavailable') {
    if (interview) return null;
    return <p className="type-caption" style={{ color: 'var(--text-tertiary)' }}>{error || 'AI评估不可用：请先在“问学习助手 → API设置”中配置模型。'}</p>;
  }

  return (
    <section className="ai-evaluation" aria-label="AI评估">
      <div className="flex items-center justify-between gap-3">
        <p className="type-eyebrow" style={{ color: 'var(--apple-blue)' }}>{interview ? 'AI 面试官' : 'AI 评估'}</p>
        <p className="type-micro" style={{ color: 'var(--text-tertiary)' }}>AI生成 · 建议仅供参考，评分仍由你确认</p>
      </div>

      {rounds.map((evaluation) => <RoundCard key={evaluation.id} evaluation={evaluation} mode={mode} categoryId={question.categoryId} />)}

      {(status === 'checking' || busy) && <p role="status" className="type-caption mt-3">{rounds.length ? 'AI 正在思考并评估你的追问回答…' : 'AI 正在对照评分标准思考评估…'}{busy && <Elapsed />}</p>}

      {error && !busy && (
        <div className="mt-3">
          <p role="alert" className="ai-error">{error}</p>
          <div className="flex flex-wrap gap-2">
            {retry && <button type="button" className="btn-neutral" onClick={() => run(retry)}>重试</button>}
            {interview && <button type="button" className="btn-neutral" onClick={finish}>{rounds.length ? '结束追问，查看参考答案' : '跳过AI评估'}</button>}
          </div>
        </div>
      )}

      {canFollowUp && !busy && (
        <form className="ai-followup mt-4" onSubmit={answerFollowUp}>
          <p className="type-caption-bold">追问 {latest.round}/{MAX_ROUNDS[mode] - 1}</p>
          <ChatMarkdown content={followUp.question} />
          {followUp.targets && <p className="type-micro mt-1" style={{ color: 'var(--text-tertiary)' }}>考察：{followUp.targets}</p>}
          <textarea
            aria-label="回答追问"
            className="input-apple mt-3 min-h-28 resize-y font-mono"
            value={draft}
            maxLength={8000}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="像面试时一样简洁作答…"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="btn-blue" disabled={!draft.trim()}>回答追问</button>
            <button type="button" className="btn-neutral" onClick={finish}>{interview ? '跳过追问，查看参考答案' : '结束追问'}</button>
          </div>
        </form>
      )}

      {finished && interview && !ended && (
        <button type="button" className="btn-blue mt-4" onClick={finish}>查看参考答案并自评</button>
      )}
    </section>
  );
}

function WeaknessList({ title, items, hint }) {
  if (!items?.length) return null;
  return (
    <div className="mt-4">
      <p className="type-caption-bold" style={{ color: 'var(--warning-fg)' }}>{title}</p>
      {hint && <p className="type-micro mt-1" style={{ color: 'var(--text-tertiary)' }}>{hint}</p>}
      <ul className="mt-1 space-y-2">
        {items.map((w) => (
          <li key={`${w.tag}-${w.point}`} className="type-caption">
            <span className={`chip mr-2 ${SEVERITY[w.severity]?.[1] ?? ''}`}>{w.tag} · {SEVERITY[w.severity]?.[0]}</span>
            {w.point}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoundCard({ evaluation, mode, categoryId }) {
  const r = evaluation.result ?? {};
  const isFollowUp = evaluation.round > 1;
  const ownScore = isFollowUp ? ownFollowUpScore(evaluation) : null;
  const { thisAnswer, unresolved, unlabeled } = partitionWeaknesses(r.weaknesses, { isFollowUp });
  return (
    <article className="ai-eval-round mt-4">
      {isFollowUp && (
        <div className="ai-eval-followup mb-3">
          <p className="type-micro-bold">追问 {evaluation.round - 1}</p>
          <ChatMarkdown content={evaluation.follow_up_question ?? ''} />
          <p className="type-micro-bold mt-2">我的回答</p>
          <p className="type-caption whitespace-pre-wrap">{evaluation.submission?.answerMd}</p>
          <p className="type-micro mt-2" style={{ color: 'var(--text-tertiary)' }}>
            {ownScore != null ? `这轮追问回答得分 ${ownScore}` : '这条记录没有单独的本轮评分，下面只有综合掌握分'}
          </p>
          {mode === 'interview'
            ? <p className="type-micro mt-1" style={{ color: 'var(--text-tertiary)' }}>面试结束后可在“薄弱知识点 → 待入库的追问”中加入题库。</p>
            : <AddFollowUpToBank evaluation={evaluation} sourceCategoryId={categoryId} />}
        </div>
      )}
      <div className="flex items-start gap-4">
        <div className="ai-eval-score" aria-label={isFollowUp ? `综合掌握 ${evaluation.score}` : `AI评分 ${evaluation.score}`}>
          <span className="type-display-md">{evaluation.score}</span>
          <span className="type-micro">{isFollowUp ? '综合掌握 /100' : '/100'}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="type-body-emphasis">{r.verdict}</p>
          {evaluation.suggested_rating && (
            <p className="type-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>建议掌握程度：{REVIEW_RATINGS[evaluation.suggested_rating]?.label}</p>
          )}
        </div>
      </div>

      {r.dimensions?.length > 0 && (
        <ul className="mt-4 space-y-2">
          {r.dimensions.map((d) => (
            <li key={d.name} className="ai-eval-dimension">
              <span className="type-caption-bold">{d.name}</span>
              <span className="progress-track"><span className="progress-fill" style={{ width: `${(d.score / 5) * 100}%` }} /></span>
              <span className="type-micro tabular-nums">{d.score}/5</span>
              {d.comment && <span className="type-micro ai-eval-comment">{d.comment}</span>}
            </li>
          ))}
        </ul>
      )}

      {r.strengths?.length > 0 && (
        <div className="mt-4">
          <p className="type-caption-bold" style={{ color: 'var(--success-fg)' }}>做得好</p>
          <ul className="mt-1 list-disc pl-5 type-caption">{r.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      )}

      {isFollowUp ? (
        <>
          <WeaknessList title="这轮追问回答里的问题" items={thisAnswer} />
          <WeaknessList title="原题仍未纠正" items={unresolved} hint="这些问题来自原题作答，这轮追问里没有再说同样的话。" />
          <WeaknessList title="待加强" items={unlabeled} hint="未标明来自哪一轮，可能包含原题未纠正的问题，不代表你在追问里又说了同样的话。" />
        </>
      ) : (
        <WeaknessList title="待加强" items={r.weaknesses} />
      )}

      {r.summaryMd && <div className="mt-4"><ChatMarkdown content={r.summaryMd} /></div>}
    </article>
  );
}
