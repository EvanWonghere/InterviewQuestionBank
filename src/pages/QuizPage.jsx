import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuestions } from '@/context/QuestionsContext';
import QuestionCard from '@/components/quiz/QuestionCard';
import { useProgressStore } from '@/store/progressStore';

const LIST_STATUS_LABELS = {
  wrong: { title: '错题本', empty: '错题本暂无题目，去做题并加入错题本吧', cta: '去刷题' },
  review: { title: '需复习', empty: '暂无需复习的题目', cta: '去刷题' },
  mastered: { title: '已掌握', empty: '暂无已掌握的题目', cta: '去刷题' },
};

const DIFFICULTY_OPTIONS = [
  { value: '', label: '全部', activeClass: 'border border-white/80 bg-white/85 text-slate-800 dark:border-white/20 dark:bg-white/15 dark:text-slate-100', inactiveClass: 'border border-white/65 bg-white/55 text-slate-600 hover:bg-white/75 dark:border-white/10 dark:bg-white/6 dark:text-slate-300 dark:hover:bg-white/10' },
  { value: 'easy', label: '简单', activeClass: 'border border-emerald-300 bg-emerald-200/80 text-emerald-800 dark:border-emerald-400/60 dark:bg-emerald-500/25 dark:text-emerald-100', inactiveClass: 'border border-emerald-200/80 bg-emerald-100/65 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/18' },
  { value: 'medium', label: '中等', activeClass: 'border border-amber-300 bg-amber-200/80 text-amber-800 dark:border-amber-400/60 dark:bg-amber-500/25 dark:text-amber-100', inactiveClass: 'border border-amber-200/80 bg-amber-100/65 text-amber-700 hover:bg-amber-100 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/18' },
  { value: 'hard', label: '困难', activeClass: 'border border-rose-300 bg-rose-200/80 text-rose-800 dark:border-rose-400/60 dark:bg-rose-500/25 dark:text-rose-100', inactiveClass: 'border border-rose-200/80 bg-rose-100/65 text-rose-700 hover:bg-rose-100 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/18' },
];

function matchKeyword(question, keyword) {
  if (!keyword || !keyword.trim()) return true;
  const k = keyword.trim().toLowerCase();
  const title = (question.title ?? '').toLowerCase();
  const q = (question.question ?? '').toLowerCase();
  const answer = (question.answer ?? '').toLowerCase();
  const tags = (question.tags ?? []).join(' ').toLowerCase();
  return title.includes(k) || q.includes(k) || answer.includes(k) || tags.includes(k);
}

