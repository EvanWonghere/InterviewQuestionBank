import { useQuestions } from '@/context/QuestionsContext';
import ProgressPanel from '@/components/dashboard/ProgressPanel';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { categories, questions, loading, error } = useQuestions();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="type-body" style={{ color: 'var(--text-tertiary)' }}>加载中…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div
        className="rounded-2xl p-5 type-body"
        style={{ background: 'var(--error-bg)', color: 'var(--error-fg)' }}
      >
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="mb-12">
        <p
          className="type-eyebrow mb-4"
          style={{ color: 'var(--apple-blue)' }}
        >
          Interview Question Bank
        </p>
        <h1 className="type-display-lg mb-3" style={{ color: 'var(--text-primary)' }}>
          专注每一题，<br />积累每一寸进步。
        </h1>
        <p
          className="type-body-lg max-w-xl"
          style={{ color: 'var(--text-tertiary)' }}
        >
          按分类系统化刷题，标记错题与待复习，模拟面试与随机抽题让节奏更接近真实场景。
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/quiz" className="btn-blue-large">
            开始刷题
          </Link>
          <Link to="/random-practice" className="btn-blue-outline">
            随机刷题
          </Link>
          <Link to="/mock-interview" className="btn-blue-outline">
            模拟面试
          </Link>
        </div>
      </section>

      <ProgressPanel categories={categories} questions={questions} />
    </div>
  );
}
