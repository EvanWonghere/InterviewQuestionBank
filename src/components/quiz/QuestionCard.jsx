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
    easy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    hard: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  }[question.difficulty] || 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200';

  const tags = Array.isArray(question.tags) ? question.tags : [];

  return (
    <article
      ref={cardRef}
      className="rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow dark:border-neutral-700 dark:bg-neutral-900"
    >
      <div className="p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{question.title}</h2>
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
                className="inline-flex rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="text-neutral-700 dark:text-neutral-300">
          <QuestionContent content={question.question} />
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={toggleAnswer}
            className="rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700 transition-all duration-150 hover:bg-neutral-100 active:scale-95 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            {showAnswer ? '收起答案' : '展开答案'}
          </button>
          {showAnswer && (
            <div className="answer-block mt-4 rounded-lg border border-l-4 border-neutral-200 border-l-green-500 bg-neutral-50 p-4 dark:border-neutral-700 dark:border-l-green-500 dark:bg-neutral-800/50">
              <p className="mb-2 text-sm font-medium text-green-700 dark:text-green-400">参考答案</p>
              <QuestionContent content={question.answer} />
            </div>
          )}
        </div>
        <ActionButtons questionId={question.id} />
      </div>
    </article>
  );
}
