import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { listQuestions } from '@/data/questionRepository';

const QuestionsContext = createContext(null);

export function QuestionsProvider({ children }) {
  const [data, setData] = useState({ categories: [], questions: [], loading: true, error: null, source: 'static' });

  const refresh = useCallback(async () => {
    setData((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const payload = await listQuestions();
      setData({ categories: payload.categories, questions: payload.questions, loading: false, error: null, source: payload.source });
    } catch (err) {
      setData({ categories: [], questions: [], loading: false, error: err.message, source: 'error' });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <QuestionsContext.Provider value={{ ...data, refresh }}>{children}</QuestionsContext.Provider>;
}

export function useQuestions() {
  const ctx = useContext(QuestionsContext);
  if (!ctx) throw new Error('useQuestions must be used within QuestionsProvider');
  return ctx;
}
