// Pure rules for the stage/map game layer. Everything here is derived from the
// question list, SM-2 review states and recent attempts; the only extra input is
// the local game store (stage records, best-star high-water marks, combo bonus).
// See docs/GAMIFICATION.md.

import { dayKey } from '@/lib/practiceCalendar';

export const STAGE_MAX_SIZE = 6;
export const HEARTS_PER_STAGE = 3;
export const BASE_XP = { easy: 10, medium: 20, hard: 35 };
export const MISS_XP = 5;
export const COMBO_STEP = 0.1;
export const COMBO_CAP = 0.5;

export const LEVELS = [
  { name: '实习生', xp: 0 },
  { name: '初级客户端', xp: 300 },
  { name: '中级客户端', xp: 900 },
  { name: '高级客户端', xp: 2000 },
  { name: '资深客户端', xp: 3800 },
  { name: '技术专家', xp: 6500 },
  { name: '主程', xp: 10000 },
];

// XP a question is worth at each star count; 3 stars adds 1.5× the base on top of 2 stars.
const STAR_XP_FACTOR = [0, 0.6, 1, 2.5];
const DIFFICULTY_RANK = { easy: 0, medium: 1, hard: 2 };

const baseXp = (question) => BASE_XP[question?.difficulty] ?? BASE_XP.medium;

/** Questions that take part in stages: published ones only, so drafts never shift stage boundaries. */
export function stageQuestions(questions, categoryId) {
  return questions
    .filter((q) => q.categoryId === categoryId && (q.status ?? 'published') === 'published')
    .sort((a, b) => (DIFFICULTY_RANK[a.difficulty] ?? 1) - (DIFFICULTY_RANK[b.difficulty] ?? 1)
      || (a.order ?? 0) - (b.order ?? 0)
      || String(a.id).localeCompare(String(b.id)));
}

/**
 * Split a category into ceil(n / 6) stages of balanced size (4–6 questions for n ≥ 4).
 * @returns {Array<{ key: string, categoryId: string, index: number, questions: object[] }>} index is 1-based
 */
export function buildStages(questions, categoryId) {
  const list = stageQuestions(questions, categoryId);
  if (!list.length) return [];
  const count = Math.ceil(list.length / STAGE_MAX_SIZE);
  const small = Math.floor(list.length / count);
  const bigger = list.length % count; // the first `bigger` stages take one extra question
  const stages = [];
  let start = 0;
  for (let i = 0; i < count; i += 1) {
    const size = small + (i < bigger ? 1 : 0);
    stages.push({ key: stageKey(categoryId, i + 1), categoryId, index: i + 1, questions: list.slice(start, start + size) });
    start += size;
  }
  return stages;
}

export const stageKey = (categoryId, index) => `${categoryId}:${index}`;

/** Readable URL segment for a category: the cloud slug, or the static id (which is already a slug). */
export const categorySlug = (category) => category.slug ?? category.id;
export const findCategory = (categories, param) => categories.find((c) => c.slug === param || c.id === param) ?? null;
export const stageHref = (category, index) => `/stage/${categorySlug(category)}/${index}`;

/** Star count for one answer inside a stage run. */
export function answerStars({ quality, assisted = false }) {
  if (!(quality >= 3)) return 0;
  if (quality === 3 || assisted) return 1;
  return 2;
}

/** Review state / attempts may be keyed by the cloud id or the legacy id. */
function stateFor(reviewStates, question) {
  return reviewStates?.[question.id] ?? (question.legacyId ? reviewStates?.[question.legacyId] : undefined);
}

const isAttemptOf = (question) => (a) => a.question_id === question.id || (question.legacyId && a.question_id === question.legacyId);

function latestAttemptFor(attempts, question) {
  // attempts are newest first
  return attempts?.find(isAttemptOf(question));
}

/**
 * The third star needs the current passing streak to span two calendar days, so answering twice
 * in one sitting does not count as a review. Attempts only keep the latest 500; when the visible
 * streak is shorter than SM-2's `repetitions`, the rest fell out of the window and the state is trusted.
 */
function streakSpansDays(question, state, attempts) {
  const streak = [];
  for (const attempt of attempts ?? []) {
    if (!isAttemptOf(question)(attempt)) continue;
    if (!(attempt.quality >= 3)) break;
    streak.push(attempt);
  }
  if (streak.length < state.repetitions) return true;
  return new Set(streak.map((a) => dayKey(a.answered_at))).size >= 2;
}

/**
 * Current stars of a question, derived from its SM-2 state:
 * 0 never passed or last rated 重来; 1 last rated 困难 or last attempt used AI help;
 * 2 last rated ≥ 良好; 3 additionally passed at least twice in a row (repetitions ≥ 2) on different days.
 */
