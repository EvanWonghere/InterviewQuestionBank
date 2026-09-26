import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuestions } from '@/context/QuestionsContext';
import { useGameStore } from '@/store/gameStore';
import { useGameProgress } from '@/hooks/useGameProgress';
import StageRun from '@/components/game/StageRun';
import { setEffectsQuiet } from '@/components/game/effects';
import { PATROL_SIZE, dueQuestions, patrolKey } from '@/lib/gameRules';
import '@/components/game/game.css';
import '@/components/game/stage.css';

/** Daily patrol: a heartless run over the questions SM-2 says are due, earliest first. */
export default function PatrolPage() {
  const { questions, categories, loading, error } = useQuestions();
  const quiet = useGameStore((s) => s.quiet);
  const progress = useGameProgress(questions, categories);
  // The due list is snapshotted once per run: answering moves questions out of today's due list,
  // and recomputing it mid-run would swap the run for the "nothing due" screen.
  const [run, setRun] = useState({ key: 0, ids: null });

  useEffect(() => { setEffectsQuiet(quiet); }, [quiet]);

  if (loading) return <p className="type-body py-24 text-center" style={{ color: 'var(--text-tertiary)' }}>加载中…</p>;
  if (error) return <p className="rounded-2xl p-5 type-body" style={{ background: 'var(--error-bg)', color: 'var(--error-fg)' }}>{error}</p>;

  // An empty list is not snapshotted, so cloud review states that arrive later still start a patrol.
  if (run.ids === null) {
    const ids = dueQuestions(questions, progress.reviewStates, Date.now(), PATROL_SIZE).map((q) => q.id);
    if (ids.length) {
      setRun({ ...run, ids });
      return null;
    }
  }
  const byId = new Map(questions.map((q) => [q.id, q]));
  const due = (run.ids ?? []).map((id) => byId.get(id)).filter(Boolean);
  if (!due.length) {
    return (
      <div className="surface-card-elevated p-8 text-center">
        <p className="type-body mb-4" style={{ color: 'var(--text-secondary)' }}>今天没有到期题，小芽也休息一下。</p>
        <Link to="/map" className="btn-blue">返回闯关地图</Link>
      </div>
    );
  }

  return (
    <StageRun
      key={run.key}
      mode="patrol"
      recordKey={patrolKey(progress.today)}
      questions={due}
      label="PATROL"
      title="今日巡检"
      nextHref={null}
      progress={progress}
      onReplay={() => setRun((r) => ({ key: r.key + 1, ids: null }))}
    />
  );
}
