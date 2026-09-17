import Markdown from '@/components/common/Markdown';
import { saveQuestion } from '@/data/questionRepository';
import { parseQuestion, QUESTION_TYPE_LABELS } from '@/lib/questionSchema';

const DIFFICULTY = { easy: '简单', medium: '中等', hard: '困难' };

/** AI drafts are always saved as private drafts through the same schema and repository as the editor. */
export async function saveDraftQuestion(draft) {
  try {
    return await saveQuestion(parseQuestion({ ...draft, status: 'draft', visibility: 'private' }));
  } catch (e) {
    throw new Error(e.issues?.map((issue) => issue.message).join('；') ?? e.message);
  }
}

export default function QuestionDraftPreview({ draft, categories, update }) {
  const correct = new Set(draft.solution.correctOptionIds ?? []);
  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="type-caption-bold sm:col-span-2">标题<input className="input-apple mt-1" value={draft.title} onChange={(e) => update({ title: e.target.value })} /></label>
        <label className="type-caption-bold">分类
          <select className="input-apple mt-1" value={draft.categoryId} onChange={(e) => update({ categoryId: e.target.value })}>
            <option value="">请选择</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="type-caption-bold">难度
          <select className="input-apple mt-1" value={draft.difficulty} onChange={(e) => update({ difficulty: e.target.value })}>
            {Object.entries(DIFFICULTY).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="type-caption-bold sm:col-span-2">知识点标签（逗号分隔）
          <input className="input-apple mt-1" value={draft.tags.join(', ')} onChange={(e) => update({ tags: e.target.value.split(/[,，]/).map((t) => t.trim()).filter(Boolean) })} />
        </label>
      </div>
      <p className="type-micro-bold"><span className="chip mr-2">{QUESTION_TYPE_LABELS[draft.type]}</span>题干预览</p>
      <Markdown content={draft.promptMd} />
      {draft.payload.options && (
        <ul className="space-y-1 type-caption">
          {draft.payload.options.map((o) => <li key={o.id} className={correct.has(o.id) ? 'correct' : ''}>{correct.has(o.id) ? '✓ ' : '· '}<Markdown content={o.text} className="inline-block" /></li>)}
        </ul>
      )}
      {draft.payload.blanks && (
        <ul className="space-y-1 type-caption">
          {draft.payload.blanks.map((b) => <li key={b.id}><span className="type-caption-bold">{b.label}</span>：{draft.solution.acceptedAnswers?.[b.id]?.join(' / ')}</li>)}
        </ul>
      )}
      {draft.payload.language && <p className="type-caption">语言：{draft.payload.language}</p>}
      {draft.payload.starterCode && <pre className="submission-text ai-context">{draft.payload.starterCode}</pre>}
      {(draft.solution.referenceAnswerMd || draft.solution.rubricMd || draft.solution.explanationMd) && (
        <details>
          <summary className="type-caption-bold cursor-pointer">参考答案、评分要点与解析</summary>
          <Markdown content={draft.solution.referenceAnswerMd} />
          {draft.solution.rubricMd && <><p className="type-eyebrow mt-3">评分要点</p><Markdown content={draft.solution.rubricMd} /></>}
          {draft.solution.explanationMd && <><p className="type-eyebrow mt-3">解析</p><Markdown content={draft.solution.explanationMd} /></>}
        </details>
      )}
    </div>
  );
}
