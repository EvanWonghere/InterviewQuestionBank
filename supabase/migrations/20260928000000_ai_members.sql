-- Draft for approval: AI members. People who are not administrators can use named AI features with a
-- daily request limit. Membership grants AI only: questions, answers, assets, categories, tags and the
-- music cloud library stay administrator-only. Only the music practice room is open to members for now;
-- widening the scopes check also needs the matching lab/quiz RPCs and pages changed.
create table public.ai_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 scopes text[] not null default array['music'] check (cardinality(scopes) > 0 and scopes <@ array['music']),
 daily_limit integer not null default 30 check (daily_limit between 1 and 500),
 expires_at timestamptz,
 note text check (note is null or length(note) <= 200),
 created_at timestamptz not null default now()
);
-- Requests counted per member per Beijing calendar day.
create table public.ai_member_usage (
 user_id uuid not null references public.ai_members(user_id) on delete cascade,
 day date not null,
 requests integer not null default 0 check (requests >= 0),
 primary key (user_id, day)
);

alter table public.ai_members enable row level security;
alter table public.ai_member_usage enable row level security;
create policy ai_members_read_own on public.ai_members for select to authenticated using (user_id = (select auth.uid()));
create policy ai_member_usage_read_own on public.ai_member_usage for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.ai_members, public.ai_member_usage from anon, authenticated;
grant select on public.ai_members, public.ai_member_usage to authenticated;
grant all on public.ai_members, public.ai_member_usage to service_role;

-- True for administrators, and for members whose membership covers the scope and has not expired.
create function private.ai_allowed(p_user uuid, p_scope text)
returns boolean language sql stable security definer set search_path = '' as $$
 select exists (select 1 from public.app_admins where user_id = p_user)
  or exists (select 1 from public.ai_members m where m.user_id = p_user and p_scope = any (m.scopes)
             and (m.expires_at is null or m.expires_at > now()));
$$;
revoke all on function private.ai_allowed(uuid, text) from public, anon, authenticated;
-- The same check for the signed-in user only, for row-level security (it cannot ask about anyone else).
create function private.ai_allowed_self(p_scope text)
returns boolean language sql stable security definer set search_path = '' as $$
 select private.ai_allowed((select auth.uid()), p_scope);
$$;

-- What the signed-in user may use, for the pages and the Edge Function (called with the user's own token).
create function public.ai_access()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); m public.ai_members; used integer;
begin
 if uid is null then return jsonb_build_object('admin', false, 'scopes', '[]'::jsonb); end if;
 if exists (select 1 from public.app_admins where user_id = uid) then
  return jsonb_build_object('admin', true, 'scopes', '["quiz","labs","music"]'::jsonb);
 end if;
 select * into m from public.ai_members where user_id = uid and (expires_at is null or expires_at > now());
 if not found then return jsonb_build_object('admin', false, 'scopes', '[]'::jsonb); end if;
 select requests into used from public.ai_member_usage where user_id = uid and day = (now() at time zone 'Asia/Shanghai')::date;
 return jsonb_build_object('admin', false, 'scopes', to_jsonb(m.scopes), 'dailyLimit', m.daily_limit,
  'usedToday', coalesce(used, 0), 'expiresAt', m.expires_at);
end $$;
revoke all on function public.ai_access() from public, anon;
grant execute on function public.ai_access() to authenticated;

-- Every model call already passes through ai_take_rate (10 per minute). Members additionally need a
-- current membership and are held to their daily limit; administrators are unchanged.
create or replace function public.ai_take_rate(p_user uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.ai_settings; m public.ai_members; today date := (now() at time zone 'Asia/Shanghai')::date;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));
 insert into ai_settings(user_id) values(p_user) on conflict do nothing;
 select * into s from ai_settings where user_id=p_user for update;
 if s.window_start < now()-interval '1 minute' then
  update ai_settings set window_start=now(),request_count=1 where user_id=p_user;
 elsif s.request_count >= 10 then raise exception 'rate_limit';
 else update ai_settings set request_count=request_count+1 where user_id=p_user;
 end if;
 if not exists (select 1 from app_admins where user_id = p_user) then
  select * into m from ai_members where user_id = p_user and (expires_at is null or expires_at > now());
  if not found then raise exception 'admin_required'; end if;
  insert into ai_member_usage(user_id, day) values (p_user, today) on conflict do nothing;
  update ai_member_usage set requests = requests + 1 where user_id = p_user and day = today and requests < m.daily_limit;
  if not found then raise exception 'daily_limit'; end if;
 end if;
end $$;

-- The music RPCs accept members with the music scope (bodies otherwise as in 20260925000000_music_ai.sql).
create or replace function public.music_begin(p_user uuid, p_request uuid, p_kind text, p_subject text,
 p_version text, p_hash text, p_body text, p_model text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare previous public.music_messages;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));
 if not private.ai_allowed(p_user, 'music') then raise exception 'admin_required'; end if;
 update public.music_messages set status = 'failed', body = '请求已超时，请核对历史后手动重试'
  where user_id = p_user and status = 'running' and created_at < now() - interval '150 seconds';
 select * into previous from public.music_messages
  where user_id = p_user and request_id = p_request and role = 'assistant';
 if found then
  if previous.kind <> p_kind or previous.subject_id <> p_subject
     or previous.subject_version <> p_version or previous.context_hash <> p_hash then
   raise exception 'request_context_conflict';
  end if;
  return jsonb_build_object('duplicate', true, 'message', to_jsonb(previous));
 end if;
 if exists (select 1 from public.music_messages where user_id = p_user and status = 'running') then
  raise exception 'generation_busy';
 end if;
 perform public.ai_take_rate(p_user);
 insert into public.music_messages(user_id, request_id, kind, subject_id, subject_version, context_hash, role, body, status, model) values
  (p_user, p_request, p_kind, p_subject, p_version, p_hash, 'user', p_body, 'complete', p_model),
  (p_user, p_request, p_kind, p_subject, p_version, p_hash, 'assistant', '', 'running', p_model);
 return jsonb_build_object('duplicate', false);
end; $$;

create or replace function public.music_clear(p_user uuid, p_kind text, p_subject text)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare removed integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));
 if not private.ai_allowed(p_user, 'music') then raise exception 'admin_required'; end if;
 delete from public.music_messages m
  where m.user_id = p_user and m.kind = p_kind and m.subject_id = p_subject
    and not exists (select 1 from public.music_messages r
      where r.user_id = p_user and r.request_id = m.request_id and r.status = 'running');
 get diagnostics removed = row_count;
 return removed;
end; $$;

drop policy music_messages_read on public.music_messages;
create policy music_messages_read on public.music_messages for select to authenticated
 using (user_id = (select auth.uid()) and (select private.ai_allowed_self('music')));

-- Grant a friend access (run by the owner, after they have signed in once):
-- insert into public.ai_members(user_id, daily_limit, note) values ('<auth.users.id>', 30, 'friend');
