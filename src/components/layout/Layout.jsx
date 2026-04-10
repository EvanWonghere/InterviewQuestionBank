import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useQuestions } from '@/context/QuestionsContext';

export default function Layout() {
  const { categories, questions } = useQuestions();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Auto-close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (!drawerOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [drawerOpen]);

  // Escape closes drawer
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <div className="flex min-h-screen flex-col surface-page lg:flex-row">
      {/* Mobile top bar (< lg) */}
      <header className="app-topbar lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="打开菜单"
          className="menu-button"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="topbar-brand">Interview Bank</span>
      </header>

      {/* Backdrop (mobile only) */}
      <div
        className={`drawer-backdrop lg:hidden ${drawerOpen ? 'is-visible' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar — drawer on mobile, sticky column on lg+ */}
      <Sidebar
        categories={categories}
        questions={questions}
        className={`app-sidebar surface-sidebar flex flex-col px-4 py-5 ${drawerOpen ? 'is-open' : ''}`}
        onClose={() => setDrawerOpen(false)}
      />

      <main className="min-w-0 flex-1 px-4 py-6 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
