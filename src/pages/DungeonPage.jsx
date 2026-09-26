import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuestions } from '@/context/QuestionsContext';
import { useAuth } from '@/context/AuthContext';
import { useGameStore } from '@/store/gameStore';
import { useGameProgress } from '@/hooks/useGameProgress';
import StageRun from '@/components/game/StageRun';
import { setEffectsQuiet } from '@/components/game/effects';
import { pickDungeon } from '@/lib/weakDungeon';
import { listEvaluations } from '@/data/aiRepository';
import { aggregateWeaknesses } from '../../supabase/functions/ai-tutor/evaluation.js';
import '@/components/game/game.css';
import '@/components/game/stage.css';

/** Weak-point dungeon: a run assembled from the tag with the most lapses (plus, for
 * administrators, AI-evaluation weaknesses). See docs/GAMIFICATION.md. */
export default function DungeonPage() {
  const { questions, categories, loading, error } = useQuestions();
  const { isAdmin } = useAuth();
  const quiet = useGameStore((s) => s.quiet);
  const progress = useGameProgress(questions, categories);
  const [evaluationWeaknesses, setEvaluationWeaknesses] = useState(isAdmin ? null : []);
  // The dungeon's question list is snapshotted once per run, mirroring PatrolPage: answering
  // moves questions out of the weak set, and recomputing mid-run would swap the run for the
  // empty-state screen. An empty pick is not snapshotted, so a later evaluation fetch can still start one.
  const [run, setRun] = useState({ key: 0, pick: null });

  useEffect(() => { setEffectsQuiet(quiet); }, [quiet]);

  useEffect(() => {
    if (!isAdmin) { setEvaluationWeaknesses([]); return; }
    let alive = true;
    listEvaluations({ limit: 200 })
      .then((rows) => {
        if (!alive) return;
        const groups = aggregateWeaknesses(rows ?? []).map((g) => ({ tag: g.tag, count: g.count }));
        setEvaluationWeaknesses(groups);
      })
      .catch(() => { if (alive) setEvaluationWeaknesses([]); });
    return () => { alive = false; };
  }, [isAdmin]);

  if (loading) return <p className="type-body py-24 text-center" style={{ color: 'var(--text-tertiary)' }}>加载中…</p>;
  if (error) return <p className="rounded-2xl p-5 type-body" style={{ background: 'var(--error-bg)', color: 'var(--error-fg)' }}>{error}</p>;
  if (evaluationWeaknesses === null) return <p className="type-body py-24 text-center" style={{ color: 'var(--text-tertiary)' }}>加载中…</p>;

  if (run.pick === null) {
    const pick = pickDungeon(questions, { reviewStates: progress.reviewStates, attempts: progress.attempts, evaluationWeaknesses });
    if (pick) {
      setRun({ ...run, pick });
      return null;
    }
  }

  if (!run.pick) {
    return (
      <div className="surface-card-elevated p-8 text-center">
        <p className="type-body mb-4" style={{ color: 'var(--text-secondary)' }}>还没有明显的薄弱点。答错过的题会在这里集结成副本。</p>
        <Link to="/map" className="btn-blue">返回闯关地图</Link>
      </div>
    );
  }

  const { tag, questions: dungeonQuestions } = run.pick;

  return (
    <StageRun
      key={run.key}
      mode="stage"
      recordKey="dungeon:1"
      badge="DUNGEON"
      label=""
      title={`弱点副本 · ${tag}`}
      questions={dungeonQuestions}
      nextHref={null}
      progress={progress}
      onReplay={() => setRun((r) => ({ key: r.key + 1, pick: null }))}
    />
  );
}
