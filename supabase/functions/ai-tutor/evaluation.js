// Shared by the Edge Function and the browser: validation, parsing and aggregation only (no prompts).
export const ERROR_REASON_KEYS = ['concept_gap', 'pattern_missing', 'spec_misread', 'boundary_case', 'complexity', 'implementation_bug', 'careless'];
export const RATING_KEYS = ['again', 'hard', 'good', 'easy'];
export const WEAKNESS_ORIGINS = ['this_answer', 'unresolved'];
// Total rounds including the initial answer; mirrored in ai_begin_evaluation.
export const MAX_ROUNDS = { practice: 4, interview: 3 };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (value) => typeof value === 'string' && UUID.test(value);

export function validateEvaluateInput(input) {
  if (!isUuid(input.questionId) || !isUuid(input.requestId)) throw new Error('无效题目或请求ID');
  if (!(input.mode in MAX_ROUNDS)) throw new Error('无效评估模式');
  if (input.sessionId != null && !isUuid(input.sessionId)) throw new Error('无效面试场次');
  if (input.mode === 'interview' && !input.parentId && !isUuid(input.sessionId)) throw new Error('模拟面试评估需要场次ID');
  if (input.parentId != null) {
    if (!isUuid(input.parentId)) throw new Error('无效追问');
    if (typeof input.answerMd !== 'string' || !input.answerMd.trim() || input.answerMd.length > 8000) throw new Error('追问回答需为1—8000字');
  } else if (JSON.stringify(input.submission ?? {}).length > 20000) {
    throw new Error('作答过长，请缩小代码片段');
  }
}

export function validateReportInput(input) {
  if (!isUuid(input.requestId)) throw new Error('无效请求ID');
  if (input.action === 'interview-report' && !isUuid(input.sessionId)) throw new Error('无效面试场次');
}

/** Objective grading wins over the model: wrong → again, right → never again. */
export function constrainRating(rating, correct) {
  if (correct === false) return 'again';
  const key = RATING_KEYS.includes(rating) ? rating : 'good';
  return correct === true && key === 'again' ? 'hard' : key;
}

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const list = (value, max) => (Array.isArray(value) ? value.slice(0, max) : []);
const clampInt = (value, min, max) => {
  if (value == null || value === '') return null; // Number(null) would silently become 0
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
};

