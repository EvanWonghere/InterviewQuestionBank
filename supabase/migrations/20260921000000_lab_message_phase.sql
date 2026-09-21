-- Draft for approval: records which learning phase each lab message belongs to, so a fresh
-- predict-phase request cannot replay explain-phase answers back into the coach context.
-- Existing rows default to 'explain', which keeps them out of predict-phase context.
alter table public.lab_messages
 add column phase text not null default 'explain' check(phase in ('predict','explain','variant'));

drop function if exists public.lab_begin(uuid,text,integer,uuid,text,text);
create function public.lab_begin(p_user uuid,p_lab text,p_version integer,p_request uuid,p_body text,p_model text,p_phase text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare previous public.lab_messages;
begin
 if p_phase is null or p_phase not in ('predict','explain','variant') then raise exception 'lab_phase_invalid';end if;
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
 insert into public.lab_messages(user_id,request_id,lab_id,lab_version,role,body,status,model,phase) values
 (p_user,p_request,p_lab,p_version,'user',p_body,'complete',p_model,p_phase),
 (p_user,p_request,p_lab,p_version,'assistant','','running',p_model,p_phase);
 return jsonb_build_object('duplicate',false);
end;$$;
revoke all on function public.lab_begin(uuid,text,integer,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.lab_begin(uuid,text,integer,uuid,text,text,text) to service_role;
