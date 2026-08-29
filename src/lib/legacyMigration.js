export function mergeLegacyData(localProgress = {}, localNotes = {}, gistData = {}) {
  return {
    progress: { ...localProgress, ...(gistData.progress ?? {}) },
    notes: { ...localNotes, ...(gistData.notes ?? {}) },
  };
}

export function legacyStatusToReview(status, now = new Date()) {
  if (status === 'mastered') {
    const due = new Date(now);
    due.setUTCDate(due.getUTCDate() + 30);
    return { repetitions: 4, intervalDays: 30, easeFactor: 2.5, lapseCount: 0, lastQuality: 4, dueAt: due.toISOString() };
  }
  return {
    repetitions: 0,
    intervalDays: status === 'wrong' ? 1 : 0,
    easeFactor: 2.5,
    lapseCount: status === 'wrong' ? 1 : 0,
    lastQuality: status === 'wrong' ? 0 : 3,
    dueAt: now.toISOString(),
  };
}
