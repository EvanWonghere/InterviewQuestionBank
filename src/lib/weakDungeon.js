// Pure rules for the weak-point dungeon: a run assembled from the tag with the most lapses
// (and, for administrators, AI-evaluation weaknesses). See docs/GAMIFICATION.md.

import { currentStars } from '@/lib/gameRules';

const MIN_TAG_QUESTIONS = 3;
const DEFAULT_SIZE = 5;

/** Review state / attempts may be keyed by the cloud id or the legacy id (mirrors gameRules' stateFor). */
function stateFor(reviewStates, question) {
  return reviewStates?.[question.id] ?? (question.legacyId ? reviewStates?.[question.legacyId] : undefined);
}

const lapsesOf = (question, reviewStates) => stateFor(reviewStates, question)?.lapseCount ?? 0;

/**
 * Tag weights: the sum of each tagged question's lapse count, plus `count * 2` for every
 * `{ tag, count }` entry in `evaluationWeaknesses` (AI-evaluation weaknesses, administrators only).
 * @returns {Map<string, number>}
 */
export function weakTagWeights(questions, reviewStates, evaluationWeaknesses = []) {
  const weights = new Map();
  const add = (tag, amount) => { if (tag) weights.set(tag, (weights.get(tag) ?? 0) + amount); };
  for (const q of questions ?? []) {
    const lapses = lapsesOf(q, reviewStates);
    if (!lapses) continue;
    for (const tag of q.tags ?? []) add(tag, lapses);
  }
  for (const { tag, count } of evaluationWeaknesses ?? []) add(tag, (count ?? 0) * 2);
  return weights;
}

/**
 * Picks the heaviest tag that has at least 3 published questions carrying it, and orders that
 * tag's questions weakest-first (lowest current stars, then most lapses, then `order`).
 * @returns {{ tag: string, questions: object[] } | null}
 */
export function pickDungeon(questions, { reviewStates, attempts, evaluationWeaknesses, size = DEFAULT_SIZE } = {}) {
  const list = questions ?? [];
  const weights = weakTagWeights(list, reviewStates, evaluationWeaknesses);
  const tags = [...weights.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);

  for (const tag of tags) {
    const tagged = list.filter((q) => (q.status ?? 'published') === 'published' && (q.tags ?? []).includes(tag));
    if (tagged.length < MIN_TAG_QUESTIONS) continue;
    const ordered = [...tagged].sort((a, b) => currentStars(a, reviewStates, attempts) - currentStars(b, reviewStates, attempts)
      || lapsesOf(b, reviewStates) - lapsesOf(a, reviewStates)
      || (a.order ?? 0) - (b.order ?? 0));
    return { tag, questions: ordered.slice(0, size) };
  }
  return null;
}
