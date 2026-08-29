import { pullGist } from '@/lib/gistApi';
import { mergeLegacyData, legacyStatusToReview } from '@/lib/legacyMigration';
import { requireSupabase } from '@/lib/supabase';

function persistedState(key, field) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}')?.state?.[field] ?? {};
  } catch {
    return {};
  }
}

export async function collectLegacyData() {
  const localProgress = persistedState('unity-quiz-progress', 'progress');
  const localNotes = persistedState('iqb:notes', 'notes');
  let gistData = {};
  let sync = {};
  try { sync = JSON.parse(localStorage.getItem('quiz-sync-config') ?? '{}')?.state ?? {}; } catch { /* no-op */ }
  if (sync.token && sync.gistId) {
    try { gistData = await pullGist(sync.token, sync.gistId); } catch { gistData = {}; }
  }
  return mergeLegacyData(localProgress, localNotes, gistData);
}

export async function importLegacyData(userId, legacy) {
  const client = requireSupabase();
  const { data: questions, error } = await client.from('questions').select('id,legacy_id').not('legacy_id', 'is', null);
  if (error) throw error;
  const ids = new Map(questions.map((question) => [question.legacy_id, question.id]));
  const now = new Date();
  const states = Object.entries(legacy.progress).flatMap(([legacyId, status]) => {
    const questionId = ids.get(legacyId);
    if (!questionId) return [];
    const state = legacyStatusToReview(status, now);
    return [{
      user_id: userId,
      question_id: questionId,
      repetitions: state.repetitions,
      interval_days: state.intervalDays,
      ease_factor: state.easeFactor,
      lapse_count: state.lapseCount,
      last_quality: state.lastQuality,
      due_at: state.dueAt,
      last_reviewed_at: now.toISOString(),
    }];
  });
  const notes = Object.entries(legacy.notes).flatMap(([legacyId, body]) => {
    const questionId = ids.get(legacyId);
    return questionId && body.trim() ? [{ user_id: userId, question_id: questionId, body_md: body }] : [];
  });
  if (states.length) {
    const { error: stateError } = await client.from('review_states').upsert(states);
    if (stateError) throw stateError;
  }
  if (notes.length) {
    const { error: notesError } = await client.from('notes').upsert(notes);
    if (notesError) throw notesError;
  }
  localStorage.removeItem('quiz-sync-config');
  localStorage.setItem('iqb:migration-version', '2');
  return { states: states.length, notes: notes.length, unmatched: Object.keys(legacy.progress).length - states.length };
}

export function downloadLegacyBackup(legacy) {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...legacy }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `interview-bank-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