export function currentStars(question, reviewStates, attempts) {
  const state = stateFor(reviewStates, question);
  if (!state || !(state.lastQuality >= 3)) return 0;
  if (state.lastQuality === 3) return 1;
  if (latestAttemptFor(attempts, question)?.assistance_used) return 1;
  return state.repetitions >= 2 && streakSpansDays(question, state, attempts) ? 3 : 2;
}

/** XP a question contributes: from its best-ever stars (so a later lapse never takes XP away) plus 5 per lapse. */
export function questionXp(question, bestStars, lapseCount = 0) {
  return Math.round(baseXp(question) * STAR_XP_FACTOR[bestStars ?? 0]) + MISS_XP * lapseCount;
}

/** Best-ever stars per question id: the stored high-water mark merged with the current derivation. */
export function mergeBestStars(questions, reviewStates, attempts, stored = {}) {
  const best = { ...stored };
  for (const q of questions) {
    const now = currentStars(q, reviewStates, attempts);
    if (now > (best[q.id] ?? 0)) best[q.id] = now;
  }
  return best;
}

/** Total XP: per-question best stars + 5 XP per recorded lapse + locally stored combo bonus. */
export function totalXp(questions, reviewStates, bestStars, bonusXp = 0) {
  let xp = bonusXp;
  for (const q of questions) {
    xp += questionXp(q, bestStars[q.id], stateFor(reviewStates, q)?.lapseCount ?? 0);
  }
  return xp;
}

export function levelFor(xp) {
  let index = 0;
  LEVELS.forEach((level, i) => { if (xp >= level.xp) index = i; });
  const current = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  const progress = next ? (xp - current.xp) / (next.xp - current.xp) : 1;
  return { index, name: current.name, xp, floor: current.xp, next, progress: Math.max(0, Math.min(1, progress)) };
}

/** XP an answer in a run earns right now (shown as the floating "+N XP"), including the combo bonus. */
export function answerXp(question, stars, combo) {
  if (stars === 0) return { xp: MISS_XP, bonus: 0 };
  const xp = Math.round(baseXp(question) * STAR_XP_FACTOR[stars]);
  const bonus = stars === 2 ? Math.round(xp * comboMultiplier(combo)) : 0;
  return { xp, bonus };
}

export function comboMultiplier(combo) {
  return combo > 1 ? Math.min(COMBO_CAP, (combo - 1) * COMBO_STEP) : 0;
}

/** Combo after an answer: 2 stars +1, assisted 1 star unchanged, anything else resets. */
export function nextCombo(combo, { stars, assisted }) {
  if (stars === 2) return combo + 1;
  if (stars === 1 && assisted) return combo;
  return 0;
}

/**
 * Stage stars: 1 cleared, 2 cleared without losing a heart, 3 every question at 3 stars.
 * A stage never run counts as cleared (with 1 star) once every question is currently ≥ 2 stars,
 * so existing practice history unlocks the map.
 */
export function stageStatus(stage, { record, reviewStates, attempts }) {
  const stars = stage.questions.map((q) => currentStars(q, reviewStates, attempts));
  const allTwo = stars.every((s) => s >= 2);
  const cleared = Boolean(record?.cleared) || allTwo;
  let stageStars = 0;
  if (cleared) stageStars = record?.flawless ? 2 : 1;
  if (cleared && stars.every((s) => s === 3)) stageStars = 3;
  return { cleared, stars: stageStars, questionStars: stars };
}

/** Chapter view: every stage with status and whether it is playable (first, or previous cleared). */
export function chapterProgress(questions, categoryId, { records = {}, reviewStates, attempts }) {
  const stages = buildStages(questions, categoryId).map((stage) => ({
    ...stage,
    ...stageStatus(stage, { record: records[stage.key], reviewStates, attempts }),
  }));
  stages.forEach((stage, i) => { stage.unlocked = i === 0 || stages[i - 1].cleared; });
  const current = stages.find((s) => s.unlocked && !s.cleared) ?? null;
  return {
    stages,
    currentIndex: current?.index ?? null,
    stars: stages.reduce((sum, s) => sum + s.stars, 0),
    maxStars: stages.length * 3,
    bossReady: stages.length > 0 && stages.every((s) => s.stars >= 2),
  };
}

// ── Phase 2: daily patrol, streak, achievements, pet growth ─────────────

export const PATROL_SIZE = 8;
export const FREEZE_EVERY = 7;
export const FREEZE_MAX = 2;

