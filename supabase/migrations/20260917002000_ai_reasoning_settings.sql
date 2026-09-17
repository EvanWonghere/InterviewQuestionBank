-- Per-admin thinking mode (DeepSeek official API only; ignored for other providers).
-- Existing rows get the new default 'high'.
alter table public.ai_settings add column reasoning_effort text not null default 'high'
 check (reasoning_effort in ('none','low','high','max'));

-- Model calls may now wait up to 90s; a running row is only presumed abandoned after 150s,
-- so a slow but healthy generation is not marked failed underneath its own request.
-- Bodies are unchanged apart from the interval; create or replace keeps existing grants.
create or replace function public.ai_begin(p_user uuid,p_question uuid,p_version text,p_request uuid,p_body text,p_phase text,p_model text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.ai_conversations; m public.ai_messages;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into m from ai_messages where user_id=p_user and request_id=p_request and role='assistant';
 if found then return jsonb_build_object('duplicate',true,'message',to_jsonb(m)); end if;
 insert into ai_conversations(user_id,question_id,question_version) values(p_user,p_question,p_version)
 on conflict(user_id,question_id) do nothing;
 select * into c from ai_conversations where user_id=p_user and question_id=p_question for update;
 update ai_messages set status='failed' where conversation_id=c.id and status='running' and created_at < now()-interval '150 seconds';
 if exists(select 1 from ai_messages where conversation_id=c.id and status='running') then raise exception 'generation_busy'; end if;
 perform ai_take_rate(p_user);
 insert into ai_messages(conversation_id,user_id,request_id,role,body,phase,status,model)
 values(c.id,p_user,p_request,'user',p_body,p_phase,'complete',p_model);
 insert into ai_messages(conversation_id,user_id,request_id,role,phase,status,model)
 values(c.id,p_user,p_request,'assistant',p_phase,'running',p_model) returning * into m;
 return jsonb_build_object('duplicate',false,'conversation',to_jsonb(c),'message',to_jsonb(m));
end $$;

create or replace function public.ai_clear(p_user uuid,p_question uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 update ai_messages set status='failed' where user_id=p_user and status='running' and created_at < now()-interval '150 seconds';
 if exists(select 1 from ai_messages m join ai_conversations c on c.id=m.conversation_id
 where c.user_id=p_user and c.question_id=p_question and m.status='running') then raise exception 'generation_busy'; end if;
 delete from ai_conversations where user_id=p_user and question_id=p_question;
end $$;

create or replace function public.ai_begin_evaluation(p_user uuid,p_question uuid,p_version text,p_request uuid,p_mode text,p_session uuid,p_parent uuid,p_submission jsonb,p_correct boolean,p_model text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare e public.ai_evaluations; p public.ai_evaluations;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into e from ai_evaluations where user_id=p_user and request_id=p_request;
 if found then return jsonb_build_object('duplicate',true,'evaluation',to_jsonb(e)); end if;
 update ai_evaluations set status='failed' where user_id=p_user and status='running' and created_at < now()-interval '150 seconds';
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

create or replace function public.ai_begin_report(p_user uuid,p_kind text,p_session uuid,p_request uuid,p_model text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.ai_reports;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into r from ai_reports where user_id=p_user and request_id=p_request;
 if found then return jsonb_build_object('duplicate',true,'report',to_jsonb(r)); end if;
 update ai_reports set status='failed' where user_id=p_user and status='running' and created_at < now()-interval '150 seconds';
 if exists(select 1 from ai_reports where user_id=p_user and kind=p_kind and status='running') then raise exception 'generation_busy'; end if;
 perform ai_take_rate(p_user);
 insert into ai_reports(user_id,kind,session_id,request_id,status,model)
 values(p_user,p_kind,p_session,p_request,'running',p_model) returning * into r;
 return jsonb_build_object('duplicate',false,'report',to_jsonb(r));
end $$;
