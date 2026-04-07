import { HashRouter, Routes, Route } from 'react-router-dom';
import { QuestionsProvider } from '@/context/QuestionsContext';
import Layout from '@/components/layout/Layout';
import DashboardPage from '@/pages/DashboardPage';
import QuizPage from '@/pages/QuizPage';
import MockInterviewPage from '@/pages/MockInterviewPage';
import RandomPracticePage from '@/pages/RandomPracticePage';
import { useGistSync } from '@/hooks/useGistSync';

// Mounts cloud sync at the app root; renders nothing
function GistSyncInit() {
  useGistSync();
  return null;
}

export default function App() {
  return (
    <QuestionsProvider>
      <GistSyncInit />
      <HashRouter>
        <Routes>
          <Route path="mock-interview" element={<MockInterviewPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="random-practice" element={<RandomPracticePage />} />
            <Route path="quiz" element={<QuizPage />} />
            <Route path="quiz/:categoryId" element={<QuizPage />} />
            <Route path="list/:status" element={<QuizPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </QuestionsProvider>
  );
}
