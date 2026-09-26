const STAR_PATH = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z';

/** One star. `state`: on | off | pending (dashed outline: lit later by review). */
export function Star({ state = 'off', size = 16, className = '' }) {
  const props = state === 'on'
    ? { fill: 'var(--game-star)', stroke: 'var(--game-star)', strokeWidth: 1.2 }
    : state === 'pending'
      ? { fill: 'none', stroke: 'var(--game-star)', strokeWidth: 1.6, strokeDasharray: '2.4 2' }
      : { fill: 'var(--game-star-off)', stroke: 'none' };
  return (
    <svg className={`game-star is-${state} ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={STAR_PATH} strokeLinejoin="round" {...props} />
    </svg>
  );
}

/** Three stars with `count` lit; the third shows as pending when `pendingThird` and not yet earned. */
export default function Stars({ count = 0, size = 16, pendingThird = false, className = '' }) {
  return (
    <span className={`game-stars ${className}`} role="img" aria-label={`${count} 颗星`}>
      {[0, 1, 2].map((i) => (
        <Star key={i} size={size} state={i < count ? 'on' : i === 2 && pendingThird ? 'pending' : 'off'} />
      ))}
    </span>
  );
}
