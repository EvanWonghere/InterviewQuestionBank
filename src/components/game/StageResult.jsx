import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PixelPet from '@/components/pet/PixelPet';
import Stars, { Star } from '@/components/game/Stars';
import { burst, burstFrom, effectsEnabled } from '@/components/game/effects';
import { useGameStore } from '@/store/gameStore';
import { ACHIEVEMENTS, levelFor } from '@/lib/gameRules';

const STAR_DELAY_MS = 380;

/**
 * Clear / fail screen: stars drop in one by one, XP counts up, the level bar fills and a promotion celebrates.
 * A patrol shows how many third stars it lit instead of stage stars. Achievements unlocked since the
 * last announcement are shown once, then marked seen.
 */
export default function StageResult({ mode = 'stage', badge, title, cleared, flawless, results, total, maxCombo, gained, startXp, nextHref, progress, onReplay }) {
  const patrol = mode === 'patrol';
  const stageStars = patrol ? 0 : cleared ? (flawless ? 2 : 1) : 0;
  const lit = results.filter((r) => r.lit).length;
  const seen = useGameStore((s) => s.seenAchievements);
  const markSeen = useGameStore((s) => s.markAchievementsSeen);
  const [fresh] = useState(() => ACHIEVEMENTS.filter((a) => progress.achievements.includes(a.id) && !seen.includes(a.id)));
  useEffect(() => { markSeen(progress.achievements); }, [progress.achievements, markSeen]);
  const before = levelFor(startXp);
  const after = levelFor(startXp + gained);
  const promoted = after.index > before.index;
  const animate = effectsEnabled();
  const [shownXp, setShownXp] = useState(animate ? 0 : gained);
  const [barFrom] = useState(promoted ? 0 : before.progress);
  const [bar, setBar] = useState(animate ? barFrom : after.progress);
  const starRefs = useRef([]);
  const titleRef = useRef(null);

  useEffect(() => {
    if (!animate) return undefined;
    const timers = [];
    starRefs.current.slice(0, patrol ? Math.min(lit, 1) : stageStars).forEach((el, i) => {
      timers.push(window.setTimeout(() => burstFrom(el, { kind: 'spark', count: 24 }), 200 + i * STAR_DELAY_MS));
    });
    if (cleared) timers.push(window.setTimeout(() => burstFrom(titleRef.current, { kind: 'confetti' }), 150));
    if (fresh.length) timers.push(window.setTimeout(() => burst(window.innerWidth / 2, window.innerHeight * 0.85, { kind: 'confetti', count: 70 }), 2300));
    if (promoted) timers.push(window.setTimeout(() => burst(window.innerWidth / 2, window.innerHeight * 0.7, { kind: 'confetti', count: 140 }), 1500));

    const start = performance.now() + 500;
    let frame = 0;
    const step = (now) => {
      const p = Math.max(0, Math.min(1, (now - start) / 900));
      const eased = 1 - (1 - p) ** 3;
      setShownXp(Math.round(gained * eased));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    timers.push(window.setTimeout(() => setBar(after.progress), 600));
    return () => { timers.forEach(window.clearTimeout); cancelAnimationFrame(frame); };
  }, [animate, cleared, promoted, stageStars, gained, after.progress, fresh.length, lit, patrol]);

  const twoStar = results.filter((r) => r.stars === 2).length;
  const note = patrol
    ? (lit ? `点亮了 ${lit} 颗第 3 颗星。没过的题间隔已经缩短，很快会再见。` : '今天的巡检完成了。答对的题下次复习再过一次就点亮第 3 颗星。')
    : !cleared
    ? `已答的 ${results.length} 题都记进了复习计划，经验照拿。换个状态再来。`
    : flawless
      ? '第 3 颗星会在本关每题都复习通过一次后亮起（最早明天）。'
      : '掉过心，本关 1 星。无伤通关可拿 2 星。';

  return (
    <section className="stage-result surface-card-elevated" aria-labelledby="stage-result-title">
      <p className="type-caption" style={{ color: 'var(--text-tertiary)' }}>{patrol ? '每日巡检' : badge} · {title}</p>
      <h1 id="stage-result-title" ref={titleRef} className={`stage-result-title game-pixel${cleared ? '' : ' is-failed'}`}>
        {(patrol ? 'PATROL DONE' : cleared ? 'STAGE CLEAR' : 'STAGE FAILED').split('').map((ch, i) => (
          <span key={i} style={{ animationDelay: `${i * 35}ms` }}>{ch === ' ' ? ' ' : ch}</span>
        ))}
      </h1>
      {patrol ? (
        <div className="stage-result-stars" role="img" aria-label={`点亮 ${lit} 颗第 3 颗星`}>
          <span ref={(el) => { starRefs.current[0] = el; }} className="stage-result-star is-1" style={{ animationDelay: '200ms' }}>
            <Star size={64} state={lit ? 'on' : 'pending'} />
          </span>
          <span className="stage-result-lit game-pixel">×{lit}</span>
        </div>
      ) : (
        <div className="stage-result-stars" role="img" aria-label={`本关 ${stageStars} 颗星`}>
          {[0, 1, 2].map((i) => (
            <span key={i} ref={(el) => { starRefs.current[i] = el; }} className={`stage-result-star is-${i}`} style={{ animationDelay: `${200 + i * STAR_DELAY_MS}ms` }}>
              <Star size={i === 1 ? 64 : 52} state={i < stageStars ? 'on' : i === 2 && cleared ? 'pending' : 'off'} />
            </span>
          ))}
        </div>
      )}
      <p className="type-caption stage-result-note">{note}</p>

      <div className="stage-tally">
        <div><b className="game-pixel">+{shownXp}</b><span>经验</span></div>
        <div><b className="game-pixel">{maxCombo}</b><span>最高连击</span></div>
        <div><b className="game-pixel">{twoStar}/{total}</b><span>两星题</span></div>
      </div>

      <div className="stage-level">
        <div className="stage-level-row">
          <span className="stage-level-pet"><PixelPet form={progress.petForm} mood={cleared ? 'happy' : 'sad'} size={44} /></span>
          <span className="type-body-emphasis">{after.name}</span>
          <span className="type-caption" style={{ color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
            {after.next ? `${after.xp} / ${after.next.xp} XP` : `${after.xp} XP · 已满级`}
          </span>
        </div>
        <div className="progress-track"><div className="progress-fill stage-level-fill" style={{ width: `${Math.round(bar * 100)}%` }} /></div>
        {promoted && <p className="stage-promoted game-pixel" role="status">PROMOTED · {before.name} → {after.name}</p>}
        <p className="type-caption" style={{ color: 'var(--text-tertiary)' }}>
          连续答题 <b className="game-pixel" style={{ color: 'var(--game-combo)' }}>{progress.streak.streak}</b> 天
          {progress.streak.freezes > 0 && ` · 补签卡 ×${progress.streak.freezes}`}
        </p>
      </div>

      {fresh.length > 0 && (
        <ul className="stage-achievements" aria-label="新成就">
          {fresh.map((a, i) => (
            <li key={a.id} style={{ animationDelay: `${2300 + i * 150}ms` }}>
              <span className="stage-achievement-badge game-pixel">{a.badge}</span>
              <span><b>新成就：{a.name}</b><small>{a.description}</small></span>
            </li>
          ))}
        </ul>
      )}

      <ul className="stage-result-list">
        {results.map((r) => (
          <li key={r.questionId}>
            <span className="truncate">{r.title}</span>
            <Stars count={r.lit ? 3 : r.stars} size={14} pendingThird={r.stars === 2} />
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap justify-center gap-3">
        {nextHref && <Link to={nextHref} className="btn-blue">下一关</Link>}
        <button type="button" className={nextHref ? 'btn-neutral' : 'btn-blue'} onClick={onReplay}>再来一次</button>
        <Link to="/map" className="btn-neutral">返回地图</Link>
      </div>
    </section>
  );
}
