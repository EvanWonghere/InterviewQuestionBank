import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuestions } from '@/context/QuestionsContext';
import QuestionCard from '@/components/quiz/QuestionCard';
import { useProgressStore } from '@/store/progressStore';
import { QUESTION_TYPE_LABELS } from '@/lib/questionSchema';
import { findQuestionByStableId } from '@/lib/questionNavigation';

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
  if (/^q-\d+$/.test(k)) return [question.id, question.legacyId].some((id) => id?.toLowerCase() === k);
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
  const requestedQuestionId = searchParams.get('questionId')?.trim() ?? '';
  const { questions: allQuestions, loading, error } = useQuestions();
  const progress = useProgressStore((s) => s.progress);
  const cardContainerRef = useRef(null);

  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');

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
    return questionsFilteredBySearch.filter((q) =>
      (!difficultyFilter || q.difficulty === difficultyFilter)
      && (!typeFilter || q.type === typeFilter)
      && (!tagFilter || q.tags?.includes(tagFilter))
    );
  }, [questionsFilteredBySearch, difficultyFilter, typeFilter, tagFilter]);
  const availableTypes = useMemo(() => [...new Set(questionsFilteredBySearch.map((question) => question.type).filter(Boolean))], [questionsFilteredBySearch]);
  const availableTags = useMemo(() => [...new Set(questionsFilteredBySearch.flatMap((question) => question.tags ?? []))].sort(), [questionsFilteredBySearch]);

  // Track the open question by id, not position: list refreshes (e.g. an AI draft saved with sort_order 0)
  // and status changes (rating a question out of 错题本) must not swap the question being answered.
  const [selection, setSelection] = useState(() => ({ id: requestedQuestionId || null, index: 0 }));
  const [showAnswer, setShowAnswer] = useState(false);
  const selectedQuestion = selection.id ? findQuestionByStableId(allQuestions, selection.id) : null;
  const foundIndex = selectedQuestion ? questions.findIndex((q) => q.id === selectedQuestion.id) : -1;
  const detached = selectedQuestion && foundIndex < 0 ? selectedQuestion : null;
  const currentIndex = foundIndex >= 0 ? foundIndex : Math.min(selection.index, Math.max(0, questions.length - 1));
  const current = foundIndex >= 0 ? questions[foundIndex] : detached ?? questions[currentIndex] ?? null;

  const select = useCallback((index) => {
    const target = questions[index];
    if (!target) return;
    setSelection({ id: target.id, index });
    setShowAnswer(false);
  }, [questions]);
  // A detached question has left the list; the one that slid into its slot is "next".
  const prevIndex = detached ? selection.index - 1 : currentIndex - 1;
  const nextIndex = detached ? selection.index : currentIndex + 1;
  const goPrev = useCallback(() => select(prevIndex), [select, prevIndex]);
  const goNext = useCallback(() => select(nextIndex), [select, nextIndex]);
  const toggleAnswer = useCallback(() => setShowAnswer((v) => !v), []);
  useEffect(() => {
    setSelection({ id: requestedQuestionId || null, index: 0 });
    setShowAnswer(false);
    setDifficultyFilter('');
    setTypeFilter('');
    setTagFilter('');
  }, [categoryId, listStatus, searchQuery, requestedQuestionId]);

  const currentId = current?.id;
  useEffect(() => {
    if (!cardContainerRef.current || !currentId) return;
    cardContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentId]);

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
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [current, goPrev, goNext]);

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
  const requestedQuestion = requestedQuestionId
    ? findQuestionByStableId(allQuestions, requestedQuestionId)
    : null;
  if (requestedQuestionId && !requestedQuestion) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
        <p role="alert" className="type-body" style={{ color: 'var(--text-tertiary)' }}>
          未找到题目「{requestedQuestionId}」，链接可能已失效或题目已归档。不会自动打开其他题目。
        </p>
        <Link to="/quiz" className="btn-blue-outline">查看全部题目</Link>
      </div>
    );
  }
  // Keep a just-rated question open even if it emptied the list (e.g. the last item in 错题本).
  if (!questionsByCategoryOrList.length && !detached) {
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

  if (searchQuery.trim() && !questionsFilteredBySearch.length && !detached) {
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

  if (!questions.length && !detached) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
        <p className="type-body" style={{ color: 'var(--text-tertiary)' }}>
          当前筛选下暂无题目，试试切换难度或分类
        </p>
        <button
          type="button"
          onClick={() => { setDifficultyFilter(''); setTypeFilter(''); setTagFilter(''); }}
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
        <div className="mb-4 grid gap-2">
          <select className="input-apple" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="按题型筛选">
            <option value="">全部题型</option>
            {availableTypes.map((type) => <option key={type} value={type}>{QUESTION_TYPE_LABELS[type] ?? type}</option>)}
          </select>
          <select className="input-apple" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} aria-label="按知识点筛选">
            <option value="">全部知识点</option>
            {availableTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        </div>

        <ul className="max-h-[44vh] space-y-0.5 overflow-y-auto lg:max-h-[68vh]">
          {questions.map((q, i) => (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => select(i)}
                className={`quiz-list-item ${q.id === current?.id ? 'is-active' : ''}`}
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
            disabled={prevIndex < 0}
            className="btn-neutral"
          >
            上一题
          </button>
          <span
            className="type-caption min-w-[4.5rem] text-center tabular-nums"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {detached ? '已移出列表' : `${currentIndex + 1} / ${questions.length}`}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={nextIndex > questions.length - 1}
            className="btn-neutral"
          >
            下一题
          </button>
          <span
            className="type-micro hidden sm:inline"
            style={{ color: 'var(--text-quaternary)' }}
          >
            ← → 翻页 · 选择掌握程度后才计入历史与复习计划
          </span>
        </div>
      </div>
    </div>
  );
}
