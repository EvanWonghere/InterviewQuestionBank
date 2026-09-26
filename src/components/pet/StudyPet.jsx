import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import PixelPet from './PixelPet';
import { TIP_PAGES, pickTip } from './petTips';
import { usePetStore } from '@/store/petStore';
import { useGameStore } from '@/store/gameStore';
import { useQuestions } from '@/context/QuestionsContext';
import { useGameProgress } from '@/hooks/useGameProgress';
import { bossFor } from '@/components/game/bosses';
import { ACHIEVEMENTS, activeDays, bossHref, bossKey, chapterProgress, patrolKey } from '@/lib/gameRules';
import { dayKey } from '@/lib/practiceCalendar';

const SLEEP_AFTER_MS = 90_000;
const TIP_DELAY_MS = 1200;
const DRAG_THRESHOLD = 6;
const GREETED_KEY = 'iqb:pet-greeted';
const TUTOR_BUBBLES = {
  thinking: '我想想……',
  talking: '正在写……',
  happy: '写好啦',
  sad: '出了点问题，点开看看',
};

function alreadyGreeted() {
  try { return sessionStorage.getItem(GREETED_KEY) === '1'; } catch { return true; }
}
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * 小芽: the floating guide on every page with the sidebar. It can be dragged anywhere and, with
 * snapping on (default), settles on the nearer side;
 * it opens a menu with today's tasks, gives one reminder a day per kind on the overview and the map,
 * reacts to game events, and opens the tutor for administrators on question pages.
 */
