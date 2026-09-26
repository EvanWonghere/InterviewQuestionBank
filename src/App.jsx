import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QuestionsProvider } from '@/context/QuestionsContext';
import Layout from '@/components/layout/Layout';
import DashboardPage from '@/pages/DashboardPage';
import QuizPage from '@/pages/QuizPage';
import MockInterviewPage from '@/pages/MockInterviewPage';
import RandomPracticePage from '@/pages/RandomPracticePage';
import ManageQuestionsPage from '@/pages/ManageQuestionsPage';
import QuestionEditorPage from '@/pages/QuestionEditorPage';
import ReviewPage from '@/pages/ReviewPage';
import MigrationPage from '@/pages/MigrationPage';
import MapPage from '@/pages/MapPage';
import StagePage from '@/pages/StagePage';
import PatrolPage from '@/pages/PatrolPage';
import { AuthProvider } from '@/context/AuthContext';
import { useCloudLearning } from '@/hooks/useCloudLearning';

const ChatMarkdownFixturePage = lazy(() => import('@/pages/ChatMarkdownFixturePage'));

function CloudLearningInit() {
  useCloudLearning();
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <QuestionsProvider>
        <CloudLearningInit />
        <HashRouter>
          <Routes>
            <Route path="mock-interview" element={<MockInterviewPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="random-practice" element={<RandomPracticePage />} />
              <Route path="map" element={<MapPage />} />
              <Route path="stage/:categoryId/:index" element={<StagePage />} />
              <Route path="patrol" element={<PatrolPage />} />
              <Route path="quiz" element={<QuizPage />} />
              <Route path="quiz/:categoryId" element={<QuizPage />} />
              <Route path="list/:status" element={<QuizPage />} />
              <Route path="review/:mode" element={<ReviewPage />} />
              <Route path="manage/questions" element={<ManageQuestionsPage />} />
              <Route path="manage/questions/new" element={<QuestionEditorPage />} />
              <Route path="manage/questions/:id/edit" element={<QuestionEditorPage />} />
              <Route path="dev/chat-markdown" element={<Suspense fallback={<p>正在加载渲染夹具…</p>}><ChatMarkdownFixturePage /></Suspense>} />
            </Route>
          </Routes>
        </HashRouter>
      </QuestionsProvider>
    </AuthProvider>
  );
}
