import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PixelPet from '@/components/pet/PixelPet';
import Stars, { Star } from '@/components/game/Stars';
import { burst, burstFrom, effectsEnabled } from '@/components/game/effects';
import { levelFor } from '@/lib/gameRules';

const STAR_DELAY_MS = 380;

/** Clear / fail screen: stars drop in one by one, XP counts up, the level bar fills and a promotion celebrates. */
export default function StageResult({ label, categoryName, cleared, flawless, results, total, maxCombo, gained, startXp, nextHref, onReplay }) {
  const stageStars = cleared ? (flawless ? 2 : 1) : 0;
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
    starRefs.current.slice(0, stageStars).forEach((el, i) => {
      timers.push(window.setTimeout(() => burstFrom(el, { kind: 'spark', count: 24 }), 200 + i * STAR_DELAY_MS));
    });
    if (cleared) timers.push(window.setTimeout(() => burstFrom(titleRef.current, { kind: 'confetti' }), 150));
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
  }, [animate, cleared, promoted, stageStars, gained, after.progress]);

  const twoStar = results.filter((r) => r.stars === 2).length;
  const note = !cleared
    ? `已答的 ${results.length} 题都记进了复习计划，经验照拿。换个状态再来。`
    : flawless
      ? '第 3 颗星会在本关每题都复习通过一次后亮起（最早明天）。'
      : '掉过心，本关 1 星。无伤通关可拿 2 星。';

  return (
    <section className="stage-result surface-card-elevated" aria-labelledby="stage-result-title">
      <p className="type-caption" style={{ color: 'var(--text-tertiary)' }}>STAGE {label} · {categoryName}</p>
      <h1 id="stage-result-title" ref={titleRef} className={`stage-result-title game-pixel${cleared ? '' : ' is-failed'}`}>
        {(cleared ? 'STAGE CLEAR' : 'STAGE FAILED').split('').map((ch, i) => (
          <span key={i} style={{ animationDelay: `${i * 35}ms` }}>{ch === ' ' ? ' ' : ch}</span>
        ))}
      </h1>
      <div className="stage-result-stars" role="img" aria-label={`本关 ${stageStars} 颗星`}>
        {[0, 1, 2].map((i) => (
          <span key={i} ref={(el) => { starRefs.current[i] = el; }} className={`stage-result-star is-${i}`} style={{ animationDelay: `${200 + i * STAR_DELAY_MS}ms` }}>
            <Star size={i === 1 ? 64 : 52} state={i < stageStars ? 'on' : i === 2 && cleared ? 'pending' : 'off'} />
          </span>
        ))}
      </div>
      <p className="type-caption stage-result-note">{note}</p>

      <div className="stage-tally">
        <div><b className="game-pixel">+{shownXp}</b><span>经验</span></div>
        <div><b className="game-pixel">{maxCombo}</b><span>最高连击</span></div>
        <div><b className="game-pixel">{twoStar}/{total}</b><span>两星题</span></div>
      </div>

      <div className="stage-level">
        <div className="stage-level-row">
          <span className="stage-level-pet"><PixelPet mood={cleared ? 'happy' : 'sad'} size={44} /></span>
          <span className="type-body-emphasis">{after.name}</span>
          <span className="type-caption" style={{ color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
            {after.next ? `${after.xp} / ${after.next.xp} XP` : `${after.xp} XP · 已满级`}
          </span>
        </div>
        <div className="progress-track"><div className="progress-fill stage-level-fill" style={{ width: `${Math.round(bar * 100)}%` }} /></div>
        {promoted && <p className="stage-promoted game-pixel" role="status">PROMOTED · {before.name} → {after.name}</p>}
      </div>

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
