-- Provenance for AI-drafted questions, so the UI can show what was already added and link back.
-- origin_kind: 'follow_up' (from an answered follow-up, origin_evaluation_id) or
-- 'weakness' (targeted at an aggregated weakness, origin_weakness_tag). Existing RLS on questions applies unchanged.
alter table public.questions
  add column origin_kind text check (origin_kind in ('follow_up','weakness')),
  add column origin_evaluation_id uuid references public.ai_evaluations(id) on delete set null,
  add column origin_weakness_tag text check (char_length(origin_weakness_tag) <= 40);
create index questions_origin_evaluation on public.questions(origin_evaluation_id) where origin_evaluation_id is not null;
create index questions_origin_weakness on public.questions(lower(origin_weakness_tag)) where origin_weakness_tag is not null;
