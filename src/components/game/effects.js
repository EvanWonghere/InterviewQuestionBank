// Imperative game effects: particle bursts on one shared canvas, floating text and shake.
// Every entry point is a no-op when `enabled()` is false (quiet mode or reduced motion).

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

let quiet = false;
export const setEffectsQuiet = (value) => { quiet = Boolean(value); };
export const effectsEnabled = () => !quiet && !reducedMotion() && typeof document !== 'undefined';

const cssVar = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

let canvas = null;
let particles = [];
let frame = 0;

function ensureCanvas() {
  if (canvas?.isConnected) return canvas;
  canvas = document.createElement('canvas');
  canvas.className = 'game-fx-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  return canvas;
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawStar(ctx, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 ? r * 0.45 : r;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
  }
  ctx.closePath();
  ctx.fill();
}

function tick() {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  particles = particles.filter((p) => p.life > 0);
  for (const p of particles) {
    p.life -= 1;
    p.vx *= p.drag;
    p.vy = p.vy * p.drag + p.gravity;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.spin;
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.life / 20);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    if (p.shape === 'star') drawStar(ctx, p.size);
    else if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  if (particles.length) frame = requestAnimationFrame(tick);
  else { frame = 0; ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
}

/**
 * Particle burst at viewport coordinates.
 * kind: 'spark' (small star sparks), 'confetti' (falling paper), 'miss' (a few grey dots).
 */
export function burst(x, y, { kind = 'spark', count } = {}) {
  if (!effectsEnabled()) return;
  ensureCanvas();
  resize();
  const palette = kind === 'miss'
    ? [cssVar('--text-quaternary', '#999')]
    : kind === 'confetti'
      ? [cssVar('--game-star', '#e8a200'), cssVar('--game-mint', '#9fe3c6'), cssVar('--apple-blue', '#0071e3'), cssVar('--game-heart', '#e5294f'), cssVar('--game-combo', '#f26a00')]
      : [cssVar('--game-star', '#e8a200'), cssVar('--game-mint', '#9fe3c6'), '#ffffff'];
  const n = count ?? (kind === 'confetti' ? 90 : kind === 'miss' ? 10 : 26);
  for (let i = 0; i < n; i += 1) {
    const angle = kind === 'confetti' ? -Math.PI / 2 + (Math.random() - 0.5) * 1.8 : Math.random() * Math.PI * 2;
    const speed = kind === 'confetti' ? 7 + Math.random() * 9 : kind === 'miss' ? 1 + Math.random() * 2 : 2 + Math.random() * 5;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: kind === 'confetti' ? 0.28 : kind === 'miss' ? 0.12 : 0.06,
      drag: kind === 'confetti' ? 0.985 : 0.95,
      size: kind === 'confetti' ? 7 + Math.random() * 5 : kind === 'miss' ? 4 : 4 + Math.random() * 5,
      shape: kind === 'confetti' ? 'rect' : kind === 'miss' ? 'dot' : Math.random() < 0.6 ? 'star' : 'dot',
      color: palette[Math.floor(Math.random() * palette.length)],
      rot: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      life: kind === 'confetti' ? 110 + Math.random() * 40 : 40 + Math.random() * 20,
    });
  }
  if (!frame) frame = requestAnimationFrame(tick);
}

export function burstFrom(element, options) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  burst(rect.left + rect.width / 2, rect.top + rect.height / 2, options);
}

/** Text that rises and fades from an element, e.g. "+20 XP". */
export function floatText(element, text, tone = 'xp') {
  if (!effectsEnabled() || !element) return;
  const rect = element.getBoundingClientRect();
  const node = document.createElement('span');
  node.className = `game-float-text is-${tone}`;
  node.textContent = text;
  node.setAttribute('aria-hidden', 'true');
  node.style.left = `${rect.left + rect.width / 2}px`;
  node.style.top = `${rect.top}px`;
  document.body.appendChild(node);
  node.addEventListener('animationend', () => node.remove(), { once: true });
  setTimeout(() => node.remove(), 2000);
}

/** Restartable CSS class animation (shake, pop, flash). */
export function pulseClass(element, className, ms = 450) {
  if (!effectsEnabled() || !element) return;
  element.classList.remove(className);
  void element.offsetWidth; // restart the animation
  element.classList.add(className);
  setTimeout(() => element.classList.remove(className), ms);
}
