import { Link } from 'react-router-dom';
import { useQuestions } from '@/context/QuestionsContext';
import { useGameStore } from '@/store/gameStore';
import { useGameProgress } from '@/hooks/useGameProgress';
import { chapterProgress, stageHref } from '@/lib/gameRules';
import Stars from '@/components/game/Stars';
import PixelPet from '@/components/pet/PixelPet';
import '@/components/game/game.css';
import '@/components/game/map.css';

/** One stage node in a region's path: cleared / current / unlocked / locked. */
function StageNode({ stage, worldIndex, category, isCurrent }) {
  const label = `${worldIndex}-${stage.index}`;
  const ariaLabel = `${category.name} 第 ${stage.index} 关${stage.cleared ? `，${stage.stars} 颗星` : ''}`;
  const stateClass = stage.cleared ? 'is-cleared' : isCurrent ? 'is-current' : stage.unlocked ? 'is-unlocked' : 'is-locked';

  const content = (
    <>
      <span className="map-node-circle game-pixel">{label}</span>
      {stage.cleared && (
        <Stars count={stage.stars} size={9} pendingThird={stage.stars === 2} className="map-node-stars" />
      )}
    </>
  );

  if (!stage.unlocked) {
    return (
      <span className={`map-node ${stateClass}`} aria-disabled="true" aria-label={`${ariaLabel}（未解锁）`}>
        {content}
      </span>
    );
  }

  return (
    <Link to={stageHref(category, stage.index)} className={`map-node ${stateClass}`} aria-label={ariaLabel}>
      {content}
    </Link>
  );
}

/** One category's world card: title, stats, stage path and boss node. */
function RegionCard({ category, worldIndex, progress }) {
  const { stages, currentIndex, stars, maxStars, bossReady } = progress;
  const totalQuestions = stages.reduce((sum, s) => sum + s.questions.length, 0);
  const status = stages.every((s) => s.cleared) ? '全部通关' : stages.some((s) => s.cleared) ? '进行中' : '未开始';

  return (
    <section className="surface-card map-region-card p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <p className="type-eyebrow game-pixel" style={{ color: 'var(--game-mint-deep)' }}>
            WORLD {worldIndex}
          </p>
          <h3 className="type-body-emphasis mt-1" style={{ color: 'var(--text-primary)' }}>
            {category.name}
          </h3>
        </div>
        <p className="type-caption shrink-0" style={{ color: 'var(--text-tertiary)' }}>
          {totalQuestions} 题 · {stages.length} 关
        </p>
      </div>

      <div className="map-path">
        {stages.map((stage) => (
          <StageNode
            key={stage.key}
            stage={stage}
            worldIndex={worldIndex}
            category={category}
            isCurrent={stage.index === currentIndex}
          />
        ))}
        <span
          className={`map-node map-node-boss ${bossReady ? 'is-boss-ready' : ''}`}
          aria-disabled="true"
          title="章末 Boss：后续版本开放（需本章每关 ≥ 2 星）"
          aria-label="章末 Boss：后续版本开放（需本章每关 ≥ 2 星）"
        >
          BOSS
        </span>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <p className="type-caption" style={{ color: 'var(--text-tertiary)' }}>
          已得 {stars} / {maxStars} 星
        </p>
        <p className="type-caption" style={{ color: 'var(--text-tertiary)' }}>
          {status}
        </p>
      </div>
    </section>
  );
}

export default function MapPage() {
  const { categories, questions, loading, error } = useQuestions();
  const records = useGameStore((s) => s.records);
  const quiet = useGameStore((s) => s.quiet);
  const setQuiet = useGameStore((s) => s.setQuiet);
  const { reviewStates, attempts, level } = useGameProgress(questions ?? []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="type-body" style={{ color: 'var(--text-tertiary)' }}>加载中…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl p-5 type-body" style={{ background: 'var(--error-bg)', color: 'var(--error-fg)' }}>
        {error}
      </div>
    );
  }

  const sortedCategories = [...(categories || [])].sort((a, b) => a.order - b.order);
  const regions = sortedCategories
    .map((cat, i) => ({ category: cat, worldIndex: i + 1, progress: chapterProgress(questions ?? [], cat.id, { records, reviewStates, attempts }) }))
    .filter((r) => r.progress.stages.length > 0);

  return (
    <div className={quiet ? 'is-quiet' : ''}>
      <section className="mb-10">
        <p className="type-eyebrow mb-4" style={{ color: 'var(--apple-blue)' }}>
          闯关地图
        </p>
        <h1 className="type-display-lg mb-3" style={{ color: 'var(--text-primary)' }}>
          一关一关地闯，把题目变成地图。
        </h1>
        <p className="type-body-lg max-w-xl" style={{ color: 'var(--text-tertiary)' }}>
          每关 4–6 题，3 颗心；第 3 颗星要在之后的复习里点亮。
        </p>
      </section>

      <section className="surface-card-elevated map-level-card mb-10 p-6">
        <div className="flex flex-wrap items-center gap-5">
          <PixelPet mood="happy" size={64} />
          <div className="min-w-[180px] flex-1">
            <p className="type-body-emphasis" style={{ color: 'var(--text-primary)' }}>
              {level.name}
            </p>
            <p className="type-caption mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {level.next ? `${level.xp} / ${level.next.xp} XP` : '已满级'}
            </p>
            <div className="mt-2">
              <div className="progress-track">
                <div
                  className={`progress-fill${!level.next ? ' is-complete' : ''}`}
                  style={{ width: `${Math.round(level.progress * 100)}%` }}
                />
              </div>
            </div>
            {level.next && (
              <p className="type-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>
                下一级：{level.next.name}
              </p>
            )}
          </div>
          <label className="map-quiet-toggle">
            <input type="checkbox" checked={quiet} onChange={(e) => setQuiet(e.target.checked)} />
            <span>安静模式</span>
          </label>
        </div>
        <p className="type-caption mt-3" style={{ color: 'var(--text-tertiary)' }}>
          关闭动效和粒子，只保留星星
        </p>
      </section>

      <div className="map-region-grid">
        {regions.map(({ category, worldIndex, progress }) => (
          <RegionCard key={category.id} category={category} worldIndex={worldIndex} progress={progress} />
        ))}
      </div>
    </div>
  );
}
