-- Local review artifact only. Apply explicitly after owner UUID verification.
begin;
create table public.finance_owner (singleton boolean primary key default true check(singleton), user_id uuid not null unique references auth.users(id));
alter table public.finance_owner enable row level security;
create function public.is_finance_owner() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from finance_owner where user_id=auth.uid()) $$;
revoke all on function public.is_finance_owner() from public;
grant execute on function public.is_finance_owner() to authenticated;
create table public.finance_lessons (id text not null, version integer not null check(version>0), content jsonb not null, primary key(id,version));
create table public.finance_answers (question_id text not null, lesson_id text not null, version integer not null, answer integer not null, explanation text not null, primary key(question_id,version), foreign key(lesson_id,version) references finance_lessons(id,version));
create table public.finance_records (id uuid primary key, user_id uuid not null references auth.users(id), kind text not null, lesson_id text not null, version integer not null, payload jsonb not null, created_at timestamptz not null default now(),foreign key(lesson_id,version) references finance_lessons(id,version));
create table public.finance_notes (id uuid primary key, user_id uuid not null references auth.users(id), body jsonb not null, updated_at timestamptz not null default now());
create table public.finance_ai (id uuid primary key, user_id uuid not null references auth.users(id), lesson_id text not null, version integer not null, input jsonb not null, status text not null check(status in ('running','complete','failed')), output text, created_at timestamptz not null default now());
create table public.finance_resources(id text primary key,title text not null,body text not null,source text not null);
create table public.finance_assets(id uuid primary key,user_id uuid not null references auth.users(id),path text unique not null,created_at timestamptz default now());
-- All writes and answer reads go through the authenticated finance handler.
-- Even the owner cannot forge objective results using PostgREST.
alter table public.finance_lessons enable row level security;
alter table public.finance_answers enable row level security;
alter table public.finance_records enable row level security;
alter table public.finance_notes enable row level security;
alter table public.finance_ai enable row level security;
alter table public.finance_resources enable row level security;
alter table public.finance_assets enable row level security;
revoke all on public.finance_owner,public.finance_lessons,public.finance_answers,public.finance_records,public.finance_notes,public.finance_ai,public.finance_resources,public.finance_assets from anon,authenticated;
grant all on public.finance_owner,public.finance_lessons,public.finance_answers,public.finance_records,public.finance_notes,public.finance_ai,public.finance_resources,public.finance_assets to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('finance-private','finance-private',false,5242880,array['image/png','image/jpeg','image/webp']);
-- A restrictive guard also prevents a future broad permissive policy exposing this bucket.
create policy finance_storage_isolation on storage.objects as restrictive for all to anon,authenticated using(bucket_id <> 'finance-private') with check(bucket_id <> 'finance-private');
-- No direct Storage policies: short-lived signed access is issued by the handler.
commit;
