-- DRAFT ONLY. Requires owner approval before applying to the deployed database.
begin;
alter table public.finance_answers
  add column if not exists kind text not null default 'choice'
    check (kind in ('choice', 'scenario', 'numeric', 'ordering')),
  add column if not exists tolerance numeric
    check (tolerance is null or tolerance >= 0),
  add column if not exists answer_value jsonb;
-- Existing integer answers stay valid. New numeric and ordering questions use answer_value.
commit;
