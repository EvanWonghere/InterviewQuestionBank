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
  { value: '', label: '全部' },
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
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
  }, [current?.id]);

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
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [current, goPrev, goNext, toggleAnswer]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-neutral-500 dark:text-neutral-400">加载题目中…</p>
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
        <p className="text-neutral-500 dark:text-neutral-400">
          {listMeta ? listMeta.empty : '该分类下暂无题目'}
        </p>
        <Link
          to="/quiz"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {listMeta ? listMeta.cta : '查看全部题目'}
        </Link>
      </div>
    );
  }

  if (searchQuery.trim() && !questionsFilteredBySearch.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-neutral-500 dark:text-neutral-400">
          未找到包含「{searchQuery}」的题目，可尝试其他关键词或清除搜索
        </p>
        <Link
          to="/quiz"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          清除搜索
        </Link>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-neutral-500 dark:text-neutral-400">
          当前筛选下暂无题目，试试切换难度或分类
        </p>
        <button
          type="button"
          onClick={() => setDifficultyFilter('')}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
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
      <div className="w-full shrink-0 md:w-64">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
            {searchQuery.trim() ? `搜索「${searchQuery}」 (${questionsFilteredBySearch.length})` : '题目列表'}
          </h3>
        </div>
        <div className="mb-3 flex flex-wrap gap-1">
          {DIFFICULTY_OPTIONS.map(({ value, label }) => (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => setDifficultyFilter(value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                difficultyFilter === value
                  ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600'
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
                    ? 'bg-neutral-200 font-medium dark:bg-neutral-700 dark:text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
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
        <QuestionCard
          question={current}
          showAnswer={showAnswer}
          onToggleAnswer={toggleAnswer}
          cardRef={cardContainerRef}
        />
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-neutral-600"
          >
            上一题
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={currentIndex === questions.length - 1}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-neutral-600"
          >
            下一题
          </button>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            方向键 ← → 翻页，空格 展开/收起答案
          </span>
        </div>
      </div>
    </div>
  );
}
