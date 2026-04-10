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
  if (!questionsByCategoryOrList.length) {
    const listMeta = listStatus ? LIST_STATUS_LABELS[listStatus] : null;
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
        <p className="type-body" style={{ color: 'var(--text-tertiary)' }}>
          {listMeta ? listMeta.empty : '该分类下暂无题目'}
        </p>
        <Link to="/quiz" className="btn-blue-outline">
          {listMeta ? listMeta.cta : '查看全部题目'}
        </Link>
      </div>
    );
  }

  if (searchQuery.trim() && !questionsFilteredBySearch.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
        <p className="type-body" style={{ color: 'var(--text-tertiary)' }}>
          未找到包含「{searchQuery}」的题目，可尝试其他关键词或清除搜索
        </p>
        <Link to="/quiz" className="btn-blue-outline">
          清除搜索
        </Link>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
        <p className="type-body" style={{ color: 'var(--text-tertiary)' }}>
          当前筛选下暂无题目，试试切换难度或分类
        </p>
        <button
          type="button"
          onClick={() => setDifficultyFilter('')}
          className="btn-blue-outline"
        >
          清除难度筛选
        </button>
      </div>
    );
  }

  const statusDotClass = (q) => {
    const s = progress[q.id];
    if (s === 'mastered') return 'status-dot s-mastered';
    if (s === 'review') return 'status-dot s-review';
    if (s === 'wrong') return 'status-dot s-wrong';
    return 'status-dot';
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      {/* Question list / filter sidebar */}
      <aside className="surface-card w-full shrink-0 p-4 lg:w-72 lg:self-start lg:sticky lg:top-6">
        <div className="mb-3 px-1">
          <p className="type-eyebrow" style={{ color: 'var(--text-quaternary)' }}>
            {searchQuery.trim() ? `搜索结果 · ${questionsFilteredBySearch.length}` : '题目列表'}
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {DIFFICULTY_OPTIONS.map(({ value, label }) => (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => setDifficultyFilter(value)}
              className={`filter-pill ${difficultyFilter === value ? 'is-active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="max-h-[44vh] space-y-0.5 overflow-y-auto lg:max-h-[68vh]">
          {questions.map((q, i) => (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex(i);
                  setShowAnswer(false);
                }}
                className={`quiz-list-item ${i === currentIndex ? 'is-active' : ''}`}
              >
                <span className={statusDotClass(q)} />
                <span className="truncate">{q.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Question card */}
      <div className="min-w-0 flex-1">
        <div key={current?.id} className="question-card-enter">
          <QuestionCard
            question={current}
            showAnswer={showAnswer}
            onToggleAnswer={toggleAnswer}
            cardRef={cardContainerRef}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="btn-neutral"
          >
            上一题
          </button>
          <span
            className="type-caption min-w-[4.5rem] text-center tabular-nums"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {currentIndex + 1} / {questions.length}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={currentIndex === questions.length - 1}
            className="btn-neutral"
          >
            下一题
          </button>
          <span
            className="type-micro hidden sm:inline"
            style={{ color: 'var(--text-quaternary)' }}
          >
            ← → 翻页 · 空格 展开/收起 · 1 已掌握 · 2 需复习 · 3 加入错题本
          </span>
        </div>
      </div>
    </div>
  );
}
