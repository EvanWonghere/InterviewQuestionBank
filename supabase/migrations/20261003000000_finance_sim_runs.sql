-- Review artifact. Apply to the linked private Supabase project only after owner approval.
begin;
create table public.finance_sim_runs (
  id uuid primary key,
  user_id uuid not null references auth.users(id),
  scenario_id text not null,
  scenario_version integer not null check (scenario_version > 0),
  seed bigint not null check (seed between 0 and 4294967295),
  events jsonb not null check (jsonb_typeof(events) = 'array' and jsonb_array_length(events) between 1 and 300),
  status text not null check (status in ('active', 'complete')),
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index finance_sim_runs_user_updated on public.finance_sim_runs(user_id, updated_at desc);
alter table public.finance_sim_runs enable row level security;
revoke all on public.finance_sim_runs from anon, authenticated;
grant all on public.finance_sim_runs to service_role;
commit;
