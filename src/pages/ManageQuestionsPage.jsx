import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminGate from '@/components/auth/AdminGate';
import { useQuestions } from '@/context/QuestionsContext';
import { archiveQuestion, duplicateQuestion } from '@/data/questionRepository';
import { QUESTION_TYPE_LABELS } from '@/lib/questionSchema';

export default function ManageQuestionsPage() {
  return <AdminGate><ManageQuestions /></AdminGate>;
}

function ManageQuestions() {
  const { questions, refresh } = useQuestions();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const filtered = useMemo(() => questions.filter((question) => `${question.title} ${question.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())), [questions, query]);

  const act = async (id, action) => {
    setBusy(id);
    setError('');
    try {
      if (action === 'archive') await archiveQuestion(id);
      if (action === 'duplicate') {
        const nextId = await duplicateQuestion(id);
        await refresh();
        navigate(`/manage/questions/${nextId}/edit`);
        return;
      }
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="type-eyebrow" style={{ color: 'var(--apple-blue)' }}>管理</p>
          <h1 className="type-display-sm mt-2">题目与错题内容</h1>
        </div>
        <Link to="/manage/questions/new" className="btn-blue">新增题目</Link>
      </div>
      <input className="input-apple mb-5" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题或标签" />
      {error && <p className="type-caption mb-4" style={{ color: 'var(--error-fg)' }}>{error}</p>}
      <div className="space-y-3">
        {filtered.map((question) => (
          <article key={question.id} className="surface-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="type-body-emphasis truncate">{question.title}</h2>
                <span className="chip">{QUESTION_TYPE_LABELS[question.type]}</span>
                <span className="chip">{question.status === 'published' ? '已发布' : question.status === 'archived' ? '已归档' : '草稿'}</span>
                <span className="chip">{question.visibility === 'public' ? '公开' : '私有'}</span>
              </div>
              <p className="type-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>{question.tags.join(' · ') || '暂无标签'}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link to={`/manage/questions/${question.id}/edit`} className="btn-neutral">编辑</Link>
              <button type="button" className="btn-ghost" disabled={busy === question.id} onClick={() => act(question.id, 'duplicate')}>复制</button>
              {question.status !== 'archived' && <button type="button" className="btn-ghost" disabled={busy === question.id} onClick={() => act(question.id, 'archive')}>归档</button>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
