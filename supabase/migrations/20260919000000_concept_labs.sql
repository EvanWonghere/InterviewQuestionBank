-- Draft for approval: independent ConceptLab records. Does not alter quiz scores.
create table public.lab_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 lab_id text not null check(length(lab_id) between 1 and 80),
 lab_version integer not null check(lab_version>0),
 flags jsonb not null default '{}' check(octet_length(flags::text)<1024),
 updated_at timestamptz not null default now(),
 primary key(user_id,lab_id,lab_version)
);
alter table public.lab_progress enable row level security;
create policy lab_progress_read on public.lab_progress for select to authenticated using(user_id=auth.uid() and private.is_app_admin());
revoke all on public.lab_progress from anon,authenticated;
grant select on public.lab_progress to authenticated;
grant all on public.lab_progress to service_role;
create table public.lab_runs (
 user_id uuid not null references auth.users(id) on delete cascade,
 id uuid not null,
 lab_id text not null check(length(lab_id) between 1 and 80),
 lab_version integer not null check(lab_version>0),
 payload jsonb not null check(octet_length(payload::text)<30000),
 created_at timestamptz not null default now(),
 primary key(user_id,id)
);
create table public.lab_messages (
 user_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null,
 lab_id text not null check(length(lab_id) between 1 and 80),
 lab_version integer not null check(lab_version>0),
 role text not null check(role in ('user','assistant')),
 body text not null default '' check(length(body)<=60000),
 status text not null check(status in ('running','complete','failed')),
 model text not null,
 created_at timestamptz not null default now(),
 primary key(user_id,request_id,role)
);
create index lab_messages_history on public.lab_messages(user_id,lab_id,lab_version,created_at);
alter table public.lab_runs enable row level security;
alter table public.lab_messages enable row level security;
create policy lab_runs_read on public.lab_runs for select to authenticated using(user_id=auth.uid() and private.is_app_admin());
create policy lab_messages_read on public.lab_messages for select to authenticated using(user_id=auth.uid() and private.is_app_admin());
revoke all on public.lab_runs,public.lab_messages from anon,authenticated;
grant select on public.lab_runs,public.lab_messages to authenticated;
grant all on public.lab_runs,public.lab_messages to service_role;
create function public.lab_begin(p_user uuid,p_lab text,p_version integer,p_request uuid,p_body text,p_model text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare previous public.lab_messages;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 if not exists(select 1 from public.app_admins where user_id=p_user) then raise exception 'admin_required';end if;
 update public.lab_messages set status='failed',body='请求已超时，请核对历史后手动重试' where user_id=p_user and status='running' and created_at<now()-interval '150 seconds';
 select * into previous from public.lab_messages where user_id=p_user and request_id=p_request and role='assistant';
 if found then
  if previous.lab_id<>p_lab or previous.lab_version<>p_version then raise exception 'request_context_conflict';end if;
  return jsonb_build_object('duplicate',true,'message',to_jsonb(previous));
 end if;
 if exists(select 1 from public.lab_messages where user_id=p_user and status='running') then raise exception 'generation_busy';end if;
 perform public.ai_take_rate(p_user);
 insert into public.lab_messages(user_id,request_id,lab_id,lab_version,role,body,status,model) values
 (p_user,p_request,p_lab,p_version,'user',p_body,'complete',p_model),
 (p_user,p_request,p_lab,p_version,'assistant','','running',p_model);
 return jsonb_build_object('duplicate',false);
end;$$;
revoke all on function public.lab_begin(uuid,text,integer,uuid,text,text) from public,anon,authenticated;
grant execute on function public.lab_begin(uuid,text,integer,uuid,text,text) to service_role;
