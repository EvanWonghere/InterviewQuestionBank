import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useReviewStore } from '@/store/reviewStore';
import { useThemeStore } from '@/store/themeStore';
import { useAuth } from '@/context/AuthContext';

const THEME_OPTIONS = [
  { value: 'auto', label: '系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
];

const LIST_ENTRIES = [
  { key: 'due', path: '/review/due', label: '今日复习' },
  { key: 'wrong', path: '/review/wrong', label: '历史错题' },
  { key: 'mastered', path: '/review/mastered', label: '已掌握' },
  { key: 'weak', path: '/review/weak', label: '薄弱知识点' },
  { key: 'history', path: '/review/history', label: '作答历史' },
];

const TOP_LINKS = [
  { to: '/', label: '进度总览', match: (p) => p === '/' },
  { to: '/map', label: '闯关地图', match: (p) => p === '/map' || p.startsWith('/stage/') },
  { to: '/quiz', label: '全部题目', match: (p) => p === '/quiz' },
  { to: '/random-practice', label: '随机刷题', match: (p) => p === '/random-practice' },
  { to: '/mock-interview', label: '模拟面试', match: (p) => p === '/mock-interview' },
];

/**
 * @param {{
 *   categories: Array<{ id: string, name: string, order: number }>,
 *   questions: Array<{ id: string, categoryId: string }>,
 *   className?: string,
 *   onClose?: () => void,
 * }} props
 */
export default function Sidebar({ categories, questions = [], className = '', onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const path = location.pathname;
  const reviewStates = useReviewStore((s) => s.reviewStates);
  const attempts = useReviewStore((s) => s.attempts);
  const { configured, user, isAdmin, signIn, signOut } = useAuth();
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
    const counts = { due: 0, wrong: 0, mastered: 0, weak: 0, history: attempts.length };
    const weak = new Set();
    questions.forEach((q) => {
      const state = reviewStates[q.id];
      if (!state) return;
      if (state.dueAt && new Date(state.dueAt) <= new Date()) counts.due++;
      if (state.lapseCount > 0) {
        counts.wrong++;
        q.tags?.forEach((tag) => weak.add(tag));
      }
      if (state.intervalDays >= 30 && state.lastQuality >= 4) counts.mastered++;
    });
    counts.weak = weak.size;
    return counts;
  }, [questions, reviewStates, attempts.length]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    questions.forEach((q) => {
      if (q.categoryId) counts[q.categoryId] = (counts[q.categoryId] ?? 0) + 1;
    });
    return counts;
  }, [questions]);

  const goToBlog = () => {
    window.location.href = '/';
  };

  // ── Theme ───────────────────────────────────────────────────
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);

  return (
    <aside className={className}>
      {/* Brand */}
      <div className="mb-6 flex items-start justify-between gap-2 px-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={goToBlog}
            className="font-display text-left text-[19px] font-semibold leading-tight tracking-tight"
            style={{ color: 'var(--text-primary)' }}
            title="返回博客"
          >
            Interview Bank
          </button>
          <p className="type-micro mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Unity · C++ · Algorithms
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭菜单"
            className="menu-button -mr-1 lg:hidden"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="mb-5">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="搜索题目"
          className="input-apple"
          aria-label="按关键词搜索题目"
        />
      </form>

      {/* Primary nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {TOP_LINKS.map((link) => {
          const isActive = link.match(path);
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`}
            >
              <span>{link.label}</span>
            </Link>
          );
        })}

        <SectionLabel>智能列表</SectionLabel>
        {LIST_ENTRIES.map(({ key, path: listPath, label }) => {
          const isActive = path === listPath;
          const count = listCounts[key] ?? 0;
          return (
            <Link
              key={key}
              to={listPath}
              className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`}
            >
              <span>{label}</span>
              {count > 0 && <span className="sidebar-count">{count}</span>}
            </Link>
          );
        })}

        <SectionLabel>分类</SectionLabel>
        {[...(categories || [])]
          .sort((a, b) => a.order - b.order)
          .map((cat) => {
            const isActive = path === `/quiz/${cat.id}`;
            return (
              <Link
                key={cat.id}
                to={`/quiz/${cat.id}`}
                className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`}
              >
                <span className="truncate">{cat.name}</span>
                {categoryCounts[cat.id] > 0 && (
                  <span className="sidebar-count">{categoryCounts[cat.id]}</span>
                )}
              </Link>
            );
          })}
      </nav>

      {/* Theme toggle */}
      <div className="mt-4 pt-4 divider-subtle">
        <div className="mb-2 flex items-center justify-between px-1">
          <span
            className="type-eyebrow"
            style={{ color: 'var(--text-quaternary)' }}
          >
            外观
          </span>
        </div>
        <div className="theme-segmented" role="radiogroup" aria-label="主题模式">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={themeMode === opt.value}
              onClick={() => setThemeMode(opt.value)}
              className={themeMode === opt.value ? 'is-active' : ''}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Account and cloud state */}
      <div className="mt-3 pt-3 divider-subtle">
        {!configured ? <p className="px-3 type-micro" style={{ color: 'var(--text-quaternary)' }}>本地模式 · 云端尚未配置</p> : user ? (
          <div className="space-y-1">
            <p className="truncate px-3 type-micro" style={{ color: 'var(--text-tertiary)' }}>{user.email}</p>
            {isAdmin && <><Link to="/manage/questions" className="sidebar-nav-item">管理题目</Link><Link to="/manage/migrate" className="sidebar-nav-item">迁移旧数据</Link></>}
            <button type="button" onClick={signOut} className="sidebar-nav-item w-full">退出登录</button>
          </div>
        ) : <button type="button" onClick={signIn} className="sidebar-nav-item w-full">管理员登录</button>}
      </div>
    </aside>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      className="type-eyebrow mt-5 mb-1 px-3"
      style={{ color: 'var(--text-quaternary)' }}
    >
      {children}
    </div>
  );
}
