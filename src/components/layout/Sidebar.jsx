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
    idle: { dot: 'bg-slate-400', label: '未配置' },
    syncing: { dot: 'bg-blue-500 animate-pulse', label: '同步中…' },
    synced: { dot: 'bg-emerald-500', label: '已同步' },
    error: { dot: 'bg-rose-500', label: '同步失败' },
  }[syncStatus] ?? { dot: 'bg-slate-400', label: '' };

  return (
    <aside className="panel-surface flex w-full shrink-0 flex-col border-b border-white/45 p-4 md:w-64 md:border-b-0 md:border-r">
      <div className="mb-3 rounded-xl border border-white/65 bg-white/55 px-3 py-2 text-xs text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-300">
        <p className="font-semibold">学习状态</p>
        <p className="mt-0.5 text-slate-500 dark:text-slate-400">继续保持节奏，今天再完成一轮题目。</p>
      </div>
      <button
        type="button"
        onClick={goToBlog}
        className="sidebar-nav-item mb-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white/55 dark:text-slate-200 dark:hover:bg-white/10"
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
            className="w-full rounded-lg border border-white/65 bg-white/65 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-500/50"
            aria-label="按关键词搜索题目"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg border border-white/70 bg-white/70 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
          >
            搜索
          </button>
        </div>
      </form>
      <nav className="flex flex-row flex-wrap gap-1 md:flex-col">
        <Link
          to="/mock-interview"
          className={`sidebar-nav-item rounded-lg px-3 py-2 text-sm font-medium ${
            path === '/mock-interview' ? 'bg-white/80 text-slate-900 ring-1 ring-white/70 dark:bg-white/18 dark:text-slate-100 dark:ring-white/25' : 'text-slate-700 hover:bg-white/55 dark:text-slate-200 dark:hover:bg-white/10'
          }`}
        >
          <span className="mr-1.5" aria-hidden>👨‍💼</span>
          模拟面试
        </Link>
        <Link
          to="/random-practice"
          className={`sidebar-nav-item rounded-lg px-3 py-2 text-sm font-medium ${
            path === '/random-practice' ? 'bg-white/80 text-slate-900 ring-1 ring-white/70 dark:bg-white/18 dark:text-slate-100 dark:ring-white/25' : 'text-slate-700 hover:bg-white/55 dark:text-slate-200 dark:hover:bg-white/10'
          }`}
        >
          <span className="mr-1.5" aria-hidden>🎲</span>
          随机刷题
        </Link>
        <Link
          to="/"
          className={`sidebar-nav-item rounded-lg px-3 py-2 text-sm font-medium ${
            path === '/' ? 'bg-white/80 text-slate-900 ring-1 ring-white/70 dark:bg-white/18 dark:text-slate-100 dark:ring-white/25' : 'text-slate-700 hover:bg-white/55 dark:text-slate-200 dark:hover:bg-white/10'
          }`}
        >
          进度总览
        </Link>
        <Link
          to="/quiz"
          className={`sidebar-nav-item rounded-lg px-3 py-2 text-sm font-medium ${
            path === '/quiz' ? 'bg-white/80 text-slate-900 ring-1 ring-white/70 dark:bg-white/18 dark:text-slate-100 dark:ring-white/25' : 'text-slate-700 hover:bg-white/55 dark:text-slate-200 dark:hover:bg-white/10'
          }`}
        >
          全部题目
        </Link>
        <div className="my-2 w-full border-t border-white/45 dark:border-white/10" />
        <span className="w-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                isActive ? 'bg-white/80 text-slate-900 ring-1 ring-white/70 dark:bg-white/18 dark:text-slate-100 dark:ring-white/25' : 'text-slate-700 hover:bg-white/55 dark:text-slate-200 dark:hover:bg-white/10'
              }`}
            >
              <span className="mr-1.5">{emoji}</span>
              {label}
              {count > 0 && (
                <span className="ml-1.5 rounded-full border border-slate-200/80 bg-white/75 px-1.5 py-0.5 text-xs text-slate-600 dark:border-white/15 dark:bg-white/10 dark:text-slate-300">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
        <div className="my-2 w-full border-t border-white/45 dark:border-white/10" />
        <span className="w-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                  isActive ? 'bg-white/80 text-slate-900 ring-1 ring-white/70 dark:bg-white/18 dark:text-slate-100 dark:ring-white/25' : 'text-slate-700 hover:bg-white/55 dark:text-slate-200 dark:hover:bg-white/10'
                }`}
              >
                <span>{cat.name}</span>
                {categoryCounts[cat.id] > 0 && (
                  <span className="ml-1.5 shrink-0 rounded-full border border-slate-200/80 bg-white/75 px-1.5 py-0.5 text-xs text-slate-600 dark:border-white/15 dark:bg-white/10 dark:text-slate-300">
                    {categoryCounts[cat.id]}
                  </span>
                )}
              </Link>
            );
          })}
      </nav>

      {/* ── Cloud sync panel ─────────────────────────────────────────── */}
      <div className="mt-auto pt-4">
        <div className="border-t border-white/45 pt-3 dark:border-white/10">
          <button
            type="button"
            onClick={() => setSyncOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-white/55 dark:text-slate-200 dark:hover:bg-white/10"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden>☁</span>
              云同步
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`inline-block h-2 w-2 rounded-full ${syncStatusMeta.dot}`} />
              <span className="text-xs text-slate-500 dark:text-slate-400">{syncStatusMeta.label}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{syncOpen ? '▲' : '▼'}</span>
            </span>
          </button>

          {syncOpen && (
            <div className="mt-2 rounded-lg border border-white/60 bg-white/65 p-3 text-xs dark:border-white/10 dark:bg-white/6">
              {token ? (
                // Configured state
                <div className="flex flex-col gap-2">
                  <p className="text-slate-500 dark:text-slate-400">
                    进度已与 GitHub Gist 同步。切换设备时填入相同 Token 即可拉取。
                  </p>
                  {syncStatus === 'error' && (
                    <p className="rounded bg-red-50 px-2 py-1 text-red-600 dark:bg-red-950/30 dark:text-red-400">
                      {syncError}
                    </p>
                  )}
                  <p className="break-all text-slate-500 dark:text-slate-400">
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
                  <p className="text-slate-500 dark:text-slate-400">
                    填入 GitHub Personal Access Token（仅需勾选 <code className="rounded bg-white/70 px-1 text-slate-700 dark:bg-white/10 dark:text-slate-200">gist</code> 权限），进度将自动跨设备同步。
                  </p>
                  <input
                    type="password"
                    value={tokenDraft}
                    onChange={(e) => setTokenDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveToken()}
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="w-full rounded-md border border-white/65 bg-white/75 px-2 py-1.5 font-mono text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:placeholder:text-slate-500"
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
                    className="rounded-md border border-white/70 bg-white/75 px-3 py-1.5 font-medium text-slate-700 transition-colors hover:bg-white disabled:opacity-50 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
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
