// Shared by the Edge Function and the browser: validation, parsing and aggregation only (no prompts).
export const ERROR_REASON_KEYS = ['concept_gap', 'pattern_missing', 'spec_misread', 'boundary_case', 'complexity', 'implementation_bug', 'careless'];
export const RATING_KEYS = ['again', 'hard', 'good', 'easy'];
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

export function parseEvaluation(raw, { correct = null, allowFollowUp = true } = {}) {
  const data = extractJson(raw);
  const score = clampInt(data.score, 0, 100);
  if (score === null) throw new Error('evaluation_parse');
  const weaknesses = list(data.weaknesses, 5)
    .map((w) => ({
      tag: text(w?.tag, 40),
      point: text(w?.point, 300),
      errorReason: ERROR_REASON_KEYS.includes(w?.errorReason) ? w.errorReason : null,
      severity: ['low', 'mid', 'high'].includes(w?.severity) ? w.severity : 'mid',
    }))
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
    summaryMd: text(data.summaryMd, 4000),
  };
}

export function weaknessTags(result) {
  return [...new Set(result.weaknesses.map((w) => w.tag))];
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

/**
 * Deterministic weakness aggregation over complete evaluations (newest first or any order).
 * Tags are grouped case-insensitively; each question counts once per tag so long follow-up chains do not dominate.
 */
export function aggregateWeaknesses(evaluations, { limit = 12 } = {}) {
  const groups = new Map();
  for (const e of evaluations) {
    if (e.status !== 'complete' || !e.result) continue;
    for (const w of e.result.weaknesses ?? []) {
      const key = String(w.tag ?? '').trim().toLowerCase();
      if (!key) continue;
      const g = groups.get(key) ?? { tag: String(w.tag).trim(), questions: new Map(), points: [], lastSeen: '' };
      const previous = g.questions.get(e.question_id);
      // Keep the lowest score per question: the weakest showing is the relevant one.
      if (previous == null || e.score < previous) g.questions.set(e.question_id, e.score);
      if (w.point && !g.points.includes(w.point)) g.points.push(w.point);
      if (e.created_at > g.lastSeen) g.lastSeen = e.created_at;
      groups.set(key, g);
    }
  }
  return [...groups.values()]
    .map((g) => {
      const scores = [...g.questions.values()].filter((s) => typeof s === 'number');
      return {
        tag: g.tag,
        count: g.questions.size,
        avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
        questionIds: [...g.questions.entries()].sort((a, b) => (a[1] ?? 101) - (b[1] ?? 101)).map(([id]) => id),
        points: g.points.slice(0, 3),
        lastSeen: g.lastSeen,
      };
    })
    .sort((a, b) => b.count - a.count || (a.avgScore ?? 101) - (b.avgScore ?? 101))
    .slice(0, limit);
}
