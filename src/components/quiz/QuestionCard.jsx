import QuestionContent from './QuestionContent';
import AnswerPanel from './AnswerPanel';
import ConceptLabLinks from './ConceptLabLinks';
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

  const difficultyLabel = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  }[question.difficulty];

  const tags = Array.isArray(question.tags) ? question.tags : [];

  return (
    <article ref={cardRef} className="surface-card-elevated question-page">
      <div className="question-page-inner">
        <p className="question-meta">
          {[difficultyLabel, question.type ? QUESTION_TYPE_LABELS[question.type] ?? question.type : null].filter(Boolean).join(' · ')}
          {tags.length > 0 && <span className="question-tags">{tags.join(' / ')}</span>}
        </p>
        <h2 className="question-title">{question.title}</h2>

        <div className="question-body">
          <QuestionContent content={question.question} />
        </div>

        <ConceptLabLinks question={question} />
        <AnswerPanel question={question} onRated={onRated} />
      </div>
    </article>
  );
}
