import { requireSupabase } from '@/lib/supabase';

export async function loadPracticeCalendar({ timeZone, from, to }) {
  const { data, error } = await requireSupabase().rpc('practice_calendar', { p_tz: timeZone, p_from: from, p_to: to });
  if (error) throw error;
  return data ?? [];
}

export async function loadPracticeDay({ timeZone, day }) {
  const { data, error } = await requireSupabase().rpc('practice_day', { p_tz: timeZone, p_day: day }).select('*, ai_evaluation:ai_evaluations(score)');
  if (error) throw error;
  return data ?? [];
}

export async function loadFirstAttemptAt(userId) {
  const { data, error } = await requireSupabase().from('attempts').select('answered_at').eq('user_id', userId).order('answered_at', { ascending: true }).limit(1).maybeSingle();
  if (error) throw error;
  return data?.answered_at ?? null;
}
