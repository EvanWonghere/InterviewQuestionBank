-- Additive: old attempt assistance remains unknown (NULL).
alter table public.attempts add column assistance_used boolean;
create table public.ai_settings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 base_url text not null default '', model text not null default '',
 window_start timestamptz not null default now(), request_count integer not null default 0
);
create table public.ai_conversations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 question_id uuid not null references public.questions(id) on delete cascade,
 question_version text not null,
 unique(user_id,question_id), unique(id,user_id)
);
create table public.ai_messages (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null,
 user_id uuid not null,
 request_id uuid not null,
 role text not null check(role in ('user','assistant')),
 body text not null default '',
 phase text not null check(phase in ('hint','review')),
 status text not null check(status in ('complete','running','stopped','failed')),
 model text not null,
 created_at timestamptz not null default now(),
 unique(user_id,request_id,role),
 foreign key(conversation_id,user_id) references public.ai_conversations(id,user_id) on delete cascade
);
create index ai_messages_thread on public.ai_messages(conversation_id,created_at);
alter table public.ai_settings enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
create policy ai_settings_read on public.ai_settings for select to authenticated
 using(user_id=(select auth.uid()) and (select private.is_app_admin()));
create policy ai_conversations_read on public.ai_conversations for select to authenticated
 using(user_id=(select auth.uid()) and (select private.is_app_admin()));
create policy ai_messages_read on public.ai_messages for select to authenticated
 using(user_id=(select auth.uid()) and (select private.is_app_admin()));
revoke all on public.ai_settings,public.ai_conversations,public.ai_messages from anon,authenticated;
grant select on public.ai_settings,public.ai_conversations,public.ai_messages to authenticated;
grant all on public.ai_settings,public.ai_conversations,public.ai_messages to service_role;

-- Service-only RPCs. The Edge Function validates JWT + current admin membership first.
create function public.ai_take_rate(p_user uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.ai_settings;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));
 insert into ai_settings(user_id) values(p_user) on conflict do nothing;
 select * into s from ai_settings where user_id=p_user for update;
 if s.window_start < now()-interval '1 minute' then
  update ai_settings set window_start=now(),request_count=1 where user_id=p_user;
 elsif s.request_count >= 10 then raise exception 'rate_limit';
 else update ai_settings set request_count=request_count+1 where user_id=p_user;
 end if;
end $$;
create function public.ai_begin(p_user uuid,p_question uuid,p_version text,p_request uuid,p_body text,p_phase text,p_model text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.ai_conversations; m public.ai_messages;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into m from ai_messages where user_id=p_user and request_id=p_request and role='assistant';
 if found then return jsonb_build_object('duplicate',true,'message',to_jsonb(m)); end if;
 insert into ai_conversations(user_id,question_id,question_version) values(p_user,p_question,p_version)
 on conflict(user_id,question_id) do nothing;
 select * into c from ai_conversations where user_id=p_user and question_id=p_question for update;
 update ai_messages set status='failed' where conversation_id=c.id and status='running' and created_at < now()-interval '90 seconds';
 if exists(select 1 from ai_messages where conversation_id=c.id and status='running') then raise exception 'generation_busy'; end if;
 perform ai_take_rate(p_user);
 insert into ai_messages(conversation_id,user_id,request_id,role,body,phase,status,model)
 values(c.id,p_user,p_request,'user',p_body,p_phase,'complete',p_model);
 insert into ai_messages(conversation_id,user_id,request_id,role,phase,status,model)
 values(c.id,p_user,p_request,'assistant',p_phase,'running',p_model) returning * into m;
 return jsonb_build_object('duplicate',false,'conversation',to_jsonb(c),'message',to_jsonb(m));
end $$;
create function public.ai_clear(p_user uuid,p_question uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 update ai_messages set status='failed' where user_id=p_user and status='running' and created_at < now()-interval '90 seconds';
 if exists(select 1 from ai_messages m join ai_conversations c on c.id=m.conversation_id
 where c.user_id=p_user and c.question_id=p_question and m.status='running') then raise exception 'generation_busy'; end if;
 delete from ai_conversations where user_id=p_user and question_id=p_question;
end $$;
revoke all on function public.ai_take_rate(uuid),public.ai_begin(uuid,uuid,text,uuid,text,text,text),public.ai_clear(uuid,uuid) from public,anon,authenticated;
grant execute on function public.ai_take_rate(uuid),public.ai_begin(uuid,uuid,text,uuid,text,text,text),public.ai_clear(uuid,uuid) to service_role;

create function public.ai_append_note(p_user uuid,p_question uuid,p_body text,p_expected text) returns text
language plpgsql security definer set search_path=public,pg_temp as $$
declare old_body text; new_body text;
begin
 if length(trim(p_body))=0 or length(p_body)>60000 then raise exception 'invalid_note'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||p_question::text,0));
 insert into notes(user_id,question_id,body_md) values(p_user,p_question,'') on conflict do nothing;
 select body_md into old_body from notes where user_id=p_user and question_id=p_question for update;
 if coalesce(old_body,'') <> coalesce(p_expected,'') then raise exception 'note_conflict'; end if;
 new_body=concat_ws(E'\n\n',nullif(old_body,''),'### AI巩固笔记',p_body);
 update notes set body_md=new_body where user_id=p_user and question_id=p_question;
 return new_body;
end $$;
revoke all on function public.ai_append_note(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.ai_append_note(uuid,uuid,text,text) to service_role;
