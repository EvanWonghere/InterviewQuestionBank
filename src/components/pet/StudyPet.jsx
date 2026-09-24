import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import PixelPet from './PixelPet';
import { usePetStore } from '@/store/petStore';

const SLEEP_AFTER_MS = 90_000;
const GREETED_KEY = 'iqb:pet-greeted';
const BUBBLES = {
  idle: '卡住了？点我一起想',
  thinking: '我想想……',
  talking: '正在写……',
  happy: '写好啦',
  sad: '出了点问题，点开看看',
  sleep: 'Zzz… 点我叫醒',
};

function alreadyGreeted() {
  try { return sessionStorage.getItem(GREETED_KEY) === '1'; } catch { return true; }
}

/** Floating desk pet. Visible only where a question page registered a tutor opener (admin-only). */
export default function StudyPet() {
  const { hidden, mood, panelOpen, opener, setHidden } = usePetStore();
  const [asleep, setAsleep] = useState(false);
  const [hopKey, setHopKey] = useState(0);
  const [greeting, setGreeting] = useState(() => !alreadyGreeted());
  const visible = Boolean(opener) && !hidden && !panelOpen;

  useEffect(() => {
    if (!visible || mood !== 'idle' || asleep) return undefined;
    const timer = window.setTimeout(() => setAsleep(true), SLEEP_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [visible, mood, asleep, hopKey]);

  useEffect(() => {
    if (!visible || !greeting) return undefined;
    try { sessionStorage.setItem(GREETED_KEY, '1'); } catch { /* private mode */ }
    const timer = window.setTimeout(() => setGreeting(false), 5000);
    return () => window.clearTimeout(timer);
  }, [visible, greeting]);

  if (!visible) return null;
  const shown = asleep && mood === 'idle' ? 'sleep' : mood;
  const bubble = greeting && shown === 'idle' ? '我是小芽，有不懂的随时点我' : BUBBLES[shown];
  const wake = () => { setAsleep(false); setGreeting(false); };

  return createPortal(
    <div className={`study-pet ${greeting || shown !== 'idle' ? 'has-bubble' : ''}`} onPointerEnter={wake}>
      <span className="study-pet-bubble" aria-live="polite">{bubble}</span>
      <button
        type="button"
        className="study-pet-button"
        aria-label="打开学习助手（小芽）"
        title="打开学习助手"
        onClick={() => { wake(); setHopKey((k) => k + 1); opener(); }}
      >
        <span key={hopKey} className={`study-pet-sprite ${hopKey ? 'is-hopping' : ''}`}>
          <PixelPet mood={shown} size={64} />
        </span>
        <span className="study-pet-shadow" aria-hidden="true" />
      </button>
      <button type="button" className="study-pet-dismiss" aria-label="收起小芽" title="收起（可在学习助手顶部重新召唤）" onClick={() => setHidden(true)}>×</button>
    </div>,
    document.body,
  );
}
