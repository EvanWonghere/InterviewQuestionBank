import { createContext, useContext, useState, useEffect } from 'react';
import { loadQuestions } from '@/data/loadQuestions';

const QuestionsContext = createContext(null);

export function QuestionsProvider({ children }) {
  const [data, setData] = useState({ categories: [], questions: [], loading: true, error: null });

  useEffect(() => {
    loadQuestions()
      .then((payload) => setData({ categories: payload.categories, questions: payload.questions, loading: false, error: null }))
      .catch((err) => setData({ categories: [], questions: [], loading: false, error: err.message }));
  }, []);

  return <QuestionsContext.Provider value={data}>{children}</QuestionsContext.Provider>;
}

export function useQuestions() {
  const ctx = useContext(QuestionsContext);
  if (!ctx) throw new Error('useQuestions must be used within QuestionsProvider');
  return ctx;
}
