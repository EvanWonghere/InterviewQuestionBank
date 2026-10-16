import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuestions } from '@/context/QuestionsContext';
import { getMockPaper, mockQuestionIds, MOCK_TYPES, MOCK_LABELS, selectMockQuestions } from '@/data/gbitsMockPapers';
import { hasAnswer, initialSubmission, isComplete, loadMockStore, saveMockStore, startMock, updateMock } from '@/lib/gbitsMock';
import { gradeObjective } from '@/lib/grading';
import { gradeCloudQuestion } from '@/data/questionRepository';
import Markdown from '@/components/common/Markdown';
import SubmissionView from '@/components/quiz/SubmissionView';

function download(value, name) {
  const url = URL.createObjectURL(new Blob([value], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
export default function GbitsWrittenMockPage() {
  const { paperId } = useParams();
  const paper = getMockPaper(paperId);
  return paper ? <MockSession key={paper.id} paper={paper} /> : <main className="p-6"><p role="alert">未找到这张冲刺卷。</p><Link to="/topics/gbits">返回专题</Link></main>;
}
function MockSession({ paper }) {
  const { questions, loading, error: questionError } = useQuestions();
  const [store, setStore] = useState(() => loadMockStore(window.localStorage));
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(90);
  const [position, setPosition] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [results, setResults] = useState(null);
  const [grading, setGrading] = useState(false);
  const [clock, setClock] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const record = store.record;
  const attempt = record?.attempts[record.current[paper.id]];
  const complete = attempt && isComplete(attempt);
  const selected = selectMockQuestions(questions, paper);
  const available = new Map(selected.map((q) => [q.legacyId || q.id, q]));
  const missing = mockQuestionIds(paper).length - selected.length;
  const activeIds = attempt?.activeType ? paper.groups[attempt.activeType] : [];
  const key = activeIds[Math.min(position, activeIds.length - 1)];
  const question = available.get(key);
  const value = question ? attempt.drafts[key] ?? initialSubmission(question.type) : null;
  const blankCount = activeIds.filter((id) => !hasAnswer(available.get(id), attempt.drafts[id])).length;
  const remaining = attempt?.startedAt ? Math.max(0, attempt.duration * 60 - Math.floor((clock - attempt.startedAt) / 1000)) : (attempt?.duration ?? duration) * 60;

  function persist(next, keepDraft = false) {
    try {
      const raw = saveMockStore(window.localStorage, next, store.raw);
      setStore({ record: next, raw, error: '' }); setError(''); return true;
    } catch (err) {
      if (keepDraft) setStore({ ...store, record: next });
      setError(`保存失败：${err.message} 当前输入可导出；提交锁定尚未成功时不会切换题型。`); return false;
    }
  }
  function act(event) {
    try {
      const next = updateMock(record, attempt.id, event);
      if (persist(next, event.type === 'edit') && event.type !== 'edit') { setPosition(0); setConfirm(false); }
    } catch (err) { setError(err.message); }
  }
  function begin() {
    try {
      if (persist(startMock(record, paper, duration, crypto.randomUUID()))) { setResults(null); setPosition(0); }
    } catch (err) { setError(err.message); }
  }
  async function review() {
    if (!complete || grading) return;
    setGrading(true); setError('');
    try {
      const entries = [];
      for (const q of selected) {
        const id = q.legacyId || q.id;
        const submission = attempt.submitted[q.type].snapshot[id];
        const result = q.solution ? { correct: gradeObjective(q, submission), referenceAnswerMd: q.solution.referenceAnswerMd, explanationMd: q.solution.explanationMd, rubricMd: q.solution.rubricMd } : await gradeCloudQuestion(q.id, submission);
        entries.push([id, result]);
      }
      setResults(Object.fromEntries(entries));
    } catch (err) { setError(`解析加载失败，交卷记录已保留，可重试：${err.message}`); }
    finally { setGrading(false); }
  }
  return <main className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6 min-w-0">
    <header className="space-y-3">
      <Link className="btn-neutral" to="/topics/gbits">返回吉比特专题</Link>
      <p className="type-eyebrow">两天冲刺 · 原创仿真与预测</p>
      <h1 className="type-display-sm">{paper.title} · 题型锁定模拟</h1>
      <p>{paper.description}</p>
      <p className="type-caption" role="note">任选题型开始；进入后须提交整个题型才能切换，提交后不可返回。区块内可翻题。全卷提交后统一看解析。允许确认后空题提交。记录仅本机保存，模拟不自动记掌握。</p>
      <p className="type-caption">历年考点标注只表示有历史线索，题面均为原创；预测考点不代表今年必考。计时为训练参数，超时仅提醒。</p>
    </header>
    {loading && <p role="status">正在加载试卷…</p>}
    {questionError && <p role="alert">题库加载失败：{questionError}</p>}
    {!loading && !questionError && missing > 0 && <p role="alert">本卷缺少 {missing} 题，等待题目发布后才能开始或继续。</p>}
    {(store.error || error) && <div role="alert" className="surface-card p-4 space-y-3"><p>{store.error || error}</p><button className="btn-neutral" onClick={() => download(store.record ? JSON.stringify(store.record, null, 2) : store.raw ?? '', 'gbits-mock-recovery.json')}>导出当前草稿或原记录</button><button className="btn-neutral" onClick={() => { setStore(loadMockStore(window.localStorage)); setError(''); setResults(null); setPosition(0); setConfirm(false); }}>恢复已保存进度（放弃未保存输入）</button></div>}
    {record && !loading && !questionError && missing === 0 && <>
      {!attempt && <section className="surface-card p-5 space-y-4"><label>训练时长 <select className="input-apple" value={duration} onChange={(e) => setDuration(Number(e.target.value))}><option value={90}>90 分钟</option><option value={120}>120 分钟</option></select></label><button className="btn-blue" onClick={begin}>创建本次模拟</button></section>}
      {attempt && !complete && <>
        <p role="timer" aria-label="模拟剩余时间">{String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}{!attempt.startedAt && ' · 进入首个题型时开始'}</p>
        {attempt.startedAt && remaining === 0 && <p role="status">训练计时已结束，请继续检查并按题型提交；不会自动交卷。</p>}
        {!attempt.activeType && <section className="surface-card p-5 space-y-4" aria-label="选择题型">
          <h2 className="type-title">选择下一个题型</h2>
          {MOCK_TYPES.map((type) => <div key={type} className="flex flex-wrap gap-3 items-center"><span>{MOCK_LABELS[type]} · {paper.groups[type].length} 题</span><button className="btn-blue" disabled={Boolean(attempt.submitted[type])} onClick={() => act({ type: 'enter', block: type })}>{attempt.submitted[type] ? `${MOCK_LABELS[type]}已提交 · 不可返回` : `进入${MOCK_LABELS[type]}`}</button></div>)}
        </section>}
        {question && <section className="space-y-5" aria-label="当前题型">
          <p className="type-caption">当前 {MOCK_LABELS[attempt.activeType]} · {Math.min(position + 1, activeIds.length)} / {activeIds.length} · 须整区块提交后才能切换</p>
          <nav className="flex flex-wrap gap-2" aria-label="区块内题号">{activeIds.map((id, i) => <button key={id} className={id === key ? 'btn-blue' : 'btn-neutral'} aria-current={id === key ? 'step' : undefined} aria-label={`第${i + 1}题${hasAnswer(available.get(id), attempt.drafts[id]) ? '，已答' : '，未答'}`} onClick={() => { setPosition(i); setConfirm(false); }}>{i + 1}{hasAnswer(available.get(id), attempt.drafts[id]) ? ' ✓' : ''}</button>)}</nav>
          <article className="surface-card p-4 sm:p-6 space-y-5 min-w-0"><h2 className="type-title">{question.title}</h2><Markdown content={question.promptMd || question.question} /><MockInput question={question} value={value} onChange={(submission) => act({ type: 'edit', questionId: key, submission })} /></article>
          <button className="btn-blue" onClick={() => setConfirm(true)}>提交整个{MOCK_LABELS[attempt.activeType]}题型</button>
          {confirm && <section className="surface-card p-5 space-y-3" role="alertdialog" aria-label="确认提交题型"><p>本区块共 {activeIds.length} 题，未答完整 {blankCount} 题。确认后不能返回或修改，解析将在全卷提交后显示。</p><button className="btn-blue" onClick={() => act({ type: 'submit' })}>确认提交并锁定</button><button className="btn-neutral" onClick={() => setConfirm(false)}>继续检查</button></section>}
        </section>}
      </>}
      {complete && <section className="space-y-5" aria-label="全卷复盘"><h2 className="type-title">全卷已提交</h2><p>客观题按整题判分；编程请对照参考实现自行检查，不代表 AC。模拟未写入普通学习进度。</p><div className="flex flex-wrap gap-3"><button className="btn-blue" disabled={grading} onClick={review}>{grading ? '正在加载解析…' : results ? '重新加载解析' : '加载全卷解析'}</button><button className="btn-neutral" onClick={() => download(JSON.stringify(record, null, 2), 'gbits-mock-attempts.json')}>导出模拟记录</button><button className="btn-neutral" disabled={grading} onClick={begin}>新建一次重练（保留旧记录）</button></div>
        {results && <><p role="status">客观题答对 {selected.filter((q) => q.type !== 'algorithm' && results[q.legacyId || q.id]?.correct === true).length} / {selected.filter((q) => q.type !== 'algorithm').length} 题</p>{selected.map((q, i) => { const id = q.legacyId || q.id; const r = results[id]; return <details key={id} className="surface-card p-4 min-w-0"><summary className="cursor-pointer">{i + 1}. {q.title} · {q.type === 'algorithm' ? '编程自评' : r.correct ? '正确' : '错误'}</summary><div className="space-y-4 mt-4"><Markdown content={q.promptMd || q.question} /><h3>我的回答</h3><SubmissionView question={q} submission={attempt.submitted[q.type].snapshot[id]} /><h3>参考答案与解析</h3><Markdown content={r.referenceAnswerMd || r.explanationMd} />{r.referenceAnswerMd && r.explanationMd && <Markdown content={r.explanationMd} />}{r.rubricMd && <Markdown content={r.rubricMd} />}<Link className="btn-neutral" to={`/quiz?questionId=${id}`}>进入普通练习与自评</Link></div></details>; })}</>}
      </section>}
    </>}
  </main>;
}
function MockInput({ question, value, onChange }) {
  if (question.type === 'single_choice') return <fieldset className="space-y-2"><legend>选择一个答案</legend>{question.payload.options.map((option) => <label key={option.id} className="answer-option"><input type="radio" name={`mock-${question.id}`} checked={value.optionId === option.id} onChange={() => onChange({ optionId: option.id })} /><span>{option.id}. </span><Markdown content={option.text} /></label>)}</fieldset>;
  if (question.type === 'fill_blank') return <div className="space-y-3">{question.payload.blanks.map((blank) => <label key={blank.id} className="block">{blank.label}<input className="input-apple" value={value.answers[blank.id] ?? ''} onChange={(e) => onChange({ answers: { ...value.answers, [blank.id]: e.target.value } })} /></label>)}</div>;
  return <label className="block">编程作答<textarea className="input-apple min-h-64 font-mono" value={value.answerMd} onChange={(e) => onChange({ answerMd: e.target.value })} placeholder="写下思路、复杂度或 C++17 代码…" /></label>;
}
