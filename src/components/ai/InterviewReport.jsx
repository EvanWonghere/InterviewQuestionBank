import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { latestReport, listEvaluations, requestInterviewReport } from '@/data/aiRepository';
import { ChatMarkdown } from './TutorPanel';

// Admin-only session recap. Generates once per session; revisits reuse the stored report.
export default function InterviewReport({ sessionId, questions }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading || !user || !isAdmin || !sessionId) return null;
  return <ReportState key={`${user.id}:${sessionId}`} sessionId={sessionId} questions={questions} />;
}

function ReportState({ sessionId, questions }) {
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const requestId = useRef(crypto.randomUUID());
  const started = useRef(false);
  const titleFor = (id) => questions.find((q) => q.id === id)?.title ?? '已归档题目';

  const generate = async () => {
    setStatus('generating');
    setError('');
    try {
      setReport(await requestInterviewReport({ sessionId, requestId: requestId.current }));
      setStatus('ready');
    } catch (e) {
      // Keep the id unless the server confirms a terminal failure.
      if (e.settled === true) requestId.current = crypto.randomUUID();
      setError(e.message);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const existing = await latestReport('interview', { sessionId });
        if (existing) { setReport(existing); setStatus('ready'); return; }
        const evaluations = await listEvaluations({ sessionId, limit: 1 });
        if (!evaluations.length) { setStatus('empty'); return; }
        await generate();
      } catch (e) {
        setError(e.message);
        setStatus('error');
      }
    })();
    // generate reads the stable request ref; run once per session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'empty') return null;
  const r = report?.result;

  return (
    <section className="ai-evaluation mb-7 text-left" aria-label="AI面试报告">
      <p className="type-eyebrow" style={{ color: 'var(--apple-blue)' }}>AI 面试报告</p>
      {(status === 'loading' || status === 'generating') && <p role="status" className="type-caption mt-3">{status === 'loading' ? '正在读取本场评估…' : 'AI 正在汇总本场表现…'}</p>}
      {status === 'error' && (
        <div className="mt-3">
          <p role="alert" className="ai-error">{error}</p>
          <button type="button" className="btn-neutral" onClick={generate}>重新生成</button>
        </div>
      )}
      {r && (
        <>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="type-display-md">{r.overallScore}</span>
            <span className="type-caption" style={{ color: 'var(--text-tertiary)' }}>/100 综合评分</span>
          </div>
          {r.summaryMd && <div className="mt-3"><ChatMarkdown content={r.summaryMd} /></div>}

          {r.questionScores?.length > 0 && (
            <ul className="mt-4 space-y-1">
              {r.questionScores.map((item) => (
                <li key={item.questionId} className="flex items-center justify-between gap-3 type-caption">
                  <span className="truncate">{titleFor(item.questionId)}</span>
                  <span className="shrink-0 tabular-nums" style={{ color: 'var(--text-tertiary)' }}>{item.score ?? '—'} 分{item.rounds > 1 ? ` · 追问 ${item.rounds - 1} 轮` : ''}</span>
                </li>
              ))}
            </ul>
          )}

          {r.strengths?.length > 0 && (
            <div className="mt-4">
              <p className="type-caption-bold" style={{ color: 'var(--success-fg)' }}>优势</p>
              <ul className="mt-1 list-disc pl-5 type-caption">{r.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          )}
          {r.weaknesses?.length > 0 && (
            <div className="mt-4">
              <p className="type-caption-bold" style={{ color: 'var(--warning-fg)' }}>待加强</p>
              <ul className="mt-1 space-y-2">
                {r.weaknesses.map((w) => (
                  <li key={w.tag} className="type-caption">
                    <span className="chip mr-2">{w.tag}</span>{w.detail}
                    {w.questionIds.length > 0 && (
                      <span className="mt-1 flex flex-wrap gap-2">
                        {w.questionIds.map((id) => <Link key={id} to={`/quiz?q=${encodeURIComponent(titleFor(id))}`} style={{ color: 'var(--accent)' }}>{titleFor(id)}</Link>)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {r.studyPlan?.length > 0 && (
            <div className="mt-4">
              <p className="type-caption-bold">学习计划</p>
              <ol className="mt-1 list-decimal pl-5 type-caption">{r.studyPlan.map((s) => <li key={s}>{s}</li>)}</ol>
            </div>
          )}
          <p className="type-micro mt-4" style={{ color: 'var(--text-tertiary)' }}>AI生成 · 基于本场逐题评估，请结合参考答案核对</p>
        </>
      )}
    </section>
  );
}
