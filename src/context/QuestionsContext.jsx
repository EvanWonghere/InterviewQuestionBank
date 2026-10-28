import { createContext, useCallback, useContext, useState, useEffect, useRef } from 'react';
import { listQuestions } from '@/data/questionRepository';
import { useAuth } from '@/context/AuthContext';

const QuestionsContext = createContext(null);
const emptyData = { categories: [], questions: [], loading: true, error: null, source: 'static' };

export function QuestionsProvider({ children }) {
  const { configured, loading: authLoading, user, isAdmin } = useAuth();
  const identity = !configured ? 'static' : authLoading ? 'loading' : `auth:${user?.id ?? 'anon'}:${isAdmin ? 'admin' : 'user'}`;
  const active = !configured || !authLoading;
  // Changing identity also clears question copies held inside child pages.
  return <QuestionsScope key={identity} active={active}>{children}</QuestionsScope>;
}

function QuestionsScope({ active, children }) {
  const [data, setData] = useState(emptyData);
  const generation = useRef(0);
  const mounted = useRef(true);

  // Silent refresh keeps the list only within the current identity.
  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!active || !mounted.current) return;
    const ticket = ++generation.current;
    if (!silent) setData((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const payload = await listQuestions();
      if (!mounted.current || ticket !== generation.current) return;
      setData({ categories: payload.categories, questions: payload.questions, loading: false, error: null, source: payload.source });
    } catch (err) {
      if (!mounted.current || ticket !== generation.current) return;
      if (silent) throw err;
      setData({ categories: [], questions: [], loading: false, error: err.message, source: 'error' });
    }
  }, [active]);

  useEffect(() => {
    mounted.current = true;
    if (active) void refresh();
    return () => { mounted.current = false; generation.current += 1; };
  }, [active, refresh]);

  return <QuestionsContext.Provider value={{ ...data, refresh }}>{children}</QuestionsContext.Provider>;
}

export function useQuestions() {
  const ctx = useContext(QuestionsContext);
  if (!ctx) throw new Error('useQuestions must be used within QuestionsProvider');
  return ctx;
}
