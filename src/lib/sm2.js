export const REVIEW_RATINGS = {
  again: { quality: 0, label: '重来' },
  hard: { quality: 3, label: '困难' },
  good: { quality: 4, label: '良好' },
  easy: { quality: 5, label: '简单' },
};

export function nextSm2State(previous = {}, quality, now = new Date()) {
  if (!Number.isInteger(quality) || quality < 0 || quality > 5) throw new Error('quality 必须是 0..5 的整数');
  let repetitions = Number(previous.repetitions ?? 0);
  let intervalDays = Number(previous.intervalDays ?? 0);
  let easeFactor = Number(previous.easeFactor ?? 2.5);
  let lapseCount = Number(previous.lapseCount ?? 0);

  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
    lapseCount += 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
  }

  const dueAt = new Date(now);
  dueAt.setUTCDate(dueAt.getUTCDate() + intervalDays);
  return {
    repetitions,
    intervalDays,
    easeFactor: Number(easeFactor.toFixed(4)),
    lapseCount,
    lastQuality: quality,
    lastReviewedAt: now.toISOString(),
    dueAt: dueAt.toISOString(),
    mastered: intervalDays >= 30 && quality >= 4,
  };
}
