import { useEffect, useMemo, useState } from 'react';
import { PET_SEQUENCES, frameRects } from './pixelPetSprites';

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Pixel-art study pet. `mood`: idle | thinking | talking | happy | sad | sleep. */
export default function PixelPet({ mood = 'idle', size = 64, still = false, className = '' }) {
  const steps = PET_SEQUENCES[mood] ?? PET_SEQUENCES.idle;
  const [tick, setTick] = useState({ mood, index: 0 });
  // A mood change restarts its loop without an extra effect-driven render.
  const index = tick.mood === mood ? tick.index % steps.length : 0;

  useEffect(() => {
    if (still || steps.length < 2 || reducedMotion()) return undefined;
    const timer = window.setTimeout(() => setTick({ mood, index: index + 1 }), steps[index][1]);
    return () => window.clearTimeout(timer);
  }, [mood, index, steps, still]);

  const name = steps[index][0];
  const rects = useMemo(() => frameRects(name), [name]);
  return (
    <svg className={`pixel-pet pet-mood-${mood} ${className}`} width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {rects.map((r) => <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.width} height="1" fill={r.fill} />)}
    </svg>
  );
}
