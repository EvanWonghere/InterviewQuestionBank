import { useEffect, useState } from 'react';
import Markdown from '@/components/common/Markdown';
import { revealCloudQuestion } from '@/data/questionRepository';

export default function FastAnswerPanel({ question }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState(() => question.solution
    ? { solution: question.solution, error: false }
    : { solution: null, error: false });

  useEffect(() => {
    if (question.solution) return;
    let active = true;
    revealCloudQuestion(question.id).then(
      (solution) => { if (active) setState({ solution, error: false }); },
      () => { if (active) setState({ solution: null, error: true }); },
    );
    return () => { active = false; };
  }, [question.id, question.solution, attempt]);

  const solution = question.solution ?? state.solution;
  if (state.error && !question.solution) return <section className="mt-6" role="alert">
    <p>答案加载失败，请重试。</p>
    <button type="button" className="btn-neutral mt-3" onClick={() => { setState({ solution: null, error: false }); setAttempt((value) => value + 1); }}>重新加载答案</button>
  </section>;
  if (!solution) return <p className="mt-6" role="status">正在加载答案…</p>;

  const optionIds = Array.isArray(solution.correctOptionIds) ? solution.correctOptionIds : [];
  const options = question.payload?.options ?? [];
  const blanks = question.payload?.blanks ?? [];
  const answers = solution.acceptedAnswers ?? {};
  const hasOptions = options.some((option) => optionIds.includes(option.id));
  const hasBlanks = blanks.some((blank) => Array.isArray(answers[blank.id]) && answers[blank.id].length);
  const hasText = Boolean(solution.referenceAnswerMd || solution.explanationMd || solution.rubricMd || question.answer);

  return <section className="mt-6 divider-subtle pt-6 space-y-5" aria-label="速刷答案">
    <p className="type-caption">速刷只供浏览，不计入作答历史与复习计划。</p>
    {options.length > 0 && <div>
      <h3 className="reference-title">选项</h3>
      <ul className="space-y-2">{options.map((option) => <li key={option.id} className="answer-option">
        <span>{option.id}. </span><Markdown content={option.text} />
        {optionIds.includes(option.id) && <strong>正确答案</strong>}
      </li>)}</ul>
    </div>}
    {blanks.length > 0 && <div className="space-y-2">
      <h3 className="reference-title">填空答案</h3>
      {blanks.map((blank) => <div key={blank.id}>
        <p className="type-caption-bold">{blank.label}</p>
        {Array.isArray(answers[blank.id]) && answers[blank.id].length
          ? answers[blank.id].map((value, index) => <Markdown key={`${blank.id}-${index}`} content={value} />)
          : <p>暂无此空的参考答案。</p>}
      </div>)}
    </div>}
    {hasText && <div className="answer-block reference-block">
      <h3 className="reference-title">参考答案与解析</h3>
      <Markdown content={solution.referenceAnswerMd || question.answer || ''} />
      <Markdown content={solution.explanationMd || ''} />
      {solution.rubricMd && <><p className="type-eyebrow mt-5 mb-2">评分标准</p><Markdown content={solution.rubricMd} /></>}
    </div>}
    {!hasOptions && !hasBlanks && !hasText && <p role="status">暂无参考答案。</p>}
  </section>;
}
