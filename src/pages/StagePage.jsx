import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuestions } from '@/context/QuestionsContext';
import { useGameStore } from '@/store/gameStore';
import { useGameProgress } from '@/hooks/useGameProgress';
import StageRun from '@/components/game/StageRun';
import { setEffectsQuiet } from '@/components/game/effects';
import { chapterProgress, findCategory, stageHref } from '@/lib/gameRules';
import '@/components/game/game.css';
import '@/components/game/stage.css';

export default function StagePage() {
  const { categoryId: categoryParam, index } = useParams();
  const stageIndex = Number(index);
  const { questions, categories, loading, error } = useQuestions();
  const records = useGameStore((s) => s.records);
  const quiet = useGameStore((s) => s.quiet);
  const progress = useGameProgress(questions, categories);
  const { reviewStates, attempts } = progress;

  useEffect(() => { setEffectsQuiet(quiet); }, [quiet]);

  const category = findCategory(categories, categoryParam);
  const categoryId = category?.id ?? categoryParam;
  const chapter = chapterProgress(questions, categoryId, { records, reviewStates, attempts });
  const stage = chapter.stages.find((s) => s.index === stageIndex) ?? null;
  const world = [...categories].sort((a, b) => a.order - b.order).findIndex((c) => c.id === categoryId) + 1;

  // Run key restarts the run (replay, or next stage via the route) without leaking state.
  const [runKey, setRunKey] = useState(0);

  if (loading) return <p className="type-body py-24 text-center" style={{ color: 'var(--text-tertiary)' }}>加载中…</p>;
  if (error) return <p className="rounded-2xl p-5 type-body" style={{ background: 'var(--error-bg)', color: 'var(--error-fg)' }}>{error}</p>;
  if (!stage || !stage.unlocked) {
    return (
      <div className="surface-card-elevated p-8 text-center">
        <p className="type-body mb-4" style={{ color: 'var(--text-secondary)' }}>
          {stage ? '这一关还没解锁：先通关前一关。' : '没有找到这一关。'}
        </p>
        <Link to="/map" className="btn-blue">返回闯关地图</Link>
      </div>
    );
  }

  return (
    <StageRun
      key={`${stage.key}#${runKey}`}
      recordKey={stage.key}
      questions={stage.questions}
      label={`${world}-${stage.index}`}
      title={category?.name ?? ''}
      nextHref={category && chapter.stages.some((s) => s.index === stageIndex + 1) ? stageHref(category, stageIndex + 1) : null}
      progress={progress}
      onReplay={() => setRunKey((k) => k + 1)}
    />
  );
}
