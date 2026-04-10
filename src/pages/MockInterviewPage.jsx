import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuestions } from '@/context/QuestionsContext';
import { useProgressStore } from '@/store/progressStore';
import QuestionContent from '@/components/quiz/QuestionContent';

const COUNT_OPTIONS = [5, 10, 20];
const DEFAULT_COUNT = 10;

/**
 * 从题目池中按分类均匀抽取，优先非已掌握。返回打乱顺序的题目数组。
 * @param {Array<{ id: string, categoryId: string, order?: number }>} allQuestions
 * @param {Array<{ id: string, order: number }>} categories
 * @param {Record<string, string>} progress
 * @param {number} count
 */
function pickQuestions(allQuestions, categories, progress, count) {
  if (!allQuestions?.length || count <= 0) return [];

  const byCategory = {};
  allQuestions.forEach((q) => {
    if (!byCategory[q.categoryId]) byCategory[q.categoryId] = [];
    byCategory[q.categoryId].push(q);
  });

  const sortedCategories = [...(categories || [])].sort((a, b) => a.order - b.order);
  const sortByPreferNonMastered = (list) =>
    [...list].sort((a, b) => {
      const aMastered = progress[a.id] === 'mastered' ? 1 : 0;
      const bMastered = progress[b.id] === 'mastered' ? 1 : 0;
      if (aMastered !== bMastered) return aMastered - bMastered;
      return (a.order ?? 0) - (b.order ?? 0);
    });

  const perCat = Math.ceil(count / Math.max(1, sortedCategories.length));
  let selected = [];
  sortedCategories.forEach((cat) => {
    const list = sortByPreferNonMastered(byCategory[cat.id] || []);
    selected.push(...list.slice(0, perCat));
  });

  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }
  return selected.slice(0, count);
}

