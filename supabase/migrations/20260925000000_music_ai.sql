-- Draft for approval: administrator AI for the blog's music practice room (/study/music/).
-- Independent of quiz and ConceptLab records; practice scores stay in the browser.
-- The 'arrangement' kind and payload column are reserved for the later arrangement
-- proposals, so that phase needs no further migration.
create table public.music_messages (
 user_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null,
 kind text not null check (kind in ('lesson','homework','composition','arrangement')),
 subject_id text not null check (subject_id ~ '^[A-Za-z0-9_-]{1,100}$'),
 subject_version text not null check (length(subject_version) between 1 and 80),
 context_hash text not null check (context_hash ~ '^[0-9a-f]{64}$'),
 role text not null check (role in ('user','assistant')),
 body text not null default '' check (length(body) <= 60000),
 payload jsonb check (payload is null or octet_length(payload::text) < 65536),
 status text not null check (status in ('running','complete','failed')),
 model text not null,
 provider text,
 model_tier text,
 pedagogy_action text,
 fallback_used boolean,
 created_at timestamptz not null default now(),
 primary key (user_id, request_id, role)
);
create index music_messages_history on public.music_messages(user_id, kind, subject_id, created_at desc);
-- At most one music generation in flight per user, even if two begins race past the check.
create unique index music_messages_one_running on public.music_messages(user_id)
 where status = 'running' and role = 'assistant';

alter table public.music_messages enable row level security;
create policy music_messages_read on public.music_messages for select to authenticated
 using (user_id = auth.uid() and private.is_app_admin());
revoke all on public.music_messages from anon, authenticated;
grant select on public.music_messages to authenticated;
grant all on public.music_messages to service_role;

create function public.music_begin(p_user uuid, p_request uuid, p_kind text, p_subject text,
 p_version text, p_hash text, p_body text, p_model text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare previous public.music_messages;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));
 if not exists (select 1 from public.app_admins where user_id = p_user) then raise exception 'admin_required'; end if;
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
revoke all on function public.music_begin(uuid,uuid,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.music_begin(uuid,uuid,text,text,text,text,text,text) to service_role;

-- Deletes finished requests (both rows) for one lesson or work; a running request stays.
create function public.music_clear(p_user uuid, p_kind text, p_subject text)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare removed integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));
 if not exists (select 1 from public.app_admins where user_id = p_user) then raise exception 'admin_required'; end if;
 delete from public.music_messages m
  where m.user_id = p_user and m.kind = p_kind and m.subject_id = p_subject
    and not exists (select 1 from public.music_messages r
      where r.user_id = p_user and r.request_id = m.request_id and r.status = 'running');
 get diagnostics removed = row_count;
 return removed;
end; $$;
revoke all on function public.music_clear(uuid,text,text) from public, anon, authenticated;
grant execute on function public.music_clear(uuid,text,text) to service_role;
