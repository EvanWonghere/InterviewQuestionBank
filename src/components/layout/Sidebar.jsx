import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useProgressStore } from '@/store/progressStore';
import { useSyncStore } from '@/store/syncStore';
import { findOrCreateGist, pullGist } from '@/lib/gistApi';

const LIST_ENTRIES = [
  { path: 'wrong', label: '错题本', emoji: '🎯' },
  { path: 'review', label: '需复习', emoji: '🔄' },
  { path: 'mastered', label: '已掌握', emoji: '✅' },
];

/**
 * @param {{ categories: Array<{ id: string, name: string, order: number }>, questions: Array<{ id: string, categoryId: string }> }} props
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

  // ── Cloud sync panel state ────────────────────────────────────────────────
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
    idle:    { dot: 'bg-neutral-400', label: '未配置' },
    syncing: { dot: 'bg-blue-500 animate-pulse', label: '同步中…' },
    synced:  { dot: 'bg-green-500', label: '已同步' },
    error:   { dot: 'bg-red-500', label: '同步失败' },
  }[syncStatus] ?? { dot: 'bg-neutral-400', label: '' };

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-neutral-200 bg-neutral-50 p-4 md:w-56 md:border-b-0 md:border-r dark:border-neutral-700 dark:bg-neutral-900">
      <button
        type="button"
        onClick={goToBlog}
        className="sidebar-nav-item mb-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
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
          className={`sidebar-nav-item rounded-lg px-3 py-2 text-sm font-medium ${
            path === '/mock-interview' ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
          }`}
        >
          <span className="mr-1.5" aria-hidden>👨‍💼</span>
          模拟面试
        </Link>
        <Link
          to="/"
          className={`sidebar-nav-item rounded-lg px-3 py-2 text-sm font-medium ${
            path === '/' ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
          }`}
        >
          进度总览
        </Link>
        <Link
          to="/quiz"
          className={`sidebar-nav-item rounded-lg px-3 py-2 text-sm font-medium ${
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
              className={`sidebar-nav-item rounded-lg px-3 py-2 text-sm font-medium ${
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
                className={`sidebar-nav-item flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                }`}
              >
                <span>{cat.name}</span>
                {categoryCounts[cat.id] > 0 && (
                  <span className="ml-1.5 shrink-0 rounded-full bg-neutral-300 px-1.5 py-0.5 text-xs dark:bg-neutral-600">
                    {categoryCounts[cat.id]}
                  </span>
                )}
              </Link>
            );
          })}
      </nav>

      {/* ── Cloud sync panel ─────────────────────────────────────────── */}
      <div className="mt-auto pt-4">
        <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">
          <button
            type="button"
            onClick={() => setSyncOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden>☁</span>
              云同步
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`inline-block h-2 w-2 rounded-full ${syncStatusMeta.dot}`} />
              <span className="text-xs text-neutral-400 dark:text-neutral-500">{syncStatusMeta.label}</span>
              <span className="text-xs text-neutral-400 dark:text-neutral-500">{syncOpen ? '▲' : '▼'}</span>
            </span>
          </button>

          {syncOpen && (
            <div className="mt-2 rounded-lg border border-neutral-200 bg-white p-3 text-xs dark:border-neutral-700 dark:bg-neutral-800">
              {token ? (
                // Configured state
                <div className="flex flex-col gap-2">
                  <p className="text-neutral-500 dark:text-neutral-400">
                    进度已与 GitHub Gist 同步。切换设备时填入相同 Token 即可拉取。
                  </p>
                  {syncStatus === 'error' && (
                    <p className="rounded bg-red-50 px-2 py-1 text-red-600 dark:bg-red-950/30 dark:text-red-400">
                      {syncError}
                    </p>
                  )}
                  <p className="break-all text-neutral-400 dark:text-neutral-500">
                    Gist ID: {gistId}
                  </p>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="rounded-md border border-red-300 px-2 py-1 text-red-600 transition-colors hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    断开同步
                  </button>
                </div>
              ) : (
                // Setup state
                <div className="flex flex-col gap-2">
                  <p className="text-neutral-500 dark:text-neutral-400">
                    填入 GitHub Personal Access Token（仅需勾选 <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-700">gist</code> 权限），进度将自动跨设备同步。
                  </p>
                  <input
                    type="password"
                    value={tokenDraft}
                    onChange={(e) => setTokenDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveToken()}
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5 font-mono placeholder:text-neutral-300 focus:border-neutral-400 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:placeholder:text-neutral-500"
                  />
                  {syncStatus === 'error' && (
                    <p className="rounded bg-red-50 px-2 py-1 text-red-600 dark:bg-red-950/30 dark:text-red-400">
                      {syncError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveToken}
                    disabled={!tokenDraft.trim() || syncStatus === 'syncing'}
                    className="rounded-md bg-neutral-800 px-3 py-1.5 font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300"
                  >
                    {syncStatus === 'syncing' ? '连接中…' : '连接并同步'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
