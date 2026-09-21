// Shared by the Edge Function and the browser: turns model output into the questionSchema shape.
// The browser still runs the zod questionSchema before saving; this layer only normalizes and rejects.
import { extractJson } from './evaluation.js';

export const DRAFT_TYPES = ['single_choice', 'multiple_choice', 'fill_blank', 'short_answer', 'algorithm', 'engineering'];
export const OBJECTIVE_TYPES = ['single_choice', 'multiple_choice', 'fill_blank'];
// Below this follow-up answer score the panel recommends adding the follow-up to the bank.
export const WEAK_FOLLOW_UP_SCORE = 70;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const fail = () => { throw new Error('evaluation_parse'); };

export function validateDraftInput(input) {
  if (typeof input.evaluationId !== 'string' || !UUID.test(input.evaluationId)) throw new Error('无效追问');
  if (input.type !== 'auto' && !DRAFT_TYPES.includes(input.type)) throw new Error('无效题型');
}

/** The follow-up answer's own score, or null when the evaluation never produced one. */
export function ownFollowUpScore(evaluation) {
  const own = evaluation?.result?.followUpAnswerScore;
  return typeof own === 'number' ? own : null;
}

/**
 * Score to screen a follow-up by. Evaluations saved before followUpAnswerScore existed only
 * carry the chain-wide score, so callers must label which one they are showing.
 */
export function followUpScore(evaluation) {
  return ownFollowUpScore(evaluation) ?? evaluation?.score ?? null;
}

export function parseGeneratedQuestion(raw, { requestedType = 'auto' } = {}) {
  return normalizeGeneratedQuestion(extractJson(raw), requestedType);
}

export const MAX_WEAKNESS_DRAFTS = 3;

export function validateWeaknessDraftInput(input) {
  if (typeof input.tag !== 'string' || !input.tag.trim() || input.tag.length > 40) throw new Error('无效薄弱点');
  if (!Number.isInteger(input.count) || input.count < 1 || input.count > MAX_WEAKNESS_DRAFTS) throw new Error('无效题目数量');
  if (input.types !== 'auto' && !(Array.isArray(input.types) && input.types.length === input.count && input.types.every((t) => DRAFT_TYPES.includes(t)))) {
    throw new Error('无效题型');
  }
}

/** Several questions in one reply: invalid items are dropped, but at least one must survive. */
export function parseGeneratedQuestionSet(raw, { count, types = 'auto' }) {
  const data = extractJson(raw);
  const items = (Array.isArray(data.questions) ? data.questions : []).slice(0, count);
  const questions = [];
  items.forEach((item, index) => {
    try {
      questions.push(normalizeGeneratedQuestion(item, types === 'auto' ? 'auto' : types[index]));
    } catch { /* one malformed item should not discard the others */ }
  });
  if (!questions.length) fail();
  return questions;
}

function normalizeGeneratedQuestion(data, requestedType) {
  if (!data || typeof data !== 'object') fail();
  const type = requestedType !== 'auto' ? requestedType : DRAFT_TYPES.includes(data.type) ? data.type : 'short_answer';
  const title = text(data.title, 80);
  const promptMd = text(data.promptMd, 6000);
  if (!title || !promptMd) fail();
  const solution = data.solution && typeof data.solution === 'object' ? data.solution : {};
  const question = {
    type,
    title,
    promptMd,
    difficulty: ['easy', 'medium', 'hard'].includes(data.difficulty) ? data.difficulty : 'medium',
    tags: [...new Set((Array.isArray(data.tags) ? data.tags : []).map((t) => text(t, 30)).filter(Boolean))].slice(0, 6),
    payload: {},
    solution: {
      referenceAnswerMd: text(solution.referenceAnswerMd, 12000),
      rubricMd: text(solution.rubricMd, 4000),
      explanationMd: text(solution.explanationMd, 4000),
      caseSensitive: false,
    },
  };

  if (type === 'single_choice' || type === 'multiple_choice') {
    const source = (Array.isArray(data.payload?.options) ? data.payload.options : []).slice(0, 6);
    // Stable short ids; the model's own ids only map correctness.
    const options = source.map((o, i) => ({ from: String(o?.id ?? ''), id: String.fromCharCode(97 + i), text: text(o?.text, 1000) })).filter((o) => o.text);
    const correct = new Set(Array.isArray(solution.correctOptionIds) ? solution.correctOptionIds.map(String) : []);
    const correctOptionIds = options.filter((o) => correct.has(o.from)).map((o) => o.id);
    const needed = type === 'single_choice' ? 1 : 2;
    if (options.length < 2 || correctOptionIds.length < needed || (type === 'single_choice' && correctOptionIds.length !== 1)) fail();
    question.payload.options = options.map(({ id, text: t }) => ({ id, text: t }));
    question.solution.correctOptionIds = correctOptionIds;
  } else if (type === 'fill_blank') {
    const source = (Array.isArray(data.payload?.blanks) ? data.payload.blanks : []).slice(0, 5);
    const accepted = solution.acceptedAnswers && typeof solution.acceptedAnswers === 'object' ? solution.acceptedAnswers : {};
    const blanks = source.map((b, i) => ({
      id: `b${i + 1}`,
      label: text(b?.label, 60) || `填空 ${i + 1}`,
      answers: (Array.isArray(accepted[b?.id]) ? accepted[b.id] : []).map((a) => text(a, 200)).filter(Boolean).slice(0, 8),
    }));
    if (!blanks.length || blanks.some((b) => !b.answers.length)) fail();
    question.payload.blanks = blanks.map(({ id, label }) => ({ id, label }));
    question.solution.acceptedAnswers = Object.fromEntries(blanks.map((b) => [b.id, b.answers]));
    question.solution.caseSensitive = solution.caseSensitive === true;
  } else {
    if (!question.solution.referenceAnswerMd) fail();
    if (type === 'algorithm') {
      const language = text(data.payload?.language, 30);
      const starterCode = typeof data.payload?.starterCode === 'string' ? data.payload.starterCode.slice(0, 6000) : '';
      if (language) question.payload.language = language;
      if (starterCode.trim()) question.payload.starterCode = starterCode;
    }
  }
  return question;
}