export default function StudyPet() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { questions, categories } = useQuestions();
  const game = useGameProgress(questions, categories);
  const records = useGameStore((s) => s.records);
  const seenAchievements = useGameStore((s) => s.seenAchievements);
  const markSeen = useGameStore((s) => s.markAchievementsSeen);
  const quiet = useGameStore((s) => s.quiet);
  const {
    hidden, side, height, across, snap, tipsEnabled, mood, panelOpen, opener, tutorBlocked, speech,
    setHidden, setPosition, setSnap, setTipsEnabled, speak, clearSpeech,
  } = usePetStore();
  const [asleep, setAsleep] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drag, setDrag] = useState(null); // { x, y } while dragging
  const [greeting, setGreeting] = useState(() => !alreadyGreeted());
  const pointer = useRef(null);
  const rootRef = useRef(null);
  const visible = !hidden && !panelOpen;
  const compact = pathname.startsWith('/boss/');
  const today = game.today;

  // Chapters whose boss is ready but never fought, for the menu and the reminder.
  const bossWaiting = useMemo(() => {
    for (const category of [...categories].sort((a, b) => a.order - b.order)) {
      const chapter = chapterProgress(questions, category.id, { records, reviewStates: game.reviewStates, attempts: game.attempts });
      if (chapter.bossReady && !records[bossKey(category.id)]) return { name: bossFor(category).name, href: bossHref(category) };
    }
    return null;
  }, [categories, questions, records, game.reviewStates, game.attempts]);

  // Speech expires on its own.
  useEffect(() => {
    if (!speech) return undefined;
    const timer = window.setTimeout(clearSpeech, Math.max(0, speech.until - Date.now()));
    return () => window.clearTimeout(timer);
  }, [speech, clearSpeech]);

  // One reminder per visit to the overview or the map, and each kind at most once a day.
  useEffect(() => {
    if (!visible || compact || !tipsEnabled || !TIP_PAGES.includes(pathname)) return undefined;
    const timer = window.setTimeout(() => {
      if (usePetStore.getState().speech) return;
      const yesterday = dayKey(Date.now() - 86_400_000);
      const newAchievements = ACHIEVEMENTS.filter((a) => game.achievements.includes(a.id) && !seenAchievements.includes(a.id));
      const tip = pickTip({
        today,
        hour: new Date().getHours(),
        shown: usePetStore.getState().tipsShown,
        newAchievements,
        streak: game.streak,
        yesterdayActive: activeDays(game.attempts).includes(yesterday),
        dueCount: game.dueCount,
        patrolDone: Boolean(records[patrolKey(today)]?.completed),
        bossWaiting,
      });
      if (!tip) return;
      speak({ ...tip, tipId: tip.id, day: today });
      if (tip.id === 'achievement') markSeen(game.achievements);
    }, TIP_DELAY_MS);
    return () => window.clearTimeout(timer);
    // Re-evaluated when the page changes; later data changes on the same page do not re-trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, visible, compact, tipsEnabled]);

  useEffect(() => {
    if (!visible || mood !== 'idle' || asleep || speech || menuOpen) return undefined;
    const timer = window.setTimeout(() => setAsleep(true), SLEEP_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [visible, mood, asleep, speech, menuOpen]);

  useEffect(() => {
    if (!visible || !greeting) return undefined;
    try { sessionStorage.setItem(GREETED_KEY, '1'); } catch { /* private mode */ }
    const timer = window.setTimeout(() => setGreeting(false), 5000);
    return () => window.clearTimeout(timer);
  }, [visible, greeting]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (event) => { if (!rootRef.current?.contains(event.target)) setMenuOpen(false); };
    const onKey = (event) => { if (event.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  if (!visible) return null;

  const wake = () => { setAsleep(false); setGreeting(false); };
  const tutorMood = mood !== 'idle' ? mood : null;
  const live = speech && speech.until > Date.now() ? speech : null;
  const shownMood = live?.mood ?? tutorMood ?? (asleep ? 'sleep' : 'idle');
  const bubble = live?.text
    ?? (tutorMood ? TUTOR_BUBBLES[tutorMood] : null)
    ?? (compact ? null
      : asleep ? 'Zzz… 点我叫醒'
        : greeting ? (opener ? '我是小芽，有不懂的随时点我' : '我是小芽，点我看今天的任务')
          : null);
  const motion = live?.motion && !quiet && !reducedMotion() ? live.motion : null;

  // Dragging: a press that moves less than DRAG_THRESHOLD is a click.
  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointer.current = { id: event.pointerId, sx: event.clientX, sy: event.clientY, ox: rect.left, oy: rect.top, w: rect.width, h: rect.height, moved: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event) => {
    const p = pointer.current;
    if (!p || p.id !== event.pointerId) return;
    const dx = event.clientX - p.sx;
    const dy = event.clientY - p.sy;
    if (!p.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!p.moved) { p.moved = true; setMenuOpen(false); wake(); }
    setDrag({
      x: Math.max(0, Math.min(window.innerWidth - p.w, p.ox + dx)),
      y: Math.max(0, Math.min(window.innerHeight - p.h, p.oy + dy)),
    });
  };
  const onPointerUp = (event) => {
    const p = pointer.current;
    if (!p || p.id !== event.pointerId) return;
    pointer.current = null;
    if (!p.moved) { wake(); setMenuOpen((open) => !open); return; }
    const x = Math.max(0, Math.min(window.innerWidth - p.w, p.ox + event.clientX - p.sx));
    const y = Math.max(0, Math.min(window.innerHeight - p.h, p.oy + event.clientY - p.sy));
    const edge = window.innerWidth < 900 ? 8 : 20;
    const freeY = Math.max(1, window.innerHeight - p.h - 2 * edge);
    const freeX = Math.max(1, window.innerWidth - p.w - 2 * edge);
    // Snapping keeps the height and picks the nearer side; otherwise it stays where it was dropped.
    const nearer = x + p.w / 2 < window.innerWidth / 2 ? 'left' : 'right';
    const rise = (window.innerHeight - (y + p.h) - edge) / freeY;
    if (snap) setPosition(nearer, rise);
    else setPosition(nearer, rise, (x - edge) / freeX);
    setDrag(null);
  };
  const onKeyDown = (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      setSnap(true);
      setPosition(event.key === 'ArrowLeft' ? 'left' : 'right', height);
    }
  };

  const go = (to) => { setMenuOpen(false); navigate(to); };
  const style = drag
    ? { left: drag.x, top: drag.y, right: 'auto', bottom: 'auto' }
    : snap
      ? { [side]: `calc(var(--pet-edge) + env(safe-area-inset-${side}, 0px))`, '--pet-rise': height }
      : { left: 'calc(var(--pet-edge) + var(--pet-across) * (100vw - var(--pet-width) - 2 * var(--pet-edge)))', '--pet-rise': height, '--pet-across': across };
  // Bubble and menu open towards the middle of the screen.
  const facing = snap ? side : across < 0.5 ? 'left' : 'right';
  const summary = [
    game.dueCount ? `${game.dueCount} 道题到期` : '今天没有到期题',
    `连签 ${game.streak.streak} 天`,
    bossWaiting ? `${bossWaiting.name}可挑战` : null,
  ].filter(Boolean).join(' · ');

  return createPortal(
    <div
      ref={rootRef}
      className={`study-pet is-${facing}${bubble && !menuOpen ? ' has-bubble' : ''}${drag ? ' is-dragging' : ''}${compact ? ' is-compact' : ''}`}
      style={style}
      onPointerEnter={wake}
    >
      {menuOpen && (
        <div className="study-pet-menu" role="menu" aria-label="小芽的菜单">
          <p className="study-pet-today"><b>今天</b><span>{summary}</span></p>
          {opener ? (
            <button type="button" role="menuitem" className="is-primary" onClick={() => { setMenuOpen(false); opener(); }}>问小芽（学习助手）</button>
          ) : tutorBlocked ? (
            <button type="button" role="menuitem" disabled>问小芽<small>{tutorBlocked}</small></button>
          ) : null}
          <button type="button" role="menuitem" disabled={!game.dueCount} onClick={() => go('/patrol')}>去巡检<small>{game.dueCount ? `${game.dueCount} 题` : '没有到期题'}</small></button>
          {bossWaiting && <button type="button" role="menuitem" onClick={() => go(bossWaiting.href)}>挑战{bossWaiting.name}</button>}
          <button type="button" role="menuitem" onClick={() => go('/map')}>闯关地图</button>
          <button type="button" role="menuitem" onClick={() => go('/handbook')}>闯关手册</button>
          <button type="button" role="menuitemcheckbox" aria-checked={tipsEnabled} onClick={() => setTipsEnabled(!tipsEnabled)}>主动提醒<small>{tipsEnabled ? '开' : '关'}</small></button>
          <button type="button" role="menuitemcheckbox" aria-checked={snap} onClick={() => setSnap(!snap)}>吸附到边<small>{snap ? '开' : '关'}</small></button>
          <button type="button" role="menuitem" onClick={() => { setSnap(true); setPosition(facing === 'left' ? 'right' : 'left', height); }}>移到{facing === 'left' ? '右' : '左'}边</button>
          <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setHidden(true); }}>收起小芽<small>地图页可叫回</small></button>
        </div>
      )}
      <span className="study-pet-bubble" aria-live="polite">
        {bubble}
        {live?.action && (
          <button type="button" className="study-pet-action" onClick={() => { clearSpeech(); navigate(live.action.to); }}>{live.action.label}</button>
        )}
      </span>
      <button
        type="button"
        className="study-pet-button"
        aria-label="小芽：打开菜单（可拖动，方向键换边）"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { pointer.current = null; setDrag(null); }}
        onKeyDown={onKeyDown}
        onClick={(event) => { if (event.detail === 0) { wake(); setMenuOpen((open) => !open); } }}
      >
        <span key={live?.key ?? 0} className={`study-pet-sprite${motion ? ` is-${motion}` : ''}`}>
          <PixelPet form={game.petForm} mood={drag ? 'happy' : shownMood} size={compact ? 40 : 64} />
        </span>
        <span className="study-pet-shadow" aria-hidden="true" />
      </button>
    </div>,
    document.body,
  );
}
