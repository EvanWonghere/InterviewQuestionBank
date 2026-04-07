import { useState } from 'react';
import QuestionContent from './QuestionContent';
import ActionButtons from './ActionButtons';

/**
 * @param {{
 *   question: { id: string, title: string, question: string, answer: string, difficulty?: string, tags?: string[] },
 *   showAnswer?: boolean,
 *   onToggleAnswer?: () => void,
 *   cardRef?: import('react').RefObject<HTMLDivElement | null>,
 * }} props
 */
export default function QuestionCard({ question, showAnswer: controlledShow, onToggleAnswer, cardRef }) {
  const isControlled = typeof controlledShow === 'boolean' && typeof onToggleAnswer === 'function';
  const [internalShow, setInternalShow] = useState(false);
  const showAnswer = isControlled ? controlledShow : internalShow;
  const toggleAnswer = isControlled ? onToggleAnswer : () => setInternalShow((v) => !v);

  if (!question) return null;

  const difficultyClass = {
    easy: 'border border-emerald-200/75 bg-emerald-100/65 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300',
    medium: 'border border-amber-200/75 bg-amber-100/65 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300',
    hard: 'border border-rose-200/75 bg-rose-100/65 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300',
  }[question.difficulty] || 'border border-slate-200/75 bg-slate-100/70 text-slate-700 dark:border-slate-500/25 dark:bg-slate-500/10 dark:text-slate-300';

  const tags = Array.isArray(question.tags) ? question.tags : [];

  return (
    <article
      ref={cardRef}
      className="panel-surface rounded-xl shadow-sm transition-shadow hover:shadow"
    >
      <div className="p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{question.title}</h2>
          {question.difficulty && (
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyClass}`}>
              {question.difficulty === 'easy' ? '简单' : question.difficulty === 'medium' ? '中等' : '困难'}
            </span>
          )}
        </div>
        {tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex rounded-md border border-sky-200/80 bg-sky-100/70 px-2 py-0.5 text-xs font-medium text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="text-slate-700 dark:text-slate-300">
          <QuestionContent content={question.question} />
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={toggleAnswer}
            className="rounded-lg border border-white/75 bg-white/75 px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-150 hover:bg-white active:scale-95 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
          >
            {showAnswer ? '收起答案' : '展开答案'}
          </button>
          {showAnswer && (
            <div className="answer-block mt-4 rounded-lg border border-l-4 border-sky-200/80 border-l-sky-400 bg-white/70 p-4 dark:border-sky-500/30 dark:border-l-sky-400 dark:bg-white/6">
              <p className="mb-2 text-sm font-medium text-sky-700 dark:text-sky-300">参考答案</p>
              <QuestionContent content={question.answer} />
            </div>
          )}
        </div>
        <ActionButtons questionId={question.id} />
      </div>
    </article>
  );
}
