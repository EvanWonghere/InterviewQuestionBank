import Markdown from '@/components/common/Markdown';

/** Read-only view of what was submitted, per question type. Plain text answers stay verbatim (not Markdown) so code keeps its layout. */
export default function SubmissionView({ question, submission }) {
  const type = question?.type;
  if (!submission) return null;
  if (type === 'single_choice' || type === 'multiple_choice') {
    const chosen = new Set(type === 'single_choice' ? [submission.optionId] : submission.optionIds ?? []);
    const options = question.payload?.options ?? [];
    if (!options.some((o) => chosen.has(o.id))) return <Empty />;
    return (
      <ul className="space-y-2">
        {options.map((option) => (
          <li key={option.id} className={`submission-option${chosen.has(option.id) ? ' is-chosen' : ''}`}>
            <span className="type-micro-bold submission-mark">{chosen.has(option.id) ? '我的选择' : ''}</span>
            <Markdown content={option.text} />
          </li>
        ))}
      </ul>
    );
  }
  if (type === 'fill_blank') {
    const blanks = question.payload?.blanks ?? [];
    return (
      <dl className="space-y-2">
        {blanks.map((blank) => (
          <div key={blank.id} className="flex flex-wrap gap-x-3">
            <dt className="type-caption-bold">{blank.label}</dt>
            <dd className="type-body submission-text">{submission.answers?.[blank.id] || '（未填写）'}</dd>
          </div>
        ))}
      </dl>
    );
  }
  if (!submission.answerMd?.trim()) return <Empty />;
  return <pre className="submission-text">{submission.answerMd}</pre>;
}

function Empty() {
  return <p className="type-caption" style={{ color: 'var(--text-tertiary)' }}>（没有记录作答内容）</p>;
}
