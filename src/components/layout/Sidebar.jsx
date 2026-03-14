import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useProgressStore } from '@/store/progressStore';

const LIST_ENTRIES = [
  { path: 'wrong', label: '错题本', emoji: '🎯' },
  { path: 'review', label: '需复习', emoji: '🔄' },
  { path: 'mastered', label: '已掌握', emoji: '✅' },
];

/**
 * @param {{ categories: Array<{ id: string, name: string, order: number }>, questions: Array<{ id: string }> }} props
 */
export default function Sidebar({ categories, questions = [] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const path = location.pathname;
  const progress = useProgressStore((s) => s.progress);
  const searchQuery = path === '/quiz' ? (searchParams.get('q') ?? '') : '';
  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = useCallback(
    (e) => {
      e?.preventDefault();
      const trimmed = searchInput?.trim() ?? '';
      if (trimmed) navigate(`/quiz?q=${encodeURIComponent(trimmed)}`);
      else navigate('/quiz');
    },
    [navigate, searchInput]
  );

  const listCounts = useMemo(() => {
    const counts = { wrong: 0, review: 0, mastered: 0 };
    questions.forEach((q) => {
      const s = progress[q.id];
      if (s === 'wrong') counts.wrong++;
      else if (s === 'review') counts.review++;
      else if (s === 'mastered') counts.mastered++;
    });
    return counts;
  }, [questions, progress]);

  const goToBlog = () => {
    window.location.href = '/';
  };

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-neutral-200 bg-neutral-50 p-4 md:w-56 md:border-b-0 md:border-r dark:border-neutral-700 dark:bg-neutral-900">
      <button
        type="button"
        onClick={goToBlog}
        className="mb-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
        title="返回博客主页"
      >
        <span aria-hidden>🏠</span>
        返回博客
      </button>
      <form onSubmit={handleSearchSubmit} className="mb-3">
        <div className="flex gap-1">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜索题目…"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-800 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500"
            aria-label="按关键词搜索题目"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-neutral-800 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            搜索
          </button>
        </div>
      </form>
      <nav className="flex flex-row flex-wrap gap-1 md:flex-col">
        <Link
          to="/mock-interview"
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            path === '/mock-interview' ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
          }`}
        >
          <span className="mr-1.5" aria-hidden>👨‍💼</span>
          模拟面试
        </Link>
        <Link
          to="/"
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            path === '/' ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
          }`}
        >
          进度总览
        </Link>
        <Link
          to="/quiz"
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            path === '/quiz' ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
          }`}
        >
          全部题目
        </Link>
        <div className="my-2 w-full border-t border-neutral-200 dark:border-neutral-700" />
        <span className="w-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          智能列表
        </span>
        {LIST_ENTRIES.map(({ path: statusPath, label, emoji }) => {
          const listPath = `/list/${statusPath}`;
          const isActive = path === listPath;
          const count = listCounts[statusPath] ?? 0;
          return (
            <Link
              key={statusPath}
              to={listPath}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
              }`}
            >
              <span className="mr-1.5">{emoji}</span>
              {label}
              {count > 0 && (
                <span className="ml-1.5 rounded-full bg-neutral-300 px-1.5 py-0.5 text-xs dark:bg-neutral-600">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
        <div className="my-2 w-full border-t border-neutral-200 dark:border-neutral-700" />
        <span className="w-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          分类
        </span>
        {[...(categories || [])]
          .sort((a, b) => a.order - b.order)
          .map((cat) => {
            const isActive = path === `/quiz/${cat.id}`;
            return (
              <Link
                key={cat.id}
                to={`/quiz/${cat.id}`}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}
