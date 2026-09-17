import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuestions } from '@/context/QuestionsContext';
import { draftQuestionFromFollowUp } from '@/data/aiRepository';
import { QUESTION_TYPE_LABELS } from '@/lib/questionSchema';
import QuestionDraftPreview, { saveDraftQuestion } from './QuestionDraftPreview';
import Elapsed from './Elapsed';
import { followUpScore, WEAK_FOLLOW_UP_SCORE } from '../../../supabase/functions/ai-tutor/questionDraft.js';

/**
 * Turns an answered follow-up into a question. AI only drafts it; saving goes through
 * questionSchema + saveQuestion as a private draft, which admins can practise immediately.
 */
export default function AddFollowUpToBank({ evaluation, sourceCategoryId }) {
  const { categories, questions, refresh } = useQuestions();
  const added = questions.filter((q) => q.originEvaluationId === evaluation.id);
  const score = followUpScore(evaluation);
  const recommended = typeof score === 'number' && score < WEAK_FOLLOW_UP_SCORE;

  const [open, setOpen] = useState(false);
  const [type, setType] = useState('auto');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null);
  const [savedId, setSavedId] = useState(null);

  const generate = async () => {
    setBusy(true);
    setError('');
    setSavedId(null);
    try {
      const question = await draftQuestionFromFollowUp({ evaluationId: evaluation.id, type });
      setDraft({ ...question, categoryId: sourceCategoryId ?? categories[0]?.id ?? '' });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const id = await saveDraftQuestion(draft);
      setSavedId(id);
      setDraft(null);
      setOpen(false);
      // Silent: a loading state would unmount the practice screen this panel lives in.
      await refresh({ silent: true }).catch(() => setError('已保存，但题目列表刷新失败；稍后刷新页面即可看到。'));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        {recommended && !added.length && <span className="type-caption bank-recommend">这道追问掌握不牢（{score} 分），建议加入题库反复练习</span>}
        {added.length > 0 && (
          <span className="type-caption" style={{ color: 'var(--success-fg)' }}>
            已加入题库：{added.map((q, i) => <span key={q.id}>{i > 0 && '、'}<Link to={`/manage/questions/${q.id}/edit`} style={{ color: 'var(--accent)' }}>{q.title}</Link></span>)}
          </span>
        )}
        {savedId && !added.some((q) => q.id === savedId) && (
          <span className="type-caption" style={{ color: 'var(--success-fg)' }}>已保存为草稿 · <Link to={`/manage/questions/${savedId}/edit`} style={{ color: 'var(--accent)' }}>去编辑</Link></span>
        )}
        {!open && (
          <button type="button" className={recommended && !added.length ? 'btn-blue' : 'btn-neutral'} onClick={() => setOpen(true)}>
            {added.length || savedId ? '再生成一道' : '加入题库'}
          </button>
        )}
      </div>

      {open && (
        <div className="bank-draft">
          <div className="flex flex-wrap items-end gap-2">
            <label className="type-caption-bold">
              生成题型
              <select className="input-apple mt-1" value={type} disabled={busy || saving} onChange={(e) => setType(e.target.value)}>
                <option value="auto">让 AI 选择</option>
                {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <button type="button" className="btn-blue" disabled={busy || saving} onClick={generate}>{draft ? '重新生成' : '生成题目'}</button>
            <button type="button" className="btn-neutral" disabled={busy || saving} onClick={() => { setOpen(false); setDraft(null); setError(''); }}>取消</button>
          </div>
          {busy && <p role="status" className="type-caption mt-2">AI 正在出题…<Elapsed /></p>}
          {error && <p role="alert" className="ai-error mt-2">{error}</p>}
          {draft && !busy && <QuestionDraftPreview draft={draft} categories={categories} update={update} />}
          {draft && !busy && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" className="btn-blue" disabled={saving || !draft.categoryId} onClick={save}>{saving ? '保存中…' : '保存到题库（私有草稿）'}</button>
              <span className="type-micro" style={{ color: 'var(--text-tertiary)' }}>草稿仅管理员可见、可直接练习；公开发布请到编辑器确认后操作。</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
