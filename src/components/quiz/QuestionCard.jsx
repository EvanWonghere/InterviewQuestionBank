import QuestionContent from './QuestionContent';
import AnswerPanel from './AnswerPanel';
import { QUESTION_TYPE_LABELS } from '@/lib/questionSchema';

/**
 * @param {{
 *   question: { id: string, title: string, question: string, answer: string, difficulty?: string, tags?: string[] },
 *   showAnswer?: boolean,
 *   onToggleAnswer?: () => void,
 *   cardRef?: import('react').RefObject<HTMLDivElement | null>,
 * }} props
 */
export default function QuestionCard({ question, cardRef, onRated }) {
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
          <div className="flex shrink-0 gap-2">
            {question.type && <span className="chip">{QUESTION_TYPE_LABELS[question.type] ?? question.type}</span>}
            {difficultyLabel && <span className={difficultyChipClass}>{difficultyLabel}</span>}
          </div>
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

        <AnswerPanel question={question} onRated={onRated} />
      </div>
    </article>
  );
}
