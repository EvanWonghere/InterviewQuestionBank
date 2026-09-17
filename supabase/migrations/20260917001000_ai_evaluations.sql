-- Structured AI evaluations, follow-up chains and generated reports.
-- Writes happen only through the ai-tutor Edge Function (service_role) after JWT + admin checks.
create table public.ai_evaluations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 question_id uuid not null references public.questions(id) on delete cascade,
 question_version text not null,
 request_id uuid not null,
 root_id uuid references public.ai_evaluations(id) on delete cascade,
 parent_id uuid references public.ai_evaluations(id) on delete cascade,
 round smallint not null check(round between 1 and 4),
 mode text not null check(mode in ('practice','interview')),
 session_id uuid,
 submission jsonb not null default '{}'::jsonb,
 follow_up_question text,
 is_correct boolean,
 result jsonb,
 score smallint check(score between 0 and 100),
 suggested_rating text check(suggested_rating in ('again','hard','good','easy')),
 weakness_tags text[] not null default '{}',
 status text not null check(status in ('running','complete','failed')),
 model text not null,
 created_at timestamptz not null default now(),
 unique(user_id,request_id)
);
create index ai_evaluations_user_created on public.ai_evaluations(user_id,created_at desc);
create index ai_evaluations_session on public.ai_evaluations(user_id,session_id) where session_id is not null;
create index ai_evaluations_root on public.ai_evaluations(root_id);

create table public.ai_reports (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('interview','weakness')),
 session_id uuid,
 request_id uuid not null,
 result jsonb,
 status text not null check(status in ('running','complete','failed')),
 model text not null,
 created_at timestamptz not null default now(),
 unique(user_id,request_id)
);
create index ai_reports_user_kind on public.ai_reports(user_id,kind,created_at desc);

alter table public.attempts add column ai_evaluation_id uuid references public.ai_evaluations(id) on delete set null;

alter table public.ai_evaluations enable row level security;
alter table public.ai_reports enable row level security;
create policy ai_evaluations_read on public.ai_evaluations for select to authenticated
 using(user_id=(select auth.uid()) and (select private.is_app_admin()));
create policy ai_reports_read on public.ai_reports for select to authenticated
 using(user_id=(select auth.uid()) and (select private.is_app_admin()));
revoke all on public.ai_evaluations,public.ai_reports from anon,authenticated;
grant select on public.ai_evaluations,public.ai_reports to authenticated;
grant all on public.ai_evaluations,public.ai_reports to service_role;

