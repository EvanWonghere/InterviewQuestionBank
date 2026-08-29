import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminGate from '@/components/auth/AdminGate';
import Markdown from '@/components/common/Markdown';
import { useAuth } from '@/context/AuthContext';
import { useQuestions } from '@/context/QuestionsContext';
import { getQuestionForEdit, saveQuestion } from '@/data/questionRepository';
import { uploadQuestionAsset } from '@/data/assetRepository';
import { defaultQuestion, parseQuestion, QUESTION_TYPES, QUESTION_TYPE_LABELS } from '@/lib/questionSchema';

export default function QuestionEditorPage() {
  return <AdminGate><QuestionEditor /></AdminGate>;
}

function QuestionEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categories, refresh } = useQuestions();
  const [form, setForm] = useState(defaultQuestion());
  const [loading, setLoading] = useState(Boolean(id));
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getQuestionForEdit(id).then((question) => setForm(question)).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const guard = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);

  const update = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
    setDirty(true);
  };
  const updateSolution = (patch) => update({ solution: { ...form.solution, ...patch } });
  const updatePayload = (patch) => update({ payload: { ...form.payload, ...patch } });

  const save = async (publish = false) => {
    setSaving(true);
    setError('');
    try {
      const next = { ...form, status: publish ? 'published' : form.status };
      const parsed = parseQuestion(next);
      const savedId = await saveQuestion(parsed);
      setDirty(false);
      await refresh();
      navigate(`/manage/questions/${savedId}/edit`, { replace: true });
    } catch (err) {
      const message = err.issues?.map((issue) => issue.message).join('；') ?? err.message;
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !form.id || !user) return;
    setSaving(true);
    setError('');
    try {
      const marker = await uploadQuestionAsset(form.id, file, user.id);
      update({ promptMd: `${form.promptMd}\n\n![${file.name}](${marker})` });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      event.target.value = '';
    }
  };

  if (loading) return <p className="type-body">加载题目中…</p>;
  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="type-eyebrow" style={{ color: 'var(--apple-blue)' }}>题目编辑器</p>
          <h1 className="type-display-sm mt-2">{id ? '编辑题目' : '新增题目'}</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-neutral" disabled={saving} onClick={() => save(false)}>保存草稿</button>
          <button type="button" className="btn-blue" disabled={saving} onClick={() => save(true)}>发布</button>
        </div>
      </div>
      {error && <div className="mb-5 rounded-xl p-4 type-caption" style={{ background: 'var(--error-bg)', color: 'var(--error-fg)' }}>{error}</div>}
      <div className="grid gap-6 xl:grid-cols-2">
        <form className="surface-card space-y-5 p-6" onSubmit={(event) => event.preventDefault()}>
          <Field label="标题"><input className="input-apple" value={form.title} onChange={(event) => update({ title: event.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="题型"><select className="input-apple" value={form.type} onChange={(event) => update({ type: event.target.value, payload: {}, solution: defaultQuestion().solution })}>{QUESTION_TYPES.map((type) => <option key={type} value={type}>{QUESTION_TYPE_LABELS[type]}</option>)}</select></Field>
            <Field label="分类"><select className="input-apple" value={form.categoryId} onChange={(event) => update({ categoryId: event.target.value })}><option value="">请选择</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
            <Field label="难度"><select className="input-apple" value={form.difficulty} onChange={(event) => update({ difficulty: event.target.value })}><option value="easy">简单</option><option value="medium">中等</option><option value="hard">困难</option></select></Field>
            <Field label="可见性"><select className="input-apple" value={form.visibility} onChange={(event) => update({ visibility: event.target.value })}><option value="private">私有</option><option value="public">公开</option></select></Field>
          </div>
          <Field label="知识点标签（逗号分隔）"><input className="input-apple" value={form.tags.join(', ')} onChange={(event) => update({ tags: event.target.value.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean) })} /></Field>
          <Field label="题干（Markdown）"><textarea className="input-apple min-h-48 resize-y font-mono" value={form.promptMd} onChange={(event) => update({ promptMd: event.target.value })} /></Field>
          <div className="flex items-center gap-3">
            <label className={`btn-neutral ${!form.id ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>上传图片<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" disabled={!form.id} onChange={upload} /></label>
            {!form.id && <span className="type-micro" style={{ color: 'var(--text-quaternary)' }}>先保存草稿后才能上传</span>}
          </div>
          <TypeFields form={form} updatePayload={updatePayload} updateSolution={updateSolution} />
          <Field label="参考答案（Markdown）"><textarea className="input-apple min-h-40 resize-y font-mono" value={form.solution.referenceAnswerMd ?? ''} onChange={(event) => updateSolution({ referenceAnswerMd: event.target.value })} /></Field>
          <Field label="解析"><textarea className="input-apple min-h-28 resize-y font-mono" value={form.solution.explanationMd ?? ''} onChange={(event) => updateSolution({ explanationMd: event.target.value })} /></Field>
          {!['single_choice', 'multiple_choice', 'fill_blank'].includes(form.type) && <Field label="自评标准"><textarea className="input-apple min-h-28 resize-y font-mono" value={form.solution.rubricMd ?? ''} onChange={(event) => updateSolution({ rubricMd: event.target.value })} /></Field>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="来源名称"><input className="input-apple" value={form.sourceTitle} onChange={(event) => update({ sourceTitle: event.target.value })} /></Field>
            <Field label="来源链接"><input className="input-apple" value={form.sourceUrl} onChange={(event) => update({ sourceUrl: event.target.value })} /></Field>
          </div>
        </form>
        <aside className="surface-card p-6 xl:sticky xl:top-6 xl:self-start">
          <p className="type-eyebrow mb-4" style={{ color: 'var(--apple-blue)' }}>实时预览</p>
          <h2 className="type-card-title mb-4">{form.title || '未命名题目'}</h2>
          <Markdown content={form.promptMd || '在左侧输入题干…'} />
          {form.solution.referenceAnswerMd && <div className="answer-block mt-6 rounded-2xl p-5"><Markdown content={form.solution.referenceAnswerMd} /></div>}
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }) { return <label className="block"><span className="type-caption-bold mb-1.5 block">{label}</span>{children}</label>; }

function TypeFields({ form, updatePayload, updateSolution }) {
  const options = form.payload.options ?? [];
  const correct = form.solution.correctOptionIds ?? [];
  if (form.type === 'single_choice' || form.type === 'multiple_choice') {
    const multiple = form.type === 'multiple_choice';
    const setOption = (index, text) => updatePayload({ options: options.map((option, i) => i === index ? { ...option, text } : option) });
    const toggleCorrect = (id) => updateSolution({ correctOptionIds: multiple ? (correct.includes(id) ? correct.filter((value) => value !== id) : [...correct, id]) : [id] });
    return (
      <div>
        <p className="type-caption-bold mb-2">选项与正确答案</p>
        <div className="space-y-2">{options.map((option, index) => <div key={option.id} className="flex gap-2"><input type={multiple ? 'checkbox' : 'radio'} name="correct-option" checked={correct.includes(option.id)} onChange={() => toggleCorrect(option.id)} /><input className="input-apple" value={option.text} onChange={(event) => setOption(index, event.target.value)} /><button type="button" className="btn-ghost" onClick={() => { updatePayload({ options: options.filter((_, i) => i !== index) }); updateSolution({ correctOptionIds: correct.filter((id) => id !== option.id) }); }}>移除</button></div>)}</div>
        <button type="button" className="btn-neutral mt-3" onClick={() => updatePayload({ options: [...options, { id: crypto.randomUUID(), text: '' }] })}>增加选项</button>
      </div>
    );
  }
  if (form.type === 'fill_blank') {
    const blanks = form.payload.blanks ?? [];
    const accepted = form.solution.acceptedAnswers ?? {};
    return <div><p className="type-caption-bold mb-2">填空与可接受答案</p><div className="space-y-3">{blanks.map((blank, index) => <div key={blank.id} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]"><input className="input-apple" value={blank.label} onChange={(event) => updatePayload({ blanks: blanks.map((item, i) => i === index ? { ...item, label: event.target.value } : item) })} placeholder="空格名称" /><input className="input-apple" value={(accepted[blank.id] ?? []).join(' | ')} onChange={(event) => updateSolution({ acceptedAnswers: { ...accepted, [blank.id]: event.target.value.split('|').map((value) => value.trim()).filter(Boolean) } })} placeholder="多个答案用 | 分隔" /><button type="button" className="btn-ghost" onClick={() => updatePayload({ blanks: blanks.filter((_, i) => i !== index) })}>移除</button></div>)}</div><div className="mt-3 flex flex-wrap gap-3"><button type="button" className="btn-neutral" onClick={() => updatePayload({ blanks: [...blanks, { id: crypto.randomUUID(), label: `填空 ${blanks.length + 1}` }] })}>增加填空</button><label className="type-caption flex items-center gap-2"><input type="checkbox" checked={form.solution.caseSensitive ?? false} onChange={(event) => updateSolution({ caseSensitive: event.target.checked })} />区分大小写</label></div></div>;
  }
  if (form.type === 'algorithm') return <Field label="语言与起始代码"><input className="input-apple mb-2" value={form.payload.language ?? ''} onChange={(event) => updatePayload({ language: event.target.value })} placeholder="例如 C++17" /><textarea className="input-apple min-h-28 font-mono" value={form.payload.starterCode ?? ''} onChange={(event) => updatePayload({ starterCode: event.target.value })} /></Field>;
  return null;
}
