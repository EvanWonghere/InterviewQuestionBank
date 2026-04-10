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

  const difficultyChipClass = {
    easy: 'chip chip-difficulty-easy',
    medium: 'chip chip-difficulty-medium',
    hard: 'chip chip-difficulty-hard',
  }[question.difficulty] || 'chip';

  const difficultyLabel = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  }[question.difficulty];

  const tags = Array.isArray(question.tags) ? question.tags : [];

  return (
    <article ref={cardRef} className="surface-card-elevated">
      <div className="p-6 lg:p-8">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="type-card-title" style={{ color: 'var(--text-primary)' }}>
            {question.title}
          </h2>
          {difficultyLabel && (
            <span className={`${difficultyChipClass} shrink-0`}>{difficultyLabel}</span>
          )}
        </div>

        {tags.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="chip">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ color: 'var(--text-secondary)' }}>
          <QuestionContent content={question.question} />
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={toggleAnswer}
            className={showAnswer ? 'btn-neutral' : 'btn-blue'}
          >
            {showAnswer ? '收起答案' : '展开答案'}
          </button>

          {showAnswer && (
            <div
              className="answer-block mt-5 rounded-2xl p-6"
              style={{
                background: 'var(--filter-bg)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <p
                className="type-eyebrow mb-3"
                style={{ color: 'var(--apple-blue)' }}
              >
                参考答案
              </p>
              <QuestionContent content={question.answer} />
            </div>
          )}
        </div>

        <ActionButtons questionId={question.id} />
      </div>
    </article>
  );
}
