import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { latestReport, listEvaluations, requestWeaknessReport } from '@/data/aiRepository';
import { ChatMarkdown } from '@/components/ai/ChatMarkdown';
import Elapsed from './Elapsed';
import AddFollowUpToBank from './AddFollowUpToBank';
import WeaknessQuestionGenerator from './WeaknessQuestionGenerator';
import ConceptLabLinks from '@/components/quiz/ConceptLabLinks';
import { useQuestions } from '@/context/QuestionsContext';
import { followUpScore, ownFollowUpScore, WEAK_FOLLOW_UP_SCORE } from '../../../supabase/functions/ai-tutor/questionDraft.js';
import { aggregateWeaknesses } from '../../../supabase/functions/ai-tutor/evaluation.js';
import { questionHref } from '@/lib/questionNavigation';

// Loaded lazily by ReviewPage after the admin check.
export default function WeaknessInsights({ questionMap }) {
  const [evaluations, setEvaluations] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const requestId = useRef(crypto.randomUUID());

  useEffect(() => {
    let alive = true;
    Promise.all([listEvaluations({ limit: 200 }), latestReport('weakness')])
      .then(([rows, latest]) => { if (alive) { setEvaluations(rows); setReport(latest); } })
      .catch((e) => { if (alive) { setEvaluations([]); setError(e.message); } });
    return () => { alive = false; };
  }, []);

  const groups = useMemo(() => aggregateWeaknesses(evaluations ?? []), [evaluations]);
  const { questions } = useQuestions();
  // Answered follow-ups that went poorly and have not produced a question yet.
  const pendingFollowUps = useMemo(() => {
    const added = new Set(questions.map((q) => q.originEvaluationId).filter(Boolean));
    return (evaluations ?? [])
      .filter((e) => e.round > 1 && e.follow_up_question && !added.has(e.id) && (followUpScore(e) ?? 100) < WEAK_FOLLOW_UP_SCORE)
      .slice(0, 10);
  }, [evaluations, questions]);
  const questionFor = (id) => questionMap.get(id) ?? null;
  const titleFor = (id) => questionFor(id)?.title;

  const generate = async () => {
    setGenerating(true);
    setError('');
    try {
      setReport(await requestWeaknessReport({ requestId: requestId.current }));
      requestId.current = crypto.randomUUID();
    } catch (e) {
      if (e.settled === true) requestId.current = crypto.randomUUID();
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const questionLinks = (ids, max = 3) => ids.filter((id) => questionFor(id)).slice(0, max).map((id) => {
    const question = questionFor(id);
    return (
      <span key={id} className="inline-flex flex-col gap-1">
        <Link to={questionHref(question)} className="type-caption" style={{ color: 'var(--accent)' }}>{question.title}</Link>
        <ConceptLabLinks question={question} compact />
      </span>
    );
  });

  return (
    <section className="mb-10" aria-labelledby="ai-weakness-title">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="ai-weakness-title" className="type-card-title">AI 评估中的薄弱点</h2>
        {evaluations && <span className="type-caption" style={{ color: 'var(--text-tertiary)' }}>基于最近 {evaluations.length} 次 AI 评估</span>}
      </div>
      {!evaluations && <p role="status" className="type-caption">正在读取AI评估…</p>}
      {evaluations && !groups.length && !error && (
        <p className="surface-card p-5 type-caption" style={{ color: 'var(--text-tertiary)' }}>还没有带薄弱点的 AI 评估。提交主观题后点击“AI 评估我的回答”，或完成一场模拟面试。</p>
      )}

      {groups.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <article key={g.tag} className="surface-card weakness-card p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="type-body-emphasis">{g.tag}</span>
                <span className="flex shrink-0 gap-1">
                  <span className="chip">{g.count} 题</span>
                  {g.avgScore != null && <span className={`chip ${g.avgScore < 60 ? 'chip-difficulty-hard' : g.avgScore < 80 ? 'chip-difficulty-medium' : 'chip-difficulty-easy'}`}>均分 {g.avgScore}</span>}
                </span>
              </div>
              <p className="type-micro mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {g.openQuestionIds.length === 0
                  ? '最近一轮评估已不再列出这个薄弱点；是否真的掌握仍由你判断。'
                  : `最近一轮评估仍列出 ${g.openQuestionIds.length}/${g.count} 题。`}
              </p>
              <ul className="mt-2 list-disc pl-5 type-caption" style={{ color: 'var(--text-secondary)' }}>{g.points.map((p) => <li key={p}>{p}</li>)}</ul>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">{questionLinks(g.questionIds)}</div>
              <WeaknessQuestionGenerator group={g} questionMap={questionMap} />
            </article>
          ))}
        </div>
      )}

      {groups.length > 0 && (
        <div className="ai-evaluation mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="type-eyebrow" style={{ color: 'var(--apple-blue)' }}>AI 学习建议</p>
            <button type="button" className="btn-blue-outline" disabled={generating} onClick={generate}>{generating ? '生成中…' : report ? '重新生成' : '生成 AI 学习建议'}</button>
          </div>
          {generating && <p role="status" className="type-caption mt-2">AI 正在分析薄弱点…<Elapsed /></p>}
          {report?.result && (
            <>
              <p className="type-micro mt-2" style={{ color: 'var(--text-tertiary)' }}>
                生成于 {new Date(report.created_at).toLocaleString()} · 基于 {report.result.basedOn ?? '—'} 次评估
              </p>
              <div className="mt-3"><ChatMarkdown content={report.result.summaryMd} /></div>
              <div className="mt-4 space-y-4">
                {report.result.focusAreas.map((f) => (
                  <div key={f.tag}>
                    <p className="type-body-emphasis">{f.tag}</p>
                    {f.diagnosis && <p className="type-caption mt-1">{f.diagnosis}</p>}
                    {f.drills.length > 0 && <ul className="mt-1 list-disc pl-5 type-caption">{f.drills.map((d) => <li key={d}>{d}</li>)}</ul>}
                    {f.questionIds.length > 0 && <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1"><span className="type-caption" style={{ color: 'var(--text-tertiary)' }}>建议重做：</span>{questionLinks(f.questionIds, 5)}</div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {pendingFollowUps.length > 0 && (
        <div className="mt-6">
          <h3 className="type-body-emphasis">待入库的追问</h3>
          <p className="type-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>回答得分低于 {WEAK_FOLLOW_UP_SCORE} 的追问（含模拟面试），可一键生成题目加入题库。没有本轮单独评分的旧记录按综合掌握分列出。</p>
          <div className="mt-3 space-y-3">
            {pendingFollowUps.map((e) => (
              <article key={e.id} className="surface-card p-5">
                <p className="type-micro" style={{ color: 'var(--text-tertiary)' }}>
                  来自：{titleFor(e.question_id) ?? '已归档题目'} · {e.mode === 'interview' ? '模拟面试' : '刷题'} ·{' '}
                  {ownFollowUpScore(e) != null ? `回答得分 ${ownFollowUpScore(e)}` : `综合掌握 ${followUpScore(e)}（无本轮单独评分）`}
                </p>
                <div className="mt-2"><ChatMarkdown content={e.follow_up_question} /></div>
                {e.submission?.answerMd && (
                  <details className="mt-2">
                    <summary className="type-caption cursor-pointer">我的回答</summary>
                    <pre className="submission-text mt-2">{e.submission.answerMd}</pre>
                  </details>
                )}
                <AddFollowUpToBank evaluation={e} sourceCategoryId={questionMap.get(e.question_id)?.categoryId} />
              </article>
            ))}
          </div>
        </div>
      )}
      {error && <p role="alert" className="ai-error mt-3">{error}</p>}
    </section>
  );
}