export default function QuizPage() {
  const { categoryId, status: listStatus } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') ?? '';
  const { questions: allQuestions, loading, error } = useQuestions();
  const progress = useProgressStore((s) => s.progress);
  const setProgress = useProgressStore((s) => s.setProgress);
  const cardContainerRef = useRef(null);

  const [difficultyFilter, setDifficultyFilter] = useState('');

  const questionsByCategoryOrList = useMemo(() => {
    if (!allQuestions.length) return [];
    const sorted = [...allQuestions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    if (listStatus && (listStatus === 'wrong' || listStatus === 'review' || listStatus === 'mastered')) {
      return sorted.filter((q) => progress[q.id] === listStatus);
    }
    if (categoryId) return sorted.filter((q) => q.categoryId === categoryId);
    return sorted;
  }, [allQuestions, categoryId, listStatus, progress]);

  const questionsFilteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return questionsByCategoryOrList;
    return questionsByCategoryOrList.filter((q) => matchKeyword(q, searchQuery));
  }, [questionsByCategoryOrList, searchQuery]);

  const questions = useMemo(() => {
    if (!difficultyFilter) return questionsFilteredBySearch;
    return questionsFilteredBySearch.filter((q) => q.difficulty === difficultyFilter);
  }, [questionsFilteredBySearch, difficultyFilter]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const current = questions[currentIndex] ?? null;
  const currentId = current?.id ?? null;

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
    setShowAnswer(false);
  }, []);
  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
    setShowAnswer(false);
  }, [questions.length]);
  const toggleAnswer = useCallback(() => setShowAnswer((v) => !v), []);
  useEffect(() => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setDifficultyFilter('');
  }, [categoryId, listStatus, searchQuery]);

  useEffect(() => {
    setCurrentIndex((i) => Math.min(i, Math.max(0, questions.length - 1)));
  }, [questions.length]);

  useEffect(() => {
    if (!cardContainerRef.current || !current) return;
    cardContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [current]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!current) return;
      if (e.target?.closest('input, textarea, [contenteditable="true"]')) return;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goNext();
          break;
        case ' ':
          e.preventDefault();
          toggleAnswer();
          break;
        case '1':
          e.preventDefault();
          if (currentId) setProgress(currentId, 'mastered');
          break;
        case '2':
          e.preventDefault();
          if (currentId) setProgress(currentId, 'review');
          break;
        case '3':
          e.preventDefault();
          if (currentId) setProgress(currentId, 'wrong');
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [current, currentId, goPrev, goNext, setProgress, toggleAnswer]);

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
  if (!questionsByCategoryOrList.length) {
    const listMeta = listStatus ? LIST_STATUS_LABELS[listStatus] : null;
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-slate-500 dark:text-slate-400">
          {listMeta ? listMeta.empty : '该分类下暂无题目'}
        </p>
        <Link
          to="/quiz"
          className="rounded-lg border border-white/75 bg-white/75 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
        >
          {listMeta ? listMeta.cta : '查看全部题目'}
        </Link>
      </div>
    );
  }

  if (searchQuery.trim() && !questionsFilteredBySearch.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-slate-500 dark:text-slate-400">
          未找到包含「{searchQuery}」的题目，可尝试其他关键词或清除搜索
        </p>
        <Link
          to="/quiz"
          className="rounded-lg border border-white/75 bg-white/75 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
        >
          清除搜索
        </Link>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-slate-500 dark:text-slate-400">
          当前筛选下暂无题目，试试切换难度或分类
        </p>
        <button
          type="button"
          onClick={() => setDifficultyFilter('')}
          className="rounded-lg border border-white/75 bg-white/75 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
        >
          清除难度筛选
        </button>
      </div>
    );
  }

  const statusIcon = (q) => {
    const s = progress[q.id];
    if (s === 'mastered') return '✅';
    if (s === 'review') return '⚠️';
    if (s === 'wrong') return '❌';
    return '○';
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-6">
      <div className="panel-surface w-full shrink-0 rounded-xl p-3 md:w-72">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {searchQuery.trim() ? `搜索「${searchQuery}」 (${questionsFilteredBySearch.length})` : '题目列表'}
          </h3>
        </div>
        <div className="mb-3 flex flex-wrap gap-1">
          {DIFFICULTY_OPTIONS.map(({ value, label, activeClass, inactiveClass }) => (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => setDifficultyFilter(value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                difficultyFilter === value ? activeClass : inactiveClass
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <ul className="max-h-[40vh] space-y-1 overflow-y-auto md:max-h-[70vh]">
          {questions.map((q, i) => (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex(i);
                  setShowAnswer(false);
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  i === currentIndex
                    ? 'bg-white/85 font-medium text-slate-900 ring-1 ring-white/75 dark:bg-white/15 dark:text-slate-100 dark:ring-white/20'
                    : 'text-slate-700 hover:bg-white/55 dark:text-slate-200 dark:hover:bg-white/10'
                }`}
              >
                <span className="mr-2">{statusIcon(q)}</span>
                {q.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="min-w-0 flex-1">
        <div key={current?.id} className="question-card-enter">
          <QuestionCard
            question={current}
            showAnswer={showAnswer}
            onToggleAnswer={toggleAnswer}
            cardRef={cardContainerRef}
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="rounded-lg border border-white/75 bg-white/75 px-4 py-2 text-sm font-medium text-slate-700 transition-all active:scale-95 disabled:opacity-50 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
          >
            上一题
          </button>
          <span className="min-w-[4rem] text-center text-sm font-medium tabular-nums text-slate-500 dark:text-slate-400">
            {currentIndex + 1} / {questions.length}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={currentIndex === questions.length - 1}
            className="rounded-lg border border-white/75 bg-white/75 px-4 py-2 text-sm font-medium text-slate-700 transition-all active:scale-95 disabled:opacity-50 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
          >
            下一题
          </button>
          <span className="hidden text-xs text-slate-400 sm:inline dark:text-slate-500">
            ← → 翻页，空格 展开/收起，1 已掌握，2 需复习，3 加入错题本
          </span>
        </div>
      </div>
    </div>
  );
}
