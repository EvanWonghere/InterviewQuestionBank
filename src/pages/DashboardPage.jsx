import { useQuestions } from '@/context/QuestionsContext';
import ProgressPanel from '@/components/dashboard/ProgressPanel';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { categories, questions, loading, error } = useQuestions();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-neutral-500 dark:text-neutral-400">加载中…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Unity 刷题进度</h1>
        <Link
          to="/quiz"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          开始刷题
        </Link>
      </div>
      <ProgressPanel categories={categories} questions={questions} />
    </div>
  );
}
