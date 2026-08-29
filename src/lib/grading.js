export function normalizeFill(value, caseSensitive = false) {
  const normalized = String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ');
  return caseSensitive ? normalized : normalized.toLocaleLowerCase();
}

export function gradeObjective(question, submission) {
  const solution = question.solution ?? {};
  if (question.type === 'single_choice') {
    return String(submission?.optionId ?? '') === String(solution.correctOptionIds?.[0] ?? '');
  }
  if (question.type === 'multiple_choice') {
    const expected = [...new Set(solution.correctOptionIds ?? [])].sort();
    const actual = [...new Set(submission?.optionIds ?? [])].sort();
    return expected.length === actual.length && expected.every((value, index) => value === actual[index]);
  }
  if (question.type === 'fill_blank') {
    const answers = submission?.answers ?? {};
    return (question.payload?.blanks ?? []).every((blank) => {
      const actual = normalizeFill(answers[blank.id], solution.caseSensitive);
      return (solution.acceptedAnswers?.[blank.id] ?? []).some(
        (candidate) => normalizeFill(candidate, solution.caseSensitive) === actual
      );
    });
  }
  return null;
}

export const isObjectiveType = (type) => ['single_choice', 'multiple_choice', 'fill_blank'].includes(type);
