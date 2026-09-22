export const QUESTION_ID_PARAM = 'questionId';

function normalizeId(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

/**
 * Resolve a question using either the database UUID or its stable legacy ID.
 * The comparison is case-insensitive so copied links remain deterministic.
 */
export function findQuestionByStableId(questions, value) {
  const wanted = normalizeId(value);
  if (!wanted) return null;
  return questions.find((question) => [question.id, question.legacyId]
    .map(normalizeId)
    .some((id) => id && id === wanted)) ?? null;
}

/** Return the canonical identifier used by a question link. */
export function stableQuestionId(question) {
  return typeof question === 'string' ? question : question?.id ?? question?.legacyId ?? '';
}

export function questionHref(question) {
  const id = stableQuestionId(question);
  return id ? `/quiz?${QUESTION_ID_PARAM}=${encodeURIComponent(id)}` : '/quiz';
}
