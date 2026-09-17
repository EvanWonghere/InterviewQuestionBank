import { requireSupabase } from '@/lib/supabase';
import { nextSm2State } from '@/lib/sm2';

const camel = (row) => ({
  questionId: row.question_id,
  repetitions: row.repetitions,
  intervalDays: row.interval_days,
  easeFactor: Number(row.ease_factor),
  lapseCount: row.lapse_count,
  lastQuality: row.last_quality,
  dueAt: row.due_at,
  lastReviewedAt: row.last_reviewed_at,
});

export async function loadCloudLearningData(userId) {
  const client = requireSupabase();
  const [{ data: states, error: stateError }, { data: notes, error: notesError }, { data: attempts, error: attemptsError }] = await Promise.all([
    client.from('review_states').select('*').eq('user_id', userId),
    client.from('notes').select('question_id,body_md').eq('user_id', userId),
    client.from('attempts').select('*').eq('user_id', userId).order('answered_at', { ascending: false }).limit(500),
  ]);
  if (stateError) throw stateError;
  if (notesError) throw notesError;
  if (attemptsError) throw attemptsError;
  return {
    reviewStates: Object.fromEntries(states.map((row) => [row.question_id, camel(row)])),
    notes: Object.fromEntries(notes.map((row) => [row.question_id, row.body_md])),
    attempts,
  };
}

export async function saveCloudAttempt({ userId, questionId, submission, correct, quality, errorReasons = [], customErrorReason = '', assistanceUsed = null }, previous) {
  const client = requireSupabase();
  const next = nextSm2State(previous, quality);
  const { error: attemptError } = await client.from('attempts').insert({
    user_id: userId,
    question_id: questionId,
    submission,
    is_correct: correct,
          assistance_used: assistanceUsed,
    quality,
    error_reasons: errorReasons,
    custom_error_reason: customErrorReason || null,
  });
  if (attemptError) throw attemptError;
  const { error: stateError } = await client.from('review_states').upsert({
    user_id: userId,
    question_id: questionId,
    repetitions: next.repetitions,
    interval_days: next.intervalDays,
    ease_factor: next.easeFactor,
    lapse_count: next.lapseCount,
    last_quality: next.lastQuality,
    due_at: next.dueAt,
    last_reviewed_at: next.lastReviewedAt,
  });
  if (stateError) throw stateError;
  return next;
}

export async function saveCloudNote(userId, questionId, body) {
  const client = requireSupabase();
  if (!body.trim()) {
    const { error } = await client.from('notes').delete().match({ user_id: userId, question_id: questionId });
    if (error) throw error;
    return;
  }
  const { error } = await client.from('notes').upsert({ user_id: userId, question_id: questionId, body_md: body });
  if (error) throw error;
}
