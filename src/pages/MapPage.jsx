import { Link } from 'react-router-dom';
import { useQuestions } from '@/context/QuestionsContext';
import { useGameStore } from '@/store/gameStore';
import { useGameProgress } from '@/hooks/useGameProgress';
import { chapterProgress, stageHref, ACHIEVEMENTS, FREEZE_MAX, patrolKey } from '@/lib/gameRules';
import Stars from '@/components/game/Stars';
import PixelPet from '@/components/pet/PixelPet';
import { PET_FORMS } from '@/components/pet/petGrowth';
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
  const {
    reviewStates, attempts, level, today, streak, dueCount, petForm, achievements,
  } = useGameProgress(questions, categories);

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

  const patrolDone = Boolean(records[patrolKey(today)]?.completed);
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
          <PixelPet form={petForm} mood={petForm === 'droop' ? 'sad' : 'happy'} size={64} />
          <div className="min-w-[180px] flex-1">
            <p className="type-body-emphasis" style={{ color: 'var(--text-primary)' }}>
              {level.name}
            </p>
            <p className="type-caption mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {PET_FORMS[petForm].name} · {PET_FORMS[petForm].hint}
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
            {petForm === 'droop' && (
              <p
                className="type-caption mt-1 map-droop-notice"
                style={{ background: 'var(--warning-bg)', color: 'var(--warning-fg)' }}
              >
                有 {dueCount} 道题到期了，小芽蔫了。去巡检吧。
              </p>
            )}
          </div>
          <div className="map-streak min-w-[140px]">
            <p className="game-pixel type-body-emphasis" style={{ color: 'var(--text-primary)' }}>
              {streak.streak > 0 ? `连续 ${streak.streak} 天` : '今天开始第 1 天'}
            </p>
            <div className="map-freeze-row mt-1" aria-label={`补签卡 ${streak.freezes} / ${FREEZE_MAX}`}>
              {Array.from({ length: FREEZE_MAX }).map((_, i) => (
                <span key={i} className={`map-freeze-chip${i < streak.freezes ? ' is-filled' : ''}`} />
              ))}
              <span className="type-caption ml-1" style={{ color: 'var(--text-tertiary)' }}>补签卡</span>
            </div>
            {streak.streak > 0 && !streak.activeToday && (
              <p className="type-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>
                今天还没答题，答一题就能续上
              </p>
            )}
            {streak.frozen > 0 && (
              <p className="type-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>
                本轮用过 {streak.frozen} 张补签卡
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

      <section className="surface-card map-patrol-card mb-10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="type-body-emphasis" style={{ color: 'var(--text-primary)' }}>
            今日巡检
          </h2>
          {patrolDone && <span className="map-patrol-done type-caption">今天已巡检</span>}
        </div>
        {dueCount > 0 ? (
          <>
            <p className="type-body mt-2" style={{ color: 'var(--text-secondary)' }}>
              {dueCount} 道题到期，每次巡检最多 8 题。第 3 颗星主要在这里点亮。
            </p>
            <Link to="/patrol" className="btn-blue mt-3 inline-block">开始巡检</Link>
          </>
        ) : (
          <p className="type-body mt-2" style={{ color: 'var(--text-secondary)' }}>
            今天没有到期题
          </p>
        )}
      </section>

      <div className="map-region-grid">
        {regions.map(({ category, worldIndex, progress }) => (
          <RegionCard key={category.id} category={category} worldIndex={worldIndex} progress={progress} />
        ))}
      </div>

      <section className="mt-10">
        <h2 className="type-body-emphasis mb-4" style={{ color: 'var(--text-primary)' }}>
          成就 · 已解锁 {achievements.length} / {ACHIEVEMENTS.length}
        </h2>
        <div className="map-achievement-grid">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = achievements.includes(a.id);
            return (
              <div
                key={a.id}
                className={`map-achievement-card${unlocked ? ' is-unlocked' : ' is-locked'}`}
                aria-label={`${a.name}，${unlocked ? '已解锁' : '未解锁'}`}
              >
                <span className="map-achievement-badge game-pixel">{a.badge}</span>
                <p className="type-body-emphasis mt-2" style={{ color: unlocked ? 'var(--game-star)' : 'var(--text-tertiary)' }}>
                  {a.name}
                </p>
                <p className="type-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  {a.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
