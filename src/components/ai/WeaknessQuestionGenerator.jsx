import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuestions } from '@/context/QuestionsContext';
import { draftQuestionsForWeakness } from '@/data/aiRepository';
import { QUESTION_TYPE_LABELS } from '@/lib/questionSchema';
import QuestionDraftPreview, { saveDraftQuestion } from './QuestionDraftPreview';
import Elapsed from './Elapsed';
import { MAX_WEAKNESS_DRAFTS } from '../../../supabase/functions/ai-tutor/questionDraft.js';

const sameTag = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();

/**
 * Drafts 1–3 questions aimed at one aggregated weakness. Each draft is reviewed and ticked individually;
 * only ticked drafts are saved (as private drafts), so the bank does not fill with unreviewed questions.
 */
export default function WeaknessQuestionGenerator({ group, questionMap }) {
  const { categories, questions, refresh } = useQuestions();
  const existing = questions.filter((q) => q.originKind === 'weakness' && sameTag(q.originWeaknessTag, group.tag));

  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(2);
  const [mixed, setMixed] = useState(true);
  const [types, setTypes] = useState(['single_choice', 'short_answer', 'algorithm']);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState([]);
  const [saved, setSaved] = useState([]);

  // The related questions' most common category is the best default home for the new drafts.
  const defaultCategory = () => {
    const counts = new Map();
    for (const id of group.questionIds) {
      const categoryId = questionMap.get(id)?.categoryId;
      if (categoryId) counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? categories[0]?.id ?? '';
  };

  const generate = async () => {
    setBusy(true);
    setError('');
    setSaved([]);
    try {
      const data = await draftQuestionsForWeakness({ tag: group.tag, count, types: mixed ? 'auto' : types.slice(0, count) });
      const categoryId = defaultCategory();
      setDrafts(data.questions.map((q) => ({ key: crypto.randomUUID(), selected: true, error: '', question: { ...q, categoryId } })));
      if (data.questions.length < count) setError(`AI 只返回了 ${data.questions.length} 道有效题目，格式不完整的已丢弃。`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const updateDraft = (key, patch) => setDrafts((items) => items.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  const selected = drafts.filter((d) => d.selected);

  const save = async () => {
    setSaving(true);
    setError('');
    const created = [];
    for (const draft of selected) {
      try {
        const id = await saveDraftQuestion(draft.question);
        created.push({ id, title: draft.question.title });
        setDrafts((items) => items.filter((d) => d.key !== draft.key));
      } catch (e) {
        // Keep failed drafts on screen with their reason; the others are already saved.
        updateDraft(draft.key, { error: e.message });
      }
    }
    setSaved((items) => [...items, ...created]);
    if (created.length) await refresh({ silent: true }).catch(() => setError('已保存，但题目列表刷新失败；稍后刷新页面即可看到。'));
    setSaving(false);
  };

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        {existing.length > 0 && <span className="type-caption" style={{ color: 'var(--text-tertiary)' }}>已为此薄弱点出过 {existing.length} 道</span>}
        {!open && <button type="button" className="btn-neutral" onClick={() => setOpen(true)}>针对性出题</button>}
      </div>

      {open && (
        <div className="bank-draft">
          <div className="flex flex-wrap items-end gap-3">
            <label className="type-caption-bold">
              题目数量
              <select className="input-apple mt-1" value={count} disabled={busy || saving} onChange={(e) => setCount(Number(e.target.value))}>
                {Array.from({ length: MAX_WEAKNESS_DRAFTS }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} 道</option>)}
              </select>
            </label>
            <label className="type-caption flex items-center gap-2 pb-2">
              <input type="checkbox" checked={mixed} disabled={busy || saving} onChange={(e) => setMixed(e.target.checked)} />
              让 AI 搭配题型
            </label>
          </div>
          {!mixed && (
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.from({ length: count }, (_, i) => (
                <label key={i} className="type-caption-bold">
                  第 {i + 1} 道
                  <select className="input-apple mt-1" value={types[i]} disabled={busy || saving} onChange={(e) => setTypes((t) => t.map((v, j) => (j === i ? e.target.value : v)))}>
                    {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
              ))}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className="btn-blue" disabled={busy || saving} onClick={generate}>{drafts.length ? '重新生成' : '生成题目'}</button>
            <button type="button" className="btn-neutral" disabled={busy || saving} onClick={() => { setOpen(false); setDrafts([]); setError(''); }}>收起</button>
            {count > 1 && <span className="type-micro" style={{ color: 'var(--text-tertiary)' }}>一次出多道题较慢；若超时可减少数量或降低思考强度。</span>}
          </div>
          {busy && <p role="status" className="type-caption mt-2">AI 正在针对“{group.tag}”出题…<Elapsed /></p>}
          {error && <p role="alert" className="ai-error mt-2">{error}</p>}
          {saved.length > 0 && (
            <p className="type-caption mt-2" style={{ color: 'var(--success-fg)' }}>
              已保存为私有草稿：{saved.map((q, i) => <span key={q.id}>{i > 0 && '、'}<Link to={`/manage/questions/${q.id}/edit`} style={{ color: 'var(--accent)' }}>{q.title}</Link></span>)}
            </p>
          )}

          {!busy && drafts.map((draft, index) => (
            <article key={draft.key} className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <label className="type-caption-bold flex items-center gap-2">
                <input type="checkbox" checked={draft.selected} disabled={saving} onChange={(e) => updateDraft(draft.key, { selected: e.target.checked })} />
                保存第 {index + 1} 道 · {QUESTION_TYPE_LABELS[draft.question.type]}
              </label>
              {draft.error && <p role="alert" className="ai-error mt-1">{draft.error}</p>}
              <QuestionDraftPreview draft={draft.question} categories={categories} update={(patch) => updateDraft(draft.key, { question: { ...draft.question, ...patch } })} />
            </article>
          ))}

          {!busy && drafts.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button type="button" className="btn-blue" disabled={saving || !selected.length || selected.some((d) => !d.question.categoryId)} onClick={save}>
                {saving ? '保存中…' : `保存选中的 ${selected.length} 道（私有草稿）`}
              </button>
              <span className="type-micro" style={{ color: 'var(--text-tertiary)' }}>参考答案由 AI 生成，保存前请核对；公开发布请到编辑器确认。</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
