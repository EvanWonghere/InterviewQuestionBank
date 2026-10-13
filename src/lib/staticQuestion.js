export function normalizeStaticQuestion(question) {
  return {
    ...question,
    legacyId: question.id,
    type: question.type ?? 'short_answer',
    promptMd: question.promptMd ?? question.question,
    payload: question.payload ?? {},
    solution: question.solution ?? { referenceAnswerMd: question.answer },
    status: 'published',
    visibility: 'public',
  };
}
