import { useQuestions } from '@/context/QuestionsContext';
import ProgressPanel from '@/components/dashboard/ProgressPanel';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { categories, questions, loading, error } = useQuestions();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500 dark:text-slate-400">加载中…</p>
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
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Unity 刷题进度</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Liquid Glass：更柔和、更有层次的阅读质感</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/random-practice"
            className="rounded-lg border border-white/75 bg-white/75 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
          >
            随机刷题
          </Link>
          <Link
            to="/quiz"
            className="rounded-lg border border-white/75 bg-white/75 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
          >
            开始刷题
          </Link>
        </div>
      </div>
      <ProgressPanel categories={categories} questions={questions} />
    </div>
  );
}