export default function MockInterviewPage() {
  const navigate = useNavigate();
  const { questions: allQuestions, categories, loading, error } = useQuestions();
  const progress = useProgressStore((s) => s.progress);
  const setProgress = useProgressStore((s) => s.setProgress);

  const [phase, setPhase] = useState('setup');
  const [count, setCount] = useState(DEFAULT_COUNT);
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [roundResults, setRoundResults] = useState(/** @type {Record<string, 'mastered'|'wrong'>} */ ({}));

  const startInterview = useCallback(() => {
    const picked = pickQuestions(allQuestions, categories, progress, count);
    setDeck(picked);
    setCurrentIndex(0);
    setShowAnswer(false);
    setRoundResults({});
    setPhase('interviewing');
  }, [allQuestions, categories, progress, count]);

  const currentQuestion = deck[currentIndex] ?? null;
  const total = deck.length;
  const isLast = total > 0 && currentIndex === total - 1;

  const markAndNext = useCallback(
    (status) => {
      if (!currentQuestion) return;
      setProgress(currentQuestion.id, status);
      setRoundResults((prev) => ({ ...prev, [currentQuestion.id]: status }));
      setShowAnswer(false);
      if (isLast) {
        setPhase('summary');
      } else {
        setCurrentIndex((i) => i + 1);
      }
    },
    [currentQuestion, isLast, setProgress]
  );

  const toggleAnswer = useCallback(() => setShowAnswer((v) => !v), []);

  const summaryStats = useMemo(() => {
    const mastered = Object.values(roundResults).filter((s) => s === 'mastered').length;
    const wrong = Object.values(roundResults).filter((s) => s === 'wrong').length;
    return { mastered, wrong };
  }, [roundResults]);

  const wrongQuestionIds = useMemo(
    () => Object.entries(roundResults).filter(([, s]) => s === 'wrong').map(([id]) => id),
    [roundResults]
  );
  const wrongQuestions = useMemo(
    () => deck.filter((q) => wrongQuestionIds.includes(q.id)),
    [deck, wrongQuestionIds]
  );

  const resetToSetup = useCallback(() => {
    setPhase('setup');
    setDeck([]);
    setCurrentIndex(0);
    setRoundResults({});
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center surface-page">
        <p className="type-body" style={{ color: 'var(--text-tertiary)' }}>加载题目中…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center surface-page">
        <p className="type-body" style={{ color: 'var(--error-fg)' }}>{error}</p>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="flex min-h-screen items-center justify-center surface-page p-5">
        <div className="w-full max-w-md surface-card-elevated p-8">
          <p
            className="type-eyebrow mb-3 text-center"
            style={{ color: 'var(--apple-blue)' }}
          >
            Mock Interview
          </p>
          <h1
            className="type-display-sm mb-2 text-center"
            style={{ color: 'var(--text-primary)' }}
          >
            模拟面试
          </h1>
          <p
            className="type-caption mb-7 text-center"
            style={{ color: 'var(--text-tertiary)' }}
          >
            按分类抽题，优先未掌握题目。
          </p>

          <div className="mb-7">
            <p
              className="type-eyebrow mb-3"
              style={{ color: 'var(--text-quaternary)' }}
            >
              题目数量
            </p>
            <div className="flex gap-2">
              {COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={`filter-pill flex-1 justify-center py-2.5 ${
                    count === n ? 'is-active' : ''
                  }`}
                >
                  {n} 题
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={startInterview}
            disabled={!allQuestions?.length}
            className="btn-blue-large w-full"
          >
            开始模拟面试
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-ghost mt-2 w-full type-caption"
          >
            返回主页
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'interviewing') {
    return (
      <div className="flex min-h-screen flex-col surface-page">
        {/* Top bar */}
        <header
          className="shrink-0 px-5 py-4"
          style={{
            background: 'var(--surface-sidebar)',
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <span
              className="type-body-emphasis"
              style={{ color: 'var(--text-primary)' }}
            >
              模拟面试
            </span>
            <div className="flex items-center gap-3">
              <div className="progress-track w-32">
                <div
                  className="progress-fill"
                  style={{ width: `${total ? ((currentIndex + 1) / total) * 100 : 0}%` }}
                />
              </div>
              <span
                className="type-caption-bold tabular-nums"
                style={{ color: 'var(--text-secondary)' }}
              >
                {currentIndex + 1} / {total}
              </span>
            </div>
          </div>
        </header>

        {/* Question */}
        <div className="flex-1 overflow-auto px-5 py-8">
          <div className="mx-auto max-w-3xl">
            {currentQuestion && (
              <article className="surface-card-elevated p-6 lg:p-8">
                <h2
                  className="type-card-title mb-4"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {currentQuestion.title}
                </h2>
                <div style={{ color: 'var(--text-secondary)' }}>
                  <QuestionContent content={currentQuestion.question} />
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={toggleAnswer}
                    className={showAnswer ? 'btn-neutral' : 'btn-blue'}
                  >
                    {showAnswer ? '收起答案' : '查看答案解析'}
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
                      <QuestionContent content={currentQuestion.answer} />
                    </div>
                  )}
                </div>
              </article>
            )}
          </div>
        </div>

        {/* Bottom action bar */}
        <footer
          className="shrink-0 px-5 py-5"
          style={{
            background: 'var(--surface-sidebar)',
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => markAndNext('wrong')}
              className="btn-status btn-status-wrong is-active"
            >
              <span className="dot" />
              忘了 / 答错
            </button>
            <button
              type="button"
              onClick={() => markAndNext('mastered')}
              className="btn-status btn-status-mastered is-active"
            >
              <span className="dot" />
              掌握了
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // phase === 'summary'
  return (
    <div className="flex min-h-screen items-center justify-center surface-page p-5">
      <div className="w-full max-w-lg surface-card-elevated p-8">
        <p
          className="type-eyebrow mb-3 text-center"
          style={{ color: 'var(--apple-blue)' }}
        >
          Session Recap
        </p>
        <h1
          className="type-display-sm mb-7 text-center"
          style={{ color: 'var(--text-primary)' }}
        >
          模拟面试 · 复盘
        </h1>

        <div className="mb-7 grid grid-cols-2 gap-6 text-center">
          <div>
            <p className="type-display-md" style={{ color: 'var(--success-fg)' }}>
              {summaryStats.mastered}
            </p>
            <p className="type-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>
              掌握
            </p>
          </div>
          <div>
            <p className="type-display-md" style={{ color: 'var(--warning-fg)' }}>
              {summaryStats.wrong}
            </p>
            <p className="type-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>
              待复习
            </p>
          </div>
        </div>

        {wrongQuestions.length > 0 && (
          <div className="mb-7">
            <p
              className="type-eyebrow mb-2"
              style={{ color: 'var(--text-quaternary)' }}
            >
              本次答错 / 待复习
            </p>
            <ul
              className="space-y-1 rounded-xl p-2"
              style={{ background: 'var(--filter-bg)' }}
            >
              {wrongQuestions.map((q) => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/quiz/${q.categoryId}`)}
                    className="quiz-list-item"
                  >
                    <span className="status-dot s-wrong" />
                    <span className="truncate">{q.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button type="button" onClick={resetToSetup} className="btn-blue w-full">
            再来一轮
          </button>
          <button type="button" onClick={() => navigate('/')} className="btn-neutral w-full">
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}
