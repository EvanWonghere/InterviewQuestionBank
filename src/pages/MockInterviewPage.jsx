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
 * @returns {Array<{ id: string, categoryId: string, title: string, question: string, answer: string, difficulty?: string, tags?: string[], order?: number }>}
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
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <p className="text-neutral-500 dark:text-neutral-400">加载题目中…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
        <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <h1 className="mb-2 text-center text-xl font-semibold text-neutral-900 dark:text-white">
            👨‍💼 模拟面试
          </h1>
          <p className="mb-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
            按分类抽题，优先未掌握题目
          </p>
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              题目数量
            </label>
            <div className="flex gap-2">
              {COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                    count === n
                      ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                      : 'border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800'
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
            className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
          >
            开始模拟面试
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'interviewing') {
    return (
      <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
        <div className="shrink-0 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              模拟面试
            </span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className="h-full rounded-full bg-neutral-700 transition-all dark:bg-neutral-300"
                  style={{ width: `${total ? (currentIndex + 1) / total * 100 : 0}%` }}
                />
              </div>
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {currentIndex + 1} / {total}
              </span>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="mx-auto max-w-3xl">
            {currentQuestion && (
              <article className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                <div className="p-6">
                  <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">
                    {currentQuestion.title}
                  </h2>
                  <div className="text-neutral-700 dark:text-neutral-300">
                    <QuestionContent content={currentQuestion.question} />
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={toggleAnswer}
                      className="rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                    >
                      {showAnswer ? '收起答案' : '查看答案解析'}
                    </button>
                    {showAnswer && (
                      <div className="answer-block mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                        <p className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                          参考答案
                        </p>
                        <QuestionContent content={currentQuestion.answer} />
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )}
          </div>
        </div>
        <div className="shrink-0 border-t border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => markAndNext('wrong')}
              className="rounded-lg border border-red-500 px-5 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950"
            >
              忘了/答错 ❌
            </button>
            <button
              type="button"
              onClick={() => markAndNext('mastered')}
              className="rounded-lg border border-green-500 px-5 py-2.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-50 dark:text-green-300 dark:hover:bg-green-950"
            >
              掌握了 ✅
            </button>
          </div>
        </div>
      </div>
    );
  }

  // phase === 'summary'
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
        <h1 className="mb-2 text-center text-xl font-semibold text-neutral-900 dark:text-white">
          👨‍💼 模拟面试 · 复盘
        </h1>
        <div className="mb-6 flex justify-center gap-6 text-center">
          <div>
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {summaryStats.mastered}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">掌握</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
              {summaryStats.wrong}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">待复习</p>
          </div>
        </div>
        {wrongQuestions.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              本次答错 / 待复习
            </p>
            <ul className="space-y-1.5 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/50">
              {wrongQuestions.map((q) => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/quiz/${q.categoryId}`)}
                    className="w-full rounded-md px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    {q.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={resetToSetup}
            className="w-full rounded-xl border border-neutral-300 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            再来一轮
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-medium text-white hover:opacity-90 dark:bg-neutral-100 dark:text-neutral-900"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}
