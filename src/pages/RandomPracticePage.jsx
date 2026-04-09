import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuestions } from '@/context/QuestionsContext';
import { useProgressStore } from '@/store/progressStore';
import QuestionContent from '@/components/quiz/QuestionContent';

/**
 * @param {string[]} ids
 */
function shuffleIds(ids) {
  const arr = [...ids];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * @param {string[]} ids
 */
function pickRandomId(ids) {
  if (!ids.length) return null;
  return ids[Math.floor(Math.random() * ids.length)] ?? null;
}

const DIFFICULTY_FILTER_OPTIONS = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
];

function toggleSelection(list, value) {
  if (list.includes(value)) return list.filter((item) => item !== value);
  return [...list, value];
}

export default function RandomPracticePage() {
  const navigate = useNavigate();
  const { questions: allQuestions, categories, loading, error } = useQuestions();
  const setProgress = useProgressStore((s) => s.setProgress);

  const questionMap = useMemo(
    () => new Map(allQuestions.map((q) => [q.id, q])),
    [allQuestions]
  );
  const [phase, setPhase] = useState('setup');
  const [endlessMode, setEndlessMode] = useState(false);
  const [allowRepeat, setAllowRepeat] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState([]);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [pendingIds, setPendingIds] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answeredCurrent, setAnsweredCurrent] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [cycle, setCycle] = useState(1);
  const [sessionRecord, setSessionRecord] = useState(/** @type {Record<string, 'mastered'|'review'|'wrong'>} */ ({}));

  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      const categoryMatch =
        selectedCategoryIds.length === 0 || selectedCategoryIds.includes(q.categoryId);
      const difficultyMatch =
        selectedDifficulties.length === 0 || selectedDifficulties.includes(q.difficulty);
      return categoryMatch && difficultyMatch;
    });
  }, [allQuestions, selectedCategoryIds, selectedDifficulties]);

  const allQuestionIds = useMemo(() => filteredQuestions.map((q) => q.id), [filteredQuestions]);
  const currentQuestion = currentQuestionId ? questionMap.get(currentQuestionId) ?? null : null;
  const totalCount = allQuestionIds.length;
  const remainingCount = Math.max(0, totalCount - completedCount);

  const startPractice = useCallback(() => {
    if (!allQuestionIds.length) return;
    const shuffled = shuffleIds(allQuestionIds);
    setCurrentQuestionId(shuffled[0] ?? null);
    setPendingIds(shuffled.slice(1));
    setShowAnswer(false);
    setAnsweredCurrent(false);
    setCompletedCount(0);
    setCycle(1);
    setSessionRecord({});
    setPhase('practicing');
  }, [allQuestionIds]);

  const markCurrent = useCallback(
    (status) => {
      if (!currentQuestionId) return;
      setProgress(currentQuestionId, status);
      setSessionRecord((prev) => ({ ...prev, [currentQuestionId]: status }));
      if (!answeredCurrent) {
        setAnsweredCurrent(true);
        setCompletedCount((count) => count + 1);
      }
    },
    [answeredCurrent, currentQuestionId, setProgress]
  );

  const goNext = useCallback(() => {
    if (!answeredCurrent || !allQuestionIds.length) return;

    if (!endlessMode) {
      if (!pendingIds.length) {
        setPhase('finished');
        return;
      }
      const [nextId, ...rest] = pendingIds;
      setCurrentQuestionId(nextId ?? null);
      setPendingIds(rest);
      setShowAnswer(false);
      setAnsweredCurrent(false);
      return;
    }

    if (allowRepeat) {
      const nextId = pickRandomId(allQuestionIds);
      setCurrentQuestionId(nextId);
      setShowAnswer(false);
      setAnsweredCurrent(false);
      return;
    }

    if (!pendingIds.length) {
      const reshuffled = shuffleIds(allQuestionIds);
      setCurrentQuestionId(reshuffled[0] ?? null);
      setPendingIds(reshuffled.slice(1));
      setCycle((v) => v + 1);
      setShowAnswer(false);
      setAnsweredCurrent(false);
      return;
    }

    const [nextId, ...rest] = pendingIds;
    setCurrentQuestionId(nextId ?? null);
    setPendingIds(rest);
    setShowAnswer(false);
    setAnsweredCurrent(false);
  }, [allQuestionIds, allowRepeat, answeredCurrent, endlessMode, pendingIds]);

  const resetToSetup = useCallback(() => {
    setPhase('setup');
    setCurrentQuestionId(null);
    setPendingIds([]);
    setShowAnswer(false);
    setAnsweredCurrent(false);
    setCompletedCount(0);
    setCycle(1);
    setSessionRecord({});
  }, []);

  const summary = useMemo(() => {
    const values = Object.values(sessionRecord);
    const mastered = values.filter((v) => v === 'mastered').length;
    const review = values.filter((v) => v === 'review').length;
    const wrong = values.filter((v) => v === 'wrong').length;
    return { mastered, review, wrong };
  }, [sessionRecord]);

  useEffect(() => {
    if (phase !== 'practicing' || !currentQuestion) return;
    const onKeyDown = (e) => {
      if (e.target?.closest('input, textarea, [contenteditable="true"]')) return;
      switch (e.key) {
        case '1':
          e.preventDefault();
          markCurrent('mastered');
          break;
        case '2':
          e.preventDefault();
          markCurrent('review');
          break;
        case '3':
          e.preventDefault();
          markCurrent('wrong');
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentQuestion, markCurrent, phase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500 dark:text-slate-400">加载题目中…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
        {error}
      </div>
    );
  }

  if (!allQuestions.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-slate-500 dark:text-slate-400">当前没有可用题目</p>
        <Link
          to="/quiz"
          className="rounded-lg border border-white/75 bg-white/75 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
        >
          去题库看看
        </Link>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-white/65 bg-white/70 p-6 shadow-sm dark:border-white/15 dark:bg-white/6">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">🎲 随机刷题</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          题目分类和难度随机抽取，必须先标记本题结果，才能进入下一题。
        </p>

        <div className="mt-6 space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/65 bg-white/65 p-3 dark:border-white/10 dark:bg-white/5">
            <input
              type="checkbox"
              checked={endlessMode}
              onChange={(e) => {
                const next = e.target.checked;
                setEndlessMode(next);
                if (!next) setAllowRepeat(false);
              }}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-400 dark:border-slate-500 dark:bg-slate-700"
            />
            <span>
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">无尽模式</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                开启后不会结束，直到你主动退出。
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/65 bg-white/65 p-3 dark:border-white/10 dark:bg-white/5">
            <input
              type="checkbox"
              checked={allowRepeat}
              disabled={!endlessMode}
              onChange={(e) => setAllowRepeat(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-400 disabled:opacity-50 dark:border-slate-500 dark:bg-slate-700"
            />
            <span>
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">
                允许重复抽题
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                {endlessMode
                  ? '关闭后每轮刷完全部题目之前不会重复。'
                  : '该开关仅在无尽模式下生效。'}
              </span>
            </span>
          </label>

          <div className="rounded-lg border border-white/65 bg-white/65 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                分类过滤（可选）
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategoryIds([])}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                清空
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[...(categories || [])]
                .sort((a, b) => a.order - b.order)
                .map((cat) => {
                  const active = selectedCategoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryIds((prev) => toggleSelection(prev, cat.id))}
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'border-sky-300 bg-sky-200/80 text-sky-800 dark:border-sky-400/60 dark:bg-sky-500/25 dark:text-sky-100'
                          : 'border-white/70 bg-white/70 text-slate-600 hover:bg-white dark:border-white/15 dark:bg-white/8 dark:text-slate-300 dark:hover:bg-white/12'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              不选表示全部分类。
            </p>
          </div>

          <div className="rounded-lg border border-white/65 bg-white/65 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                难度过滤（可选）
              </p>
              <button
                type="button"
                onClick={() => setSelectedDifficulties([])}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                清空
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DIFFICULTY_FILTER_OPTIONS.map((opt) => {
                const active = selectedDifficulties.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setSelectedDifficulties((prev) => toggleSelection(prev, opt.value))
                    }
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                      active
                        ? 'border-indigo-300 bg-indigo-200/80 text-indigo-800 dark:border-indigo-400/60 dark:bg-indigo-500/25 dark:text-indigo-100'
                        : 'border-white/70 bg-white/70 text-slate-600 hover:bg-white dark:border-white/15 dark:bg-white/8 dark:text-slate-300 dark:hover:bg-white/12'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              不选表示全部难度。
            </p>
          </div>
        </div>

        {totalCount === 0 && (
          <p className="mt-4 text-sm text-rose-600 dark:text-rose-300">
            当前过滤条件下没有题目，请调整分类或难度。
          </p>
        )}

        <button
          type="button"
          onClick={startPractice}
          disabled={totalCount === 0}
          className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-medium text-white hover:opacity-90 dark:bg-slate-100 dark:text-slate-900"
        >
          开始随机刷题（共 {totalCount} 题）
        </button>
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-white/65 bg-white/70 p-6 shadow-sm dark:border-white/15 dark:bg-white/6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">✅ 本轮随机刷题完成</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          你已完成一整轮随机刷题，可继续新开一轮或返回首页。
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-emerald-200/80 bg-emerald-100/60 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{summary.mastered}</p>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-300/90">掌握</p>
          </div>
          <div className="rounded-lg border border-amber-200/80 bg-amber-100/60 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
            <p className="text-lg font-semibold text-amber-700 dark:text-amber-300">{summary.review}</p>
            <p className="text-xs text-amber-700/80 dark:text-amber-300/90">需复习</p>
          </div>
          <div className="rounded-lg border border-rose-200/80 bg-rose-100/60 p-3 dark:border-rose-500/20 dark:bg-rose-500/10">
            <p className="text-lg font-semibold text-rose-700 dark:text-rose-300">{summary.wrong}</p>
            <p className="text-xs text-rose-700/80 dark:text-rose-300/90">答错</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={resetToSetup}
            className="w-full rounded-lg border border-white/70 bg-white/75 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
          >
            再来一轮
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-slate-100 dark:text-slate-900"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="rounded-xl border border-white/65 bg-white/70 px-4 py-3 dark:border-white/15 dark:bg-white/6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-800 dark:text-slate-100">随机刷题</span>
            <span className="mx-2">·</span>
            {endlessMode ? (
              <>
                <span>无尽模式</span>
                <span className="mx-2">·</span>
                <span>{allowRepeat ? '允许重复' : `第 ${cycle} 轮（本轮不重复）`}</span>
              </>
            ) : (
              <span>
                进度 {completedCount} / {totalCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={resetToSetup}
            className="rounded-md border border-white/70 bg-white/75 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
          >
            退出随机刷题
          </button>
        </div>
        {!endlessMode && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">剩余 {remainingCount} 题未完成</p>
        )}
      </div>

      <article className="rounded-xl border border-white/65 bg-white/75 p-6 shadow-sm dark:border-white/15 dark:bg-white/8">
        {currentQuestion ? (
          <>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{currentQuestion.title}</h2>
            <div className="mt-3 text-slate-700 dark:text-slate-300">
              <QuestionContent content={currentQuestion.question} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAnswer((v) => !v)}
                className="rounded-lg border border-white/70 bg-white/75 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
              >
                {showAnswer ? '收起答案' : '展开答案'}
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                先标记答题结果，再进入下一题（快捷键：1 已掌握 / 2 需复习 / 3 加入错题本）
              </span>
            </div>

            {showAnswer && (
              <div className="answer-block mt-4 rounded-lg border border-l-4 border-sky-200/80 border-l-sky-400 bg-white/70 p-4 dark:border-sky-500/30 dark:border-l-sky-400 dark:bg-white/6">
                <p className="mb-2 text-sm font-medium text-sky-700 dark:text-sky-300">参考答案</p>
                <QuestionContent content={currentQuestion.answer} />
              </div>
            )}

            {(() => {
              const currentStatus = sessionRecord[currentQuestionId] ?? null;
              const MARK_BUTTONS = [
                {
                  status: 'mastered',
                  label: '已掌握',
                  shortcut: '1',
                  icon: '✅',
                  activeClass: 'border-emerald-500 bg-emerald-500 text-white dark:border-emerald-600 dark:bg-emerald-600',
                  inactiveClass: 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20',
                },
                {
                  status: 'review',
                  label: '需要复习',
                  shortcut: '2',
                  icon: '🔄',
                  activeClass: 'border-amber-500 bg-amber-500 text-white dark:border-amber-600 dark:bg-amber-600',
                  inactiveClass: 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20',
                },
                {
                  status: 'wrong',
                  label: '加入错题本',
                  shortcut: '3',
                  icon: '❌',
                  activeClass: 'border-rose-500 bg-rose-500 text-white dark:border-rose-600 dark:bg-rose-600',
                  inactiveClass: 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20',
                },
              ];
              return (
                <div className="mt-6 flex flex-wrap gap-2">
                  {MARK_BUTTONS.map(({ status, label, shortcut, icon, activeClass, inactiveClass }) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => markCurrent(status)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-95 ${currentStatus === status ? activeClass : inactiveClass}`}
                    >
                      {label}（{shortcut}） {icon}
                    </button>
                  ))}
                </div>
              );
            })()}
          </>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">没有可用题目</p>
        )}
      </article>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={goNext}
          disabled={!answeredCurrent}
          className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-slate-100 dark:text-slate-900"
        >
          下一题
        </button>
      </div>
    </div>
  );
}