export function extractJson(raw) {
  const body = String(raw ?? '').replace(/```(?:json)?/gi, '');
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('evaluation_parse');
  try {
    const value = JSON.parse(body.slice(start, end + 1));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('not an object');
    return value;
  } catch {
    throw new Error('evaluation_parse');
  }
}

function ratingFromScore(score) {
  return score < 50 ? 'again' : score < 70 ? 'hard' : score < 88 ? 'good' : 'easy';
}

export function parseEvaluation(raw, { correct = null, allowFollowUp = true, isFollowUp = false } = {}) {
  const data = extractJson(raw);
  const score = clampInt(data.score, 0, 100);
  if (score === null) throw new Error('evaluation_parse');
  const weaknesses = list(data.weaknesses, 5)
    .map((w) => {
      const origin = WEAKNESS_ORIGINS.includes(w?.origin) ? w.origin : null;
      return {
        tag: text(w?.tag, 40),
        point: text(w?.point, 300),
        errorReason: ERROR_REASON_KEYS.includes(w?.errorReason) ? w.errorReason : null,
        severity: ['low', 'mid', 'high'].includes(w?.severity) ? w.severity : 'mid',
        ...(origin ? { origin } : {}),
      };
    })
    .filter((w) => w.tag && w.point);
  const followQuestion = allowFollowUp ? text(data.followUp?.question, 600) : '';
  return {
    score,
    verdict: text(data.verdict, 200),
    suggestedRating: constrainRating(RATING_KEYS.includes(data.suggestedRating) ? data.suggestedRating : ratingFromScore(score), correct),
    dimensions: list(data.dimensions, 6)
      .map((d) => ({ name: text(d?.name, 30), score: clampInt(d?.score, 0, 5) ?? 0, comment: text(d?.comment, 300) }))
      .filter((d) => d.name),
    strengths: list(data.strengths, 5).map((s) => text(s, 200)).filter(Boolean),
    weaknesses,
    followUp: followQuestion ? { question: followQuestion, targets: text(data.followUp?.targets, 200) } : null,
    followUpAnswerScore: isFollowUp ? clampInt(data.followUpAnswerScore, 0, 100) : null,
    summaryMd: text(data.summaryMd, 4000),
  };
}

export function weaknessTags(result) {
  return [...new Set(result.weaknesses.map((w) => w.tag))];
}

/**
 * @param {Array<any>} [weaknesses]
 * @param {{isFollowUp?:boolean}} [options]
 */
export function partitionWeaknesses(weaknesses = [], { isFollowUp = false } = {}) {
  if (!isFollowUp) return { thisAnswer: weaknesses, unresolved: [], unlabeled: [] };
  const thisAnswer = [];
  const unresolved = [];
  const unlabeled = [];
  for (const w of weaknesses) {
    if (w.origin === 'this_answer') thisAnswer.push(w);
    else if (w.origin === 'unresolved') unresolved.push(w);
    else unlabeled.push(w);
  }
  return { thisAnswer, unresolved, unlabeled };
}

/**
 * What this round's own answer showed: labeled this-round items, or unlabeled legacy ones.
 * @param {any} result
 * @param {{isFollowUp?:boolean}} [options]
 */
export function thisAnswerWeaknesses(result, { isFollowUp = false } = {}) {
  const { thisAnswer, unlabeled } = partitionWeaknesses(result?.weaknesses, { isFollowUp });
  return thisAnswer.length ? thisAnswer : unlabeled;
}

/**
 * What the original answer is still accountable for: everything on an original round, and on a
 * follow-up round only the leftovers plus unlabeled legacy items.
 * @param {any} result
 * @param {{isFollowUp?:boolean}} [options]
 */
export function originalAnswerWeaknesses(result, { isFollowUp = false } = {}) {
  const { thisAnswer, unresolved, unlabeled } = partitionWeaknesses(result?.weaknesses, { isFollowUp });
  return isFollowUp ? [...unresolved, ...unlabeled] : thisAnswer;
}

const filterIds = (ids, allowed) => [...new Set(list(ids, 10).filter((id) => allowed.has(id)))];

export function parseInterviewReport(raw, questionIds) {
  const data = extractJson(raw);
  const allowed = new Set(questionIds);
  const overallScore = clampInt(data.overallScore, 0, 100);
  if (overallScore === null) throw new Error('evaluation_parse');
  return {
    overallScore,
    summaryMd: text(data.summaryMd, 4000),
    strengths: list(data.strengths, 6).map((s) => text(s, 200)).filter(Boolean),
    weaknesses: list(data.weaknesses, 6)
      .map((w) => ({ tag: text(w?.tag, 40), detail: text(w?.detail, 400), questionIds: filterIds(w?.questionIds, allowed) }))
      .filter((w) => w.tag),
    studyPlan: list(data.studyPlan, 6).map((s) => text(s, 300)).filter(Boolean),
  };
}

export function parseWeaknessReport(raw, candidateIds) {
  const data = extractJson(raw);
  const allowed = new Set(candidateIds);
  const summaryMd = text(data.summaryMd, 4000);
  if (!summaryMd) throw new Error('evaluation_parse');
  return {
    summaryMd,
    focusAreas: list(data.focusAreas, 6)
      .map((f) => ({
        tag: text(f?.tag, 40),
        diagnosis: text(f?.diagnosis, 400),
        drills: list(f?.drills, 4).map((d) => text(d, 300)).filter(Boolean),
        questionIds: filterIds(f?.questionIds, allowed),
      }))
      .filter((f) => f.tag),
  };
}

const pointKey = (point) => String(point ?? '').replace(/^原题仍未纠正：/, '').trim();

/**
 * The newest complete evaluation per question, which is the last round of its newest chain.
 * Used to observe whether a tag is still listed after the follow-ups, never to declare mastery.
 */
function newestPerQuestion(evaluations) {
  const newest = new Map();
  for (const e of evaluations) {
    const current = newest.get(e.question_id);
    if (!current
      || (e.created_at ?? '') > (current.created_at ?? '')
      || ((e.created_at ?? '') === (current.created_at ?? '') && (e.round ?? 1) > (current.round ?? 1))) {
      newest.set(e.question_id, e);
    }
  }
  return newest;
}

/**
 * Deterministic weakness aggregation over complete evaluations (newest first or any order).
 * Tags are grouped case-insensitively; each question counts once per tag so long follow-up chains do not dominate.
 * openQuestionIds are the questions whose newest evaluation still lists the tag.
 */
export function aggregateWeaknesses(evaluations, { limit = 12 } = {}) {
  const complete = evaluations.filter((e) => e.status === 'complete' && e.result);
  const newest = newestPerQuestion(complete);
  const stillListed = (questionId, key) => (newest.get(questionId)?.result?.weaknesses ?? [])
    .some((w) => String(w.tag ?? '').trim().toLowerCase() === key);
  const groups = new Map();
  for (const e of complete) {
    for (const w of e.result.weaknesses ?? []) {
      const key = String(w.tag ?? '').trim().toLowerCase();
      if (!key) continue;
      const g = groups.get(key) ?? { key, tag: String(w.tag).trim(), questions: new Map(), points: [], lastSeen: '' };
      const previous = g.questions.get(e.question_id);
      // Keep the lowest score per question: the weakest showing is the relevant one.
      if (previous == null || e.score < previous) g.questions.set(e.question_id, e.score);
      // The same gap restated as "原题仍未纠正：…" is one point, not two.
      if (w.point && !g.points.some((p) => pointKey(p) === pointKey(w.point))) g.points.push(w.point);
      if (e.created_at > g.lastSeen) g.lastSeen = e.created_at;
      groups.set(key, g);
    }
  }
  return [...groups.values()]
    .map((g) => {
      const scores = [...g.questions.values()].filter((s) => typeof s === 'number');
      const questionIds = [...g.questions.entries()].sort((a, b) => (a[1] ?? 101) - (b[1] ?? 101)).map(([id]) => id);
      return {
        tag: g.tag,
        count: g.questions.size,
        avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
        questionIds,
        openQuestionIds: questionIds.filter((id) => stillListed(id, g.key)),
        points: g.points.slice(0, 3),
        lastSeen: g.lastSeen,
      };
    })
    .sort((a, b) => b.count - a.count || (a.avgScore ?? 101) - (b.avgScore ?? 101))
    .slice(0, limit);
}
