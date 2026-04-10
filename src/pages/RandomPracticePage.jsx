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
      <div className="flex items-center justify-center py-24">
        <p className="type-body" style={{ color: 'var(--text-tertiary)' }}>加载题目中…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-2xl p-5 type-body"
        style={{ background: 'var(--error-bg)', color: 'var(--error-fg)' }}
      >
        {error}
      </div>
    );
  }

  if (!allQuestions.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
        <p className="type-body" style={{ color: 'var(--text-tertiary)' }}>当前没有可用题目</p>
        <Link to="/quiz" className="btn-blue-outline">去题库看看</Link>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-8">
          <p className="type-eyebrow mb-3" style={{ color: 'var(--apple-blue)' }}>
            Random Practice
          </p>
          <h1 className="type-display-md mb-2" style={{ color: 'var(--text-primary)' }}>
            随机刷题
          </h1>
          <p className="type-body" style={{ color: 'var(--text-tertiary)' }}>
            题目分类和难度随机抽取，必须先标记本题结果，才能进入下一题。
          </p>
        </header>

        <section className="surface-card-elevated p-7 space-y-5">
          {/* Mode toggles */}
          <div className="space-y-3">
            <label
              className="flex cursor-pointer items-start gap-3 rounded-xl px-4 py-3"
              style={{ background: 'var(--filter-bg)' }}
            >
              <input
                type="checkbox"
                checked={endlessMode}
                onChange={(e) => {
                  const next = e.target.checked;
                  setEndlessMode(next);
                  if (!next) setAllowRepeat(false);
                }}
                className="mt-1 h-4 w-4"
                style={{ accentColor: 'var(--apple-blue)' }}
              />
              <span>
                <span className="type-body-emphasis block" style={{ color: 'var(--text-primary)' }}>
                  无尽模式
                </span>
                <span className="type-caption block mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  开启后不会结束，直到你主动退出。
                </span>
              </span>
            </label>

            <label
              className="flex cursor-pointer items-start gap-3 rounded-xl px-4 py-3"
              style={{ background: 'var(--filter-bg)' }}
            >
              <input
                type="checkbox"
                checked={allowRepeat}
                disabled={!endlessMode}
                onChange={(e) => setAllowRepeat(e.target.checked)}
                className="mt-1 h-4 w-4 disabled:opacity-50"
                style={{ accentColor: 'var(--apple-blue)' }}
              />
              <span>
                <span
                  className="type-body-emphasis block"
                  style={{ color: endlessMode ? 'var(--text-primary)' : 'var(--text-quaternary)' }}
                >
                  允许重复抽题
                </span>
                <span className="type-caption block mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  {endlessMode
                    ? '关闭后每轮刷完全部题目之前不会重复。'
                    : '该开关仅在无尽模式下生效。'}
                </span>
              </span>
            </label>
          </div>

          {/* Category filter */}
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <p className="type-eyebrow" style={{ color: 'var(--text-quaternary)' }}>
                分类过滤（可选）
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategoryIds([])}
                className="type-micro-bold"
                style={{ color: 'var(--apple-link)' }}
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
                      className={`filter-pill ${active ? 'is-active' : ''}`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
            </div>
            <p className="type-micro mt-2" style={{ color: 'var(--text-quaternary)' }}>
              不选表示全部分类
            </p>
          </div>

          {/* Difficulty filter */}
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <p className="type-eyebrow" style={{ color: 'var(--text-quaternary)' }}>
                难度过滤（可选）
              </p>
              <button
                type="button"
                onClick={() => setSelectedDifficulties([])}
                className="type-micro-bold"
                style={{ color: 'var(--apple-link)' }}
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
                    className={`filter-pill ${active ? 'is-active' : ''}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <p className="type-micro mt-2" style={{ color: 'var(--text-quaternary)' }}>
              不选表示全部难度
            </p>
          </div>

          {totalCount === 0 && (
            <p
              className="type-caption rounded-xl px-3 py-2"
              style={{ background: 'var(--error-bg)', color: 'var(--error-fg)' }}
            >
              当前过滤条件下没有题目，请调整分类或难度。
            </p>
          )}

          <button
            type="button"
            onClick={startPractice}
            disabled={totalCount === 0}
            className="btn-blue-large w-full"
          >
            开始随机刷题（共 {totalCount} 题）
          </button>
        </section>
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-8 text-center">
          <p className="type-eyebrow mb-3" style={{ color: 'var(--apple-blue)' }}>
            Session Complete
          </p>
          <h2 className="type-display-md" style={{ color: 'var(--text-primary)' }}>
            本轮随机刷题完成
          </h2>
          <p className="type-body mt-2" style={{ color: 'var(--text-tertiary)' }}>
            你已完成一整轮随机刷题，可继续新开一轮或返回首页。
          </p>
        </header>

        <section className="surface-card-elevated p-7">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { label: '已掌握', value: summary.mastered, color: 'var(--success-fg)' },
              { label: '需复习', value: summary.review, color: 'var(--warning-fg)' },
              { label: '答错', value: summary.wrong, color: 'var(--error-fg)' },
            ].map((s) => (
              <div key={s.label}>
                <p className="type-display-md" style={{ color: s.color }}>{s.value}</p>
                <p className="type-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-2.5">
            <button type="button" onClick={resetToSetup} className="btn-blue w-full">
              再来一轮
            </button>
            <button type="button" onClick={() => navigate('/')} className="btn-neutral w-full">
              返回首页
            </button>
          </div>
        </section>
      </div>
    );
  }

  const currentStatus = sessionRecord[currentQuestionId] ?? null;
  const MARK_BUTTONS = [
    { status: 'mastered', label: '已掌握', shortcut: '1', className: 'btn-status btn-status-mastered' },
    { status: 'review', label: '需要复习', shortcut: '2', className: 'btn-status btn-status-review' },
    { status: 'wrong', label: '加入错题本', shortcut: '3', className: 'btn-status btn-status-wrong' },
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      {/* Status bar */}
      <div className="surface-card flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="type-caption" style={{ color: 'var(--text-secondary)' }}>
          <span className="type-body-emphasis" style={{ color: 'var(--text-primary)' }}>
            随机刷题
          </span>
          <span className="mx-2" style={{ color: 'var(--text-quaternary)' }}>·</span>
          {endlessMode ? (
            <>
              <span>无尽模式</span>
              <span className="mx-2" style={{ color: 'var(--text-quaternary)' }}>·</span>
              <span>{allowRepeat ? '允许重复' : `第 ${cycle} 轮`}</span>
            </>
          ) : (
            <span>
              进度 {completedCount} / {totalCount} · 剩余 {remainingCount}
            </span>
          )}
        </div>
        <button type="button" onClick={resetToSetup} className="btn-ghost type-caption">
          退出
        </button>
      </div>

      {/* Question card */}
      <article className="surface-card-elevated p-6 lg:p-8">
        {currentQuestion ? (
          <>
            <h2 className="type-card-title mb-4" style={{ color: 'var(--text-primary)' }}>
              {currentQuestion.title}
            </h2>
            <div style={{ color: 'var(--text-secondary)' }}>
              <QuestionContent content={currentQuestion.question} />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAnswer((v) => !v)}
                className={showAnswer ? 'btn-neutral' : 'btn-blue'}
              >
                {showAnswer ? '收起答案' : '展开答案'}
              </button>
              <span className="type-micro" style={{ color: 'var(--text-quaternary)' }}>
                先标记结果再进入下一题（1 已掌握 / 2 需复习 / 3 加入错题本）
              </span>
            </div>

            {showAnswer && (
              <div
                className="answer-block mt-5 rounded-2xl p-6"
                style={{
                  background: 'var(--filter-bg)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <p className="type-eyebrow mb-3" style={{ color: 'var(--apple-blue)' }}>
                  参考答案
                </p>
                <QuestionContent content={currentQuestion.answer} />
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {MARK_BUTTONS.map(({ status, label, shortcut, className }) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => markCurrent(status)}
                  className={`${className} ${currentStatus === status ? 'is-active' : ''}`}
                >
                  <span className="dot" />
                  {label}（{shortcut}）
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="type-body" style={{ color: 'var(--text-tertiary)' }}>没有可用题目</p>
        )}
      </article>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={goNext}
          disabled={!answeredCurrent}
          className="btn-blue"
        >
          下一题
        </button>
      </div>
    </div>
  );
}
