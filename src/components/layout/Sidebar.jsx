import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useProgressStore } from '@/store/progressStore';
import { useSyncStore } from '@/store/syncStore';
import { useThemeStore } from '@/store/themeStore';
import { findOrCreateGist, pullGist } from '@/lib/gistApi';

const THEME_OPTIONS = [
  { value: 'auto', label: '系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
];

const LIST_ENTRIES = [
  { path: 'wrong', label: '错题本' },
  { path: 'review', label: '需复习' },
  { path: 'mastered', label: '已掌握' },
];

const TOP_LINKS = [
  { to: '/', label: '进度总览', match: (p) => p === '/' },
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

  // ── Cloud sync ──────────────────────────────────────────────
  const token = useSyncStore((s) => s.token);
  const gistId = useSyncStore((s) => s.gistId);
  const syncStatus = useSyncStore((s) => s.syncStatus);
  const syncError = useSyncStore((s) => s.syncError);
  const setToken = useSyncStore((s) => s.setToken);
  const setGistId = useSyncStore((s) => s.setGistId);
  const setSyncStatus = useSyncStore((s) => s.setSyncStatus);
  const setProgressBulk = useProgressStore((s) => s.setProgressBulk);

  const [syncOpen, setSyncOpen] = useState(false);
  const [tokenDraft, setTokenDraft] = useState('');

  // ── Theme ───────────────────────────────────────────────────
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);

  const handleSaveToken = useCallback(async () => {
    const t = tokenDraft.trim();
    if (!t) return;
    setSyncStatus('syncing');
    try {
      const id = await findOrCreateGist(t);
      const data = await pullGist(t, id);
      if (data.progress && typeof data.progress === 'object') {
        setProgressBulk(data.progress);
      }
      setToken(t);
      setGistId(id);
      setSyncStatus('synced');
      setTokenDraft('');
    } catch (e) {
      setSyncStatus('error', e.message);
    }
  }, [tokenDraft, setToken, setGistId, setSyncStatus, setProgressBulk]);

  const handleDisconnect = useCallback(() => {
    setToken('');
    setGistId('');
    setSyncStatus('idle');
    setTokenDraft('');
  }, [setToken, setGistId, setSyncStatus]);

  const syncStatusMeta = {
    idle: { dot: '#86868b', label: '未配置' },
    syncing: { dot: '#0071e3', label: '同步中' },
    synced: { dot: '#30d158', label: '已同步' },
    error: { dot: '#ff453a', label: '同步失败' },
  }[syncStatus] ?? { dot: '#86868b', label: '' };

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
        {LIST_ENTRIES.map(({ path: statusPath, label }) => {
          const listPath = `/list/${statusPath}`;
          const isActive = path === listPath;
          const count = listCounts[statusPath] ?? 0;
          return (
            <Link
              key={statusPath}
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

      {/* Sync panel */}
      <div className="mt-3 pt-3 divider-subtle">
        <button
          type="button"
          onClick={() => setSyncOpen((v) => !v)}
          className="sidebar-nav-item w-full"
        >
          <span className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{
                background: syncStatusMeta.dot,
                animation: syncStatus === 'syncing' ? 'pulse 1.4s ease-in-out infinite' : 'none',
              }}
            />
            云同步
          </span>
          <span className="sidebar-count">{syncStatusMeta.label}</span>
        </button>

        {syncOpen && (
          <div
            className="mt-2 rounded-xl border p-3"
            style={{
              borderColor: 'var(--border-subtle)',
              background: 'var(--surface-card)',
            }}
          >
            {token ? (
              <div className="flex flex-col gap-2.5">
                <p className="type-micro" style={{ color: 'var(--text-tertiary)' }}>
                  已与 GitHub Gist 同步。换设备时填入相同 Token 即可拉取。
                </p>
                {syncStatus === 'error' && (
                  <p
                    className="type-micro rounded-md px-2 py-1.5"
                    style={{ background: 'var(--error-bg)', color: 'var(--error-fg)' }}
                  >
                    {syncError}
                  </p>
                )}
                <p className="type-micro break-all" style={{ color: 'var(--text-quaternary)' }}>
                  Gist {gistId.slice(0, 8)}…
                </p>
                <button type="button" onClick={handleDisconnect} className="btn-ghost type-micro">
                  断开同步
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <p className="type-micro" style={{ color: 'var(--text-tertiary)' }}>
                  填入 GitHub Personal Access Token（仅需 <code className="font-mono" style={{ color: 'var(--text-secondary)' }}>gist</code> 权限）实现跨设备同步。
                </p>
                <input
                  type="password"
                  value={tokenDraft}
                  onChange={(e) => setTokenDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveToken()}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="input-apple font-mono"
                />
                {syncStatus === 'error' && (
                  <p
                    className="type-micro rounded-md px-2 py-1.5"
                    style={{ background: 'var(--error-bg)', color: 'var(--error-fg)' }}
                  >
                    {syncError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleSaveToken}
                  disabled={!tokenDraft.trim() || syncStatus === 'syncing'}
                  className="btn-blue"
                >
                  {syncStatus === 'syncing' ? '连接中…' : '连接并同步'}
                </button>
              </div>
            )}
          </div>
        )}
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
