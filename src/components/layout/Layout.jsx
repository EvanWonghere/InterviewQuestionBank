import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useQuestions } from '@/context/QuestionsContext';

export default function Layout() {
  const { categories, questions } = useQuestions();
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar categories={categories} questions={questions} />
      <main className="min-w-0 flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
