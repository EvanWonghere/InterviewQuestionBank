import { useQuestions } from '@/context/QuestionsContext';
import ProgressPanel from '@/components/dashboard/ProgressPanel';
import PracticeHeatmap from '@/components/dashboard/PracticeHeatmap';
import { Link } from 'react-router-dom';
import TodayTiles from '@/components/dashboard/TodayTiles';
import { useGameProgress } from '@/hooks/useGameProgress';

export default function DashboardPage() {
  const { categories, questions, loading, error } = useQuestions();
  const game = useGameProgress(questions, categories);

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

  const hour = new Date().getHours();
  const greeting = hour < 5 ? '夜深了' : hour < 11 ? '早上好' : hour < 13 ? '中午好' : hour < 18 ? '下午好' : '晚上好';
  const today = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());

  return (
    <div className="dash-page">
      <header className="dash-hero">
        <p className="type-eyebrow" style={{ color: 'var(--text-tertiary)', textTransform: 'none' }}>{today}</p>
        <h1 className="type-display-lg" style={{ color: 'var(--text-primary)' }}>
          {greeting}。{game.dueCount ? <>今天有 {game.dueCount} 道题<br />等你巡检。</> : <>今天没有到期题，<br />挑一关继续吧。</>}
        </h1>
        <div className="flex flex-wrap gap-3">
          <Link to={game.dueCount ? '/patrol' : '/map'} className="btn-blue-large">{game.dueCount ? '开始巡检' : '闯关地图'}</Link>
          <Link to="/random-practice" className="btn-neutral">随机刷题</Link>
          <Link to="/mock-interview" className="btn-neutral">模拟面试</Link>
        </div>
      </header>

      <TodayTiles questions={questions} game={game} />

      <PracticeHeatmap />

      <ProgressPanel categories={categories} questions={questions} />
    </div>
  );
}