-- Total rounds include the initial answer: practice = 1 + 3 follow-ups, interview = 1 + 2.
create function public.ai_begin_evaluation(p_user uuid,p_question uuid,p_version text,p_request uuid,p_mode text,p_session uuid,p_parent uuid,p_submission jsonb,p_correct boolean,p_model text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare e public.ai_evaluations; p public.ai_evaluations;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into e from ai_evaluations where user_id=p_user and request_id=p_request;
 if found then return jsonb_build_object('duplicate',true,'evaluation',to_jsonb(e)); end if;
 update ai_evaluations set status='failed' where user_id=p_user and status='running' and created_at < now()-interval '90 seconds';
 if exists(select 1 from ai_evaluations where user_id=p_user and question_id=p_question and status='running') then raise exception 'generation_busy'; end if;
 if p_parent is not null then
  select * into p from ai_evaluations where id=p_parent and user_id=p_user;
  if not found or p.question_id<>p_question or p.status<>'complete' or p.mode<>p_mode
   or jsonb_typeof(p.result->'followUp') is distinct from 'object'
   or p.round >= (case p_mode when 'interview' then 3 else 4 end)
   or exists(select 1 from ai_evaluations where parent_id=p.id and status<>'failed') then
   raise exception 'followup_invalid';
  end if;
 end if;
 perform ai_take_rate(p_user);
 insert into ai_evaluations(user_id,question_id,question_version,request_id,root_id,parent_id,round,mode,session_id,submission,follow_up_question,is_correct,status,model)
 values(p_user,p_question,p_version,p_request,coalesce(p.root_id,p.id),p.id,coalesce(p.round,0)+1,p_mode,
  case when p.id is null then p_session else p.session_id end,p_submission,p.result->'followUp'->>'question',
  case when p.id is null then p_correct else p.is_correct end,'running',p_model)
 returning * into e;
 return jsonb_build_object('duplicate',false,'evaluation',to_jsonb(e));
end $$;

create function public.ai_begin_report(p_user uuid,p_kind text,p_session uuid,p_request uuid,p_model text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.ai_reports;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into r from ai_reports where user_id=p_user and request_id=p_request;
 if found then return jsonb_build_object('duplicate',true,'report',to_jsonb(r)); end if;
 update ai_reports set status='failed' where user_id=p_user and status='running' and created_at < now()-interval '90 seconds';
 if exists(select 1 from ai_reports where user_id=p_user and kind=p_kind and status='running') then raise exception 'generation_busy'; end if;
 perform ai_take_rate(p_user);
 insert into ai_reports(user_id,kind,session_id,request_id,status,model)
 values(p_user,p_kind,p_session,p_request,'running',p_model) returning * into r;
 return jsonb_build_object('duplicate',false,'report',to_jsonb(r));
end $$;

revoke all on function public.ai_begin_evaluation(uuid,uuid,text,uuid,text,uuid,uuid,jsonb,boolean,text),public.ai_begin_report(uuid,text,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.ai_begin_evaluation(uuid,uuid,text,uuid,text,uuid,uuid,jsonb,boolean,text),public.ai_begin_report(uuid,text,uuid,uuid,text) to service_role;

-- Heatmap gains AI score and interview markers; the return type changes, so recreate.
drop function public.practice_calendar(text,date,date);
create function public.practice_calendar(p_tz text, p_from date, p_to date)
returns table(day date, attempts integer, questions integer, objective integer, correct integer, avg_quality numeric, ai_avg_score numeric, interviews integer)
language plpgsql stable security invoker set search_path = public, pg_temp as $$
begin
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 400 then
    raise exception 'invalid_range';
  end if;
  return query
  with daily as (
    select (a.answered_at at time zone p_tz)::date as d,
           count(*)::integer as n,
           count(distinct a.question_id)::integer as qs,
           count(a.is_correct)::integer as obj,
           (count(*) filter (where a.is_correct))::integer as ok,
           round(avg(a.quality), 2) as quality,
           round(avg(e.score), 1) as ai_score
    from public.attempts a
    left join public.ai_evaluations e on e.id = a.ai_evaluation_id
    where a.user_id = (select auth.uid())
      -- Coarse UTC bounds (±1 day covers every time zone) keep idx_attempts_user_answered usable.
      and a.answered_at >= (p_from - 1)::timestamptz and a.answered_at < (p_to + 2)::timestamptz
      and (a.answered_at at time zone p_tz)::date between p_from and p_to
    group by 1
  ), sessions as (
    select (r.created_at at time zone p_tz)::date as d, count(*)::integer as n
    from public.ai_reports r
    where r.user_id = (select auth.uid()) and r.kind = 'interview' and r.status = 'complete'
      and r.created_at >= (p_from - 1)::timestamptz and r.created_at < (p_to + 2)::timestamptz
      and (r.created_at at time zone p_tz)::date between p_from and p_to
    group by 1
  )
  select coalesce(daily.d, sessions.d), coalesce(daily.n, 0), coalesce(daily.qs, 0), coalesce(daily.obj, 0), coalesce(daily.ok, 0),
         daily.quality, daily.ai_score, coalesce(sessions.n, 0)
  from daily full join sessions on sessions.d = daily.d
  order by 1;
end $$;
revoke all on function public.practice_calendar(text, date, date) from public, anon;
grant execute on function public.practice_calendar(text, date, date) to authenticated;