/** Due questions for today's patrol, earliest due first. */
export function dueQuestions(questions, reviewStates, now = Date.now(), limit = PATROL_SIZE) {
  return questions
    .map((q) => ({ q, state: stateFor(reviewStates, q) }))
    .filter(({ q, state }) => (q.status ?? 'published') === 'published' && state?.dueAt && new Date(state.dueAt).getTime() <= now)
    .sort((a, b) => new Date(a.state.dueAt) - new Date(b.state.dueAt))
    .slice(0, limit)
    .map(({ q }) => q);
}

export const patrolKey = (day) => `patrol:${day}`;

/** Local calendar days with at least one rated answer. */
export function activeDays(attempts) {
  return [...new Set((attempts ?? []).map((a) => dayKey(a.answered_at)))].sort();
}

const shiftDay = (key, days) => new Date(Date.parse(`${key}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);

/**
 * Replays the calendar from the first active day: an active day extends the streak and every
 * 7th streak day earns a freeze card (at most 2); a missed day uses a card or resets the streak.
 * Today still counts as pending until it ends, so a streak is not lost before bedtime.
 */
export function streakFrom(days, today) {
  const active = new Set(days);
  let streak = 0;
  let freezes = 0;
  let frozen = 0;
  if (!days.length) return { streak, freezes, frozen, activeToday: false };
  for (let day = days[0]; day <= today; day = shiftDay(day, 1)) {
    if (active.has(day)) {
      streak += 1;
      if (streak % FREEZE_EVERY === 0) freezes = Math.min(FREEZE_MAX, freezes + 1);
    } else if (day !== today) {
      if (streak > 0 && freezes > 0) { freezes -= 1; frozen += 1; } else { streak = 0; frozen = 0; }
    }
  }
  return { streak, freezes, frozen, activeToday: active.has(today) };
}

/** Pet form by level, drooping when reviews pile up. */
export function petForm(levelIndex, dueCount) {
  if (dueCount >= 10) return 'droop';
  if (levelIndex >= 4) return 'bloom';
  if (levelIndex >= 2) return 'twin';
  return 'sprout';
}

const longestUnassistedRun = (attempts) => {
  let best = 0;
  let run = 0;
  for (const a of attempts ?? []) {
    run = a.assistance_used ? 0 : run + 1;
    best = Math.max(best, run);
  }
  return best;
};

/**
 * One-time achievements. `check` receives
 * { questions, categories, reviewStates, attempts, bestStars, records, streak }.
 */
export const ACHIEVEMENTS = [
  {
    id: 'first-clear', badge: 'GO', name: '第一关', description: '通关任意一关',
    check: ({ records }) => Object.entries(records).some(([key, r]) => !key.startsWith('patrol:') && r.cleared),
  },
  {
    id: 'zero-gc', badge: 'GC', name: '零 GC', description: 'C# 基础任一关无伤、不问小芽通关',
    check: ({ records, categories }) => {
      const cs = categories.find((c) => categorySlug(c) === 'csharp-basics');
      return Boolean(cs) && Object.entries(records).some(([key, r]) => key.startsWith(`${cs.id}:`) && r.flawless && r.unassisted);
    },
  },
  {
    id: 'steady-60', badge: '60', name: '稳定 60 帧', description: '一关内连击达到 6',
    check: ({ records }) => Object.values(records).some((r) => (r.maxCombo ?? 0) >= 6),
  },
  {
    id: 'solo-dev', badge: 'SOLO', name: '独立开发', description: '连续 20 题不问小芽',
    check: ({ attempts }) => longestUnassistedRun(attempts) >= 20,
  },
  {
    id: 'undefined-behavior', badge: 'UB', name: '未定义行为', description: '一道错过 3 次的 C++ 题复习到 3 星',
    check: ({ questions, categories, reviewStates, attempts }) => {
      const cpp = categories.find((c) => categorySlug(c) === 'cpp-basics');
      return Boolean(cpp) && questions.some((q) => q.categoryId === cpp.id
        && (stateFor(reviewStates, q)?.lapseCount ?? 0) >= 3 && currentStars(q, reviewStates, attempts) === 3);
    },
  },
  {
    id: 'il2cpp-survivor', badge: 'AOT', name: 'IL2CPP 幸存者', description: '所有困难题至少 2 星',
    check: ({ questions, bestStars }) => {
      const hard = questions.filter((q) => q.difficulty === 'hard' && (q.status ?? 'published') === 'published');
      return hard.length > 0 && hard.every((q) => (bestStars[q.id] ?? 0) >= 2);
    },
  },
  {
    id: 'three-way-handshake', badge: 'SYN', name: '三次握手', description: '连续 3 天完成每日巡检',
    check: ({ records }) => {
      const days = Object.keys(records).filter((k) => k.startsWith('patrol:') && records[k].completed).map((k) => k.slice(7)).sort();
      return days.some((d, i) => i >= 2 && days[i - 1] === shiftDay(d, -1) && days[i - 2] === shiftDay(d, -2));
    },
  },
  {
    id: 'offer', badge: 'OFFER', name: '拿到 Offer', description: '击败任意一章的面试官',
    check: ({ records }) => Object.entries(records).some(([key, r]) => key.startsWith('boss:') && r.defeated),
  },
  {
    id: 'batch-master', badge: 'DC', name: '合批大师', description: '击败「渲染与图形学」的面试官',
    check: ({ records, categories }) => {
      const render = categories.find((c) => categorySlug(c) === 'rendering-graphics');
      return Boolean(render && records[`boss:${render.id}`]?.defeated);
    },
  },
  {
    id: 'lts', badge: 'LTS', name: '长期支持', description: '连续答题 30 天（补签卡算数）',
    check: ({ streak }) => streak.streak >= 30,
  },
];

export function unlockedAchievements(context) {
  return ACHIEVEMENTS.filter((a) => a.check(context)).map((a) => a.id);
}

// ── Phase 3: cloud merge (mirrors public.game_progress_merge) ───────────

/** Field-by-field merge of one record: booleans OR, numbers max, strings (ISO timestamps) latest. */
export function mergeRecord(stored = {}, incoming = {}) {
  const result = { ...stored };
  for (const [key, value] of Object.entries(incoming ?? {})) {
    const current = result[key];
    if (current === undefined) {
      if (['boolean', 'number', 'string'].includes(typeof value)) result[key] = value;
    } else if (typeof current === 'boolean' && typeof value === 'boolean') {
      result[key] = current || value;
    } else if (typeof current === 'number' && typeof value === 'number') {
      result[key] = Math.max(current, value);
    } else if (typeof current === 'string' && typeof value === 'string') {
      result[key] = value > current ? value : current;
    }
  }
  return result;
}

export function mergeRecords(a = {}, b = {}) {
  const result = { ...a };
  for (const [key, record] of Object.entries(b ?? {})) result[key] = mergeRecord(result[key], record);
  return result;
}

export function maxStars(a = {}, b = {}) {
  const result = { ...a };
  for (const [id, stars] of Object.entries(b ?? {})) result[id] = Math.max(result[id] ?? 0, stars);
  return result;
}

// ── Phase 3: chapter boss ───────────────────────────────────────────────

export const BOSS_HP = 100;
export const BOSS_QUESTIONS = 3;
export const BOSS_DAILY_LIMIT = 3;
// Without AI, damage comes from the self-rating: 重来 0, 困难 20, 良好 35, 简单 40.
const RATING_DAMAGE = { 0: 0, 3: 20, 4: 35, 5: 40 };

export const bossKey = (categoryId) => `boss:${categoryId}`;
export const bossHref = (category) => `/boss/${categorySlug(category)}`;

/** A question's damage from its best AI score so far: half the score, so ~67 average beats the boss. */
export const aiDamage = (score) => Math.round(Math.max(0, Math.min(100, score)) / 2);
export const ratingDamage = (quality) => RATING_DAMAGE[quality] ?? 0;

export function bossFightsLeft(record, today) {
  const used = record?.fightDay === today ? record.fightsToday ?? 0 : 0;
  return Math.max(0, BOSS_DAILY_LIMIT - used);
}

/** The boss deck: random hard questions of the chapter, topped up with medium ones. */
export function bossDeck(questions, categoryId, random = Math.random) {
  const pool = stageQuestions(questions, categoryId);
  const shuffle = (list) => list.map((q) => [random(), q]).sort((a, b) => a[0] - b[0]).map(([, q]) => q);
  const hard = shuffle(pool.filter((q) => q.difficulty === 'hard'));
  const medium = shuffle(pool.filter((q) => q.difficulty !== 'hard'));
  return [...hard, ...medium].slice(0, BOSS_QUESTIONS);
}

// ── Phase 3: hint cards and revive ──────────────────────────────────────

export const HINT_CARDS = 2;
export const HINT_CARD_COMBO = 5; // reaching this combo once per run earns one more card
export const REVIVE_SCORE = 60;

/** A follow-up round (round > 1) scoring at least REVIVE_SCORE earns back one heart, once per run. */
export const revives = (evaluation) => (evaluation?.round ?? 1) > 1 && (evaluation?.score ?? 0) >= REVIVE_SCORE;
