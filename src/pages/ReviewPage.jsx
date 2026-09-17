import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuestions } from '@/context/QuestionsContext';
import TutorEntry from '@/components/ai/TutorEntry';
import { useReviewStore } from '@/store/reviewStore';

const MODES = {
  due: { title: '今日复习', description: '已经到期的题目，优先从最早到期开始。' },
  wrong: { title: '历史错题', description: '所有曾经答错的题，掌握后仍保留历史。' },
  mastered: { title: '已掌握', description: '当前复习间隔至少 30 天，且最近评分不低于良好。' },
  weak: { title: '薄弱知识点', description: '按累计错误次数聚合知识点。' },
  history: { title: '作答历史', description: '最近 500 次提交和自评记录。' },
};

export default function ReviewPage() {
  const { mode = 'due' } = useParams();
  const meta = MODES[mode] ?? MODES.due;
  const { questions } = useQuestions();
  const states = useReviewStore((state) => state.reviewStates);
  const attempts = useReviewStore((state) => state.attempts);
  const questionMap = useMemo(() => new Map(questions.map((question) => [question.id, question])), [questions]);
  const [now] = useState(() => Date.now());

  const filtered = useMemo(() => questions.filter((question) => {
    const state = states[question.id];
    if (!state) return false;
    if (mode === 'due') return state.dueAt && new Date(state.dueAt).getTime() <= now;
    if (mode === 'wrong') return state.lapseCount > 0;
    if (mode === 'mastered') return state.intervalDays >= 30 && state.lastQuality >= 4;
    return false;
  }).sort((a, b) => new Date(states[a.id]?.dueAt ?? 0) - new Date(states[b.id]?.dueAt ?? 0)), [questions, states, mode, now]);

  const weakTags = useMemo(() => {
    const counts = new Map();
    for (const question of questions) {
      const lapses = states[question.id]?.lapseCount ?? 0;
      for (const tag of question.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + lapses);
    }
    return [...counts.entries()].filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]);
  }, [questions, states]);

  return (
    <div>
      <p className="type-eyebrow" style={{ color: 'var(--apple-blue)' }}>自适应复习</p>
      <h1 className="type-display-sm mt-2">{meta.title}</h1>
      <p className="type-body mt-2 mb-7" style={{ color: 'var(--text-tertiary)' }}>{meta.description}</p>

      {mode === 'weak' ? <WeakList items={weakTags} /> : mode === 'history' ? <History attempts={attempts} questionMap={questionMap} /> : (
        filtered.length ? <div className="space-y-3">{filtered.map((question) => <QuestionRow key={question.id} question={question} state={states[question.id]} />)}</div> : <Empty />
      )}
    </div>
  );
}

function QuestionRow({ question, state }) {
  return <Link to={`/quiz?q=${encodeURIComponent(question.title)}`} className="surface-card block p-5 hover:shadow-md"><div className="flex items-center justify-between gap-4"><div><h2 className="type-body-emphasis">{question.title}</h2><p className="type-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>{question.tags.join(' · ')}</p></div><div className="shrink-0 text-right type-micro" style={{ color: 'var(--text-quaternary)' }}><p>错 {state.lapseCount} 次</p><p>间隔 {state.intervalDays} 天</p></div></div></Link>;
}

function WeakList({ items }) {
  if (!items.length) return <Empty />;
  return <div className="grid gap-3 sm:grid-cols-2">{items.map(([tag, count]) => <Link key={tag} to={`/quiz?q=${encodeURIComponent(tag)}`} className="surface-card p-5"><div className="flex justify-between"><span className="type-body-emphasis">{tag}</span><span className="chip">{count} 次错误</span></div></Link>)}</div>;
}

function History({ attempts, questionMap }) {
  if (!attempts.length) return <Empty />;
  return <div className="space-y-3">{attempts.map((attempt) => <article key={attempt.id} className="surface-card p-5"><div className="flex justify-between gap-4"><div><h2 className="type-body-emphasis">{questionMap.get(attempt.question_id)?.title ?? '已归档题目'}</h2><p className="type-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>{attempt.error_reasons?.join(' · ') || '无错误标签'}</p></div><div className="shrink-0 text-right"><span className={`chip ${attempt.quality < 3 ? 'chip-difficulty-hard' : 'chip-difficulty-easy'}`}>评分 {attempt.quality}</span><p className="type-micro mt-1" style={{ color: 'var(--text-quaternary)' }}>{new Date(attempt.answered_at).toLocaleString()}</p></div></div><p className="type-micro mt-2">{attempt.assistance_used === true ? 'AI辅助作答' : attempt.assistance_used === false ? '本次未使用AI助手' : '历史记录：辅助情况未知'}</p>{questionMap.has(attempt.question_id) && <TutorEntry enabled question={questionMap.get(attempt.question_id)} phase="review" submission={attempt.submission} />}</article>)}</div>;
}

function Empty() { return <div className="surface-card p-8 text-center type-body" style={{ color: 'var(--text-tertiary)' }}>这里暂时没有记录，完成一次作答后会自动更新。</div>; }
