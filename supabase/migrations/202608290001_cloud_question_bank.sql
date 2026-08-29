create extension if not exists pgcrypto;
create schema if not exists private;

create table public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  category_id uuid not null references public.categories(id),
  type text not null check (type in ('single_choice','multiple_choice','fill_blank','short_answer','algorithm','engineering')),
  title text not null check (length(trim(title)) > 0),
  prompt_md text not null check (length(trim(prompt_md)) > 0),
  difficulty text not null check (difficulty in ('easy','medium','hard')),
  payload jsonb not null default '{}'::jsonb,
  source_title text,
  source_url text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  visibility text not null default 'private' check (visibility in ('private','public')),
  sort_order integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_solutions (
  question_id uuid primary key references public.questions(id) on delete cascade,
  solution jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  kind text not null default 'knowledge' check (kind in ('knowledge','custom')),
  created_at timestamptz not null default now()
);

create table public.question_tags (
  question_id uuid not null references public.questions(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (question_id, tag_id)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  submission jsonb not null default '{}'::jsonb,
  is_correct boolean,
  quality smallint not null check (quality between 0 and 5),
  error_reasons text[] not null default '{}',
  custom_error_reason text,
  answered_at timestamptz not null default now()
);

create table public.review_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  repetitions integer not null default 0 check (repetitions >= 0),
  interval_days integer not null default 0 check (interval_days >= 0),
  ease_factor numeric(5,4) not null default 2.5 check (ease_factor >= 1.3),
  lapse_count integer not null default 0 check (lapse_count >= 0),
  last_quality smallint check (last_quality between 0 and 5),
  due_at timestamptz,
  last_reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table public.notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  body_md text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table public.question_assets (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/png','image/jpeg','image/webp','image/gif')),
  byte_size integer not null check (byte_size > 0 and byte_size <= 5242880),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_questions_public_order on public.questions(status, visibility, sort_order);
create index idx_questions_category on public.questions(category_id);
create index idx_attempts_user_answered on public.attempts(user_id, answered_at desc);
create index idx_attempts_question on public.attempts(question_id);
create index idx_review_states_user_due on public.review_states(user_id, due_at);
create index idx_review_states_user_lapses on public.review_states(user_id, lapse_count desc);

create or replace function private.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_admins where user_id = (select auth.uid())
  );
$$;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select private.is_app_admin(); $$;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger questions_touch before update on public.questions
for each row execute function private.touch_updated_at();
create trigger solutions_touch before update on public.question_solutions
for each row execute function private.touch_updated_at();
create trigger review_states_touch before update on public.review_states
for each row execute function private.touch_updated_at();
create trigger notes_touch before update on public.notes
for each row execute function private.touch_updated_at();

create or replace function public.replace_question_tags(p_question_id uuid, p_tag_names text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_tag_id uuid;
begin
  if not private.is_app_admin() then raise exception 'admin required'; end if;
  delete from public.question_tags where question_id = p_question_id;
  foreach v_name in array coalesce(p_tag_names, '{}'::text[]) loop
    v_name := trim(v_name);
    if v_name = '' then continue; end if;
    insert into public.tags(name) values (v_name)
    on conflict(name) do update set name = excluded.name
    returning id into v_tag_id;
    insert into public.question_tags(question_id, tag_id) values (p_question_id, v_tag_id)
    on conflict do nothing;
  end loop;
end;
$$;

create or replace function private.normalize_fill(p_value text, p_case_sensitive boolean)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when p_case_sensitive
    then regexp_replace(trim(coalesce(p_value, '')), '\s+', ' ', 'g')
    else lower(regexp_replace(trim(coalesce(p_value, '')), '\s+', ' ', 'g'))
  end;
$$;

create or replace function public.grade_question(p_question_id uuid, p_submission jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_question public.questions%rowtype;
  v_solution jsonb;
  v_correct boolean := null;
  v_expected jsonb;
  v_actual jsonb;
  v_blank jsonb;
  v_candidate text;
  v_match boolean;
  v_case_sensitive boolean;
begin
  select * into v_question from public.questions where id = p_question_id;
  if not found then raise exception 'question not found'; end if;
  if not (v_question.status = 'published' and v_question.visibility = 'public')
     and not private.is_app_admin() then
    raise exception 'question not available';
  end if;
  select solution into v_solution from public.question_solutions where question_id = p_question_id;
  v_solution := coalesce(v_solution, '{}'::jsonb);

  if v_question.type = 'single_choice' then
    v_correct := coalesce(p_submission->>'optionId', '') = coalesce(v_solution->'correctOptionIds'->>0, '');
  elsif v_question.type = 'multiple_choice' then
    select coalesce(jsonb_agg(value order by value), '[]'::jsonb) into v_expected
      from jsonb_array_elements_text(coalesce(v_solution->'correctOptionIds', '[]'::jsonb));
    select coalesce(jsonb_agg(value order by value), '[]'::jsonb) into v_actual
      from jsonb_array_elements_text(coalesce(p_submission->'optionIds', '[]'::jsonb));
    v_correct := v_expected = v_actual;
  elsif v_question.type = 'fill_blank' then
    v_correct := true;
    v_case_sensitive := coalesce((v_solution->>'caseSensitive')::boolean, false);
    for v_blank in select value from jsonb_array_elements(coalesce(v_question.payload->'blanks', '[]'::jsonb)) loop
      v_match := false;
      for v_candidate in select value from jsonb_array_elements_text(
        coalesce(v_solution->'acceptedAnswers'->(v_blank->>'id'), '[]'::jsonb)
      ) loop
        if private.normalize_fill(p_submission->'answers'->>(v_blank->>'id'), v_case_sensitive)
           = private.normalize_fill(v_candidate, v_case_sensitive) then
          v_match := true;
        end if;
      end loop;
      if not v_match then v_correct := false; end if;
    end loop;
  end if;

  return jsonb_build_object(
    'correct', v_correct,
    'referenceAnswerMd', coalesce(v_solution->>'referenceAnswerMd', ''),
    'rubricMd', coalesce(v_solution->>'rubricMd', ''),
    'explanationMd', coalesce(v_solution->>'explanationMd', '')
  );
end;
$$;

alter table public.app_admins enable row level security;
alter table public.categories enable row level security;
alter table public.questions enable row level security;
alter table public.question_solutions enable row level security;
alter table public.tags enable row level security;
alter table public.question_tags enable row level security;
alter table public.attempts enable row level security;
alter table public.review_states enable row level security;
alter table public.notes enable row level security;
alter table public.question_assets enable row level security;

create policy categories_read on public.categories for select to anon, authenticated using (true);
create policy categories_admin on public.categories for all to authenticated using ((select private.is_app_admin())) with check ((select private.is_app_admin()));
create policy questions_read on public.questions for select to anon, authenticated
using ((status = 'published' and visibility = 'public') or (select private.is_app_admin()));
create policy questions_admin on public.questions for all to authenticated using ((select private.is_app_admin())) with check ((select private.is_app_admin()));
create policy solutions_admin on public.question_solutions for all to authenticated using ((select private.is_app_admin())) with check ((select private.is_app_admin()));
create policy tags_read on public.tags for select to anon, authenticated using (true);
create policy tags_admin on public.tags for all to authenticated using ((select private.is_app_admin())) with check ((select private.is_app_admin()));
create policy question_tags_read on public.question_tags for select to anon, authenticated
using (exists (select 1 from public.questions q where q.id = question_id));
create policy question_tags_admin on public.question_tags for all to authenticated using ((select private.is_app_admin())) with check ((select private.is_app_admin()));
create policy attempts_owner on public.attempts for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy review_states_owner on public.review_states for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy notes_owner on public.notes for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy assets_read on public.question_assets for select to anon, authenticated
using ((select private.is_app_admin()) or exists (
  select 1 from public.questions q where q.id = question_id and q.status = 'published' and q.visibility = 'public'
));
create policy assets_admin on public.question_assets for all to authenticated using ((select private.is_app_admin())) with check ((select private.is_app_admin()));

revoke all on public.app_admins from anon, authenticated;
grant select on public.categories, public.questions, public.tags, public.question_tags, public.question_assets to anon, authenticated;
grant select, insert, update, delete on public.categories, public.questions, public.question_solutions, public.tags, public.question_tags, public.question_assets to authenticated;
grant select, insert, update, delete on public.attempts, public.review_states, public.notes to authenticated;
revoke execute on function public.is_app_admin() from public;
revoke execute on function public.replace_question_tags(uuid, text[]) from public;
revoke execute on function public.grade_question(uuid, jsonb) from public;
grant execute on function public.is_app_admin() to authenticated;
grant execute on function public.replace_question_tags(uuid, text[]) to authenticated;
grant execute on function public.grade_question(uuid, jsonb) to anon, authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('question-assets', 'question-assets', false, 5242880, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict(id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy question_assets_storage_admin_insert on storage.objects for insert to authenticated
with check (bucket_id = 'question-assets' and (select private.is_app_admin()));
create policy question_assets_storage_admin_update on storage.objects for update to authenticated
using (bucket_id = 'question-assets' and (select private.is_app_admin()));
create policy question_assets_storage_admin_delete on storage.objects for delete to authenticated
using (bucket_id = 'question-assets' and (select private.is_app_admin()));
create policy question_assets_storage_read on storage.objects for select to anon, authenticated
using (bucket_id = 'question-assets' and exists (
  select 1 from public.question_assets a
  join public.questions q on q.id = a.question_id
  where a.storage_path = name and ((q.status = 'published' and q.visibility = 'public') or (select private.is_app_admin()))
));

-- Bootstrap after the first GitHub login:
-- insert into public.app_admins(user_id) values ('<auth.users.id>');
