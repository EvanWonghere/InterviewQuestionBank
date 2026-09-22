-- ConceptLab mutable run and progress synchronization.
-- The experiment inputs and observations remain immutable.  Only the learner's
-- explanation, assistance metadata, and explicit progress flags are edited.
-- Keep the origin of a pending coach request with its server history.  This
-- lets a recovered response remain visibly attached to the run/draft that
-- created it after the browser has moved to another attempt.
alter table public.lab_messages
  add column attempt_id uuid,
  add column draft_id text check(draft_id is null or length(draft_id) between 1 and 200);

drop function if exists public.lab_begin(uuid,text,integer,uuid,text,text,text);
create function public.lab_begin(
  p_user uuid,
  p_lab text,
  p_version integer,
  p_request uuid,
  p_body text,
  p_model text,
  p_phase text,
  p_attempt uuid default null,
  p_draft text default null
)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare previous public.lab_messages;
begin
 if p_phase is null or p_phase not in ('predict','explain','variant') then raise exception 'lab_phase_invalid';end if;
 if p_draft is not null and (length(p_draft) < 1 or length(p_draft) > 200) then raise exception 'lab_draft_invalid';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 if not exists(select 1 from public.app_admins where user_id=p_user) then raise exception 'admin_required';end if;
 update public.lab_messages set status='failed',body='请求已超时，请核对历史后手动重试' where user_id=p_user and status='running' and created_at<now()-interval '150 seconds';
 select * into previous from public.lab_messages where user_id=p_user and request_id=p_request and role='assistant';
 if found then
  if previous.lab_id<>p_lab or previous.lab_version<>p_version
     or previous.attempt_id is distinct from p_attempt
     or previous.draft_id is distinct from p_draft then
    raise exception 'request_context_conflict';
  end if;
  return jsonb_build_object('duplicate',true,'message',to_jsonb(previous));
 end if;
 if exists(select 1 from public.lab_messages where user_id=p_user and status='running') then raise exception 'generation_busy';end if;
 perform public.ai_take_rate(p_user);
 insert into public.lab_messages(user_id,request_id,lab_id,lab_version,role,body,status,model,phase,attempt_id,draft_id) values
 (p_user,p_request,p_lab,p_version,'user',p_body,'complete',p_model,p_phase,p_attempt,p_draft),
 (p_user,p_request,p_lab,p_version,'assistant','','running',p_model,p_phase,p_attempt,p_draft);
 return jsonb_build_object('duplicate',false);
end;$$;

revoke all on function public.lab_begin(uuid,text,integer,uuid,text,text,text,uuid,text) from public,anon,authenticated;
grant execute on function public.lab_begin(uuid,text,integer,uuid,text,text,text,uuid,text) to service_role;

alter table public.lab_runs
  add column revision integer not null default 1,
  add column updated_at timestamptz not null default now();
alter table public.lab_runs
  add constraint lab_runs_revision_positive check (revision > 0);

alter table public.lab_progress
  add column revision integer not null default 1;
alter table public.lab_progress
  add constraint lab_progress_revision_positive check (revision > 0);

create or replace function public.lab_sync(
  p_user uuid,
  p_lab text,
  p_version integer,
  p_runs jsonb default '[]'::jsonb,
  p_flags jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  item jsonb;
  payload jsonb;
  flags_payload jsonb;
  run_id uuid;
  base_revision integer;
  flags_base_revision integer;
  run_row public.lab_runs;
  progress_row public.lab_progress;
  merged_payload jsonb;
  run_conflicts jsonb := '[]'::jsonb;
  applied jsonb := '[]'::jsonb;
  flag_conflict jsonb := null;
  flags_revision integer;
  flags_updated_at timestamptz;
  now_value timestamptz := now();
begin
  if not exists(select 1 from public.app_admins where user_id=p_user) then
    raise exception 'admin_required';
  end if;
  if p_lab is null or length(p_lab) < 1 or length(p_lab) > 80 or p_version is null or p_version < 1 then
    raise exception 'lab_context_invalid';
  end if;
  if jsonb_typeof(coalesce(p_runs,'[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_runs,'[]'::jsonb)) > 20 then
    raise exception 'lab_runs_invalid';
  end if;

  -- Serialize all writes for one learner.  The row locks below then make the
  -- baseRevision comparisons and the writes a single compare-and-swap.
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));

  -- First pass only validates and locks the rows.  If any item conflicts, no
  -- item in this request is written; the caller can choose a version explicitly.
  for item in select value from jsonb_array_elements(coalesce(p_runs,'[]'::jsonb)) loop
    if jsonb_typeof(item) <> 'object' then raise exception 'lab_run_invalid'; end if;
    payload := case when item ? 'payload' then item->'payload' else item end;
    if jsonb_typeof(payload) <> 'object'
       or (coalesce(item->>'id',payload->>'id')) !~* '^[0-9a-f-]{36}$'
       or payload->>'id' <> coalesce(item->>'id',payload->>'id')
       or jsonb_typeof(payload->'parameters') <> 'object'
       or jsonb_typeof(payload->'observation') <> 'object'
       or payload->'observation'->>'labId' <> p_lab
       or (payload->'observation'->>'labVersion')::integer <> p_version
       or jsonb_typeof(payload->'explanation') <> 'string'
       or jsonb_typeof(payload->'assisted') <> 'boolean'
       or octet_length(payload::text) > 24000 then
      raise exception 'lab_run_invalid';
    end if;
    run_id := (coalesce(item->>'id',payload->>'id'))::uuid;
    base_revision := coalesce(nullif(item->>'baseRevision','')::integer,0);
    if base_revision < 0 then raise exception 'lab_revision_invalid'; end if;
    select * into run_row from public.lab_runs
      where user_id=p_user and id=run_id for update;
    if found then
      if run_row.lab_id <> p_lab or run_row.lab_version <> p_version then
        run_conflicts := run_conflicts || jsonb_build_array(jsonb_build_object(
          'id',run_id,'reason','context','payload',run_row.payload,
          'revision',run_row.revision,'updatedAt',run_row.updated_at));
      elsif run_row.revision <> base_revision then
        run_conflicts := run_conflicts || jsonb_build_array(jsonb_build_object(
          'id',run_id,'reason','revision','payload',run_row.payload,
          'revision',run_row.revision,'updatedAt',run_row.updated_at));
      elsif (run_row.payload - array['explanation','assisted','assistanceKnown','assistanceSources','revision','dirty'])
            <> (payload - array['explanation','assisted','assistanceKnown','assistanceSources','revision','dirty']) then
        run_conflicts := run_conflicts || jsonb_build_array(jsonb_build_object(
          'id',run_id,'reason','immutable','payload',run_row.payload,
          'revision',run_row.revision,'updatedAt',run_row.updated_at));
      end if;
    end if;
  end loop;

  if p_flags is not null then
    flags_payload := case when jsonb_typeof(p_flags)='object' and p_flags ? 'flags' then p_flags->'flags' else p_flags end;
    flags_base_revision := case when jsonb_typeof(p_flags)='object' and p_flags ? 'flags'
      then coalesce(nullif(p_flags->>'baseRevision','')::integer,0) else 0 end;
    if jsonb_typeof(flags_payload) <> 'object' or flags_base_revision < 0
       or exists(select 1 from jsonb_each(flags_payload) f
         where f.key not in ('seen','hint','independent','variant') or jsonb_typeof(f.value) <> 'boolean') then
      raise exception 'lab_flags_invalid';
    end if;
    select * into progress_row from public.lab_progress
      where user_id=p_user and lab_id=p_lab and lab_version=p_version for update;
    if found then
      if progress_row.revision <> flags_base_revision then
        flag_conflict := jsonb_build_object('flags',progress_row.flags,'revision',progress_row.revision,'updatedAt',progress_row.updated_at);
      end if;
    end if;
  end if;

  if jsonb_array_length(run_conflicts) > 0 or flag_conflict is not null then
    return jsonb_build_object(
      'ok',false,
      'conflict',true,
      'runs','[]'::jsonb,
      'conflicts',run_conflicts,
      'flagsConflict',flag_conflict
    );
  end if;

  for item in select value from jsonb_array_elements(coalesce(p_runs,'[]'::jsonb)) loop
    payload := case when item ? 'payload' then item->'payload' else item end;
    run_id := (coalesce(item->>'id',payload->>'id'))::uuid;
    base_revision := coalesce(nullif(item->>'baseRevision','')::integer,0);
    select * into run_row from public.lab_runs
      where user_id=p_user and id=run_id for update;
    if found then
      merged_payload := run_row.payload || jsonb_build_object(
        'explanation',payload->'explanation',
        'assisted',payload->'assisted',
        'assistanceKnown',coalesce(payload->'assistanceKnown',run_row.payload->'assistanceKnown'),
        'assistanceSources',coalesce(payload->'assistanceSources',run_row.payload->'assistanceSources')
      );
      update public.lab_runs
        set payload=merged_payload, revision=run_row.revision+1, updated_at=now_value
        where user_id=p_user and id=run_id;
      applied := applied || jsonb_build_array(jsonb_build_object(
        'id',run_id,'payload',merged_payload,'revision',run_row.revision+1,'updatedAt',now_value));
    else
      merged_payload := payload - array['revision','dirty'];
      insert into public.lab_runs(user_id,id,lab_id,lab_version,payload,revision,created_at,updated_at)
        values(p_user,run_id,p_lab,p_version,merged_payload,1,now_value,now_value);
      applied := applied || jsonb_build_array(jsonb_build_object(
        'id',run_id,'payload',merged_payload,'revision',1,'updatedAt',now_value));
    end if;
  end loop;

  if p_flags is not null then
    select * into progress_row from public.lab_progress
      where user_id=p_user and lab_id=p_lab and lab_version=p_version for update;
    if found then
      update public.lab_progress set flags=flags_payload,revision=progress_row.revision+1,updated_at=now_value
        where user_id=p_user and lab_id=p_lab and lab_version=p_version;
      flags_revision := progress_row.revision+1;
    else
      insert into public.lab_progress(user_id,lab_id,lab_version,flags,revision,updated_at)
        values(p_user,p_lab,p_version,flags_payload,1,now_value);
      flags_revision := 1;
    end if;
    flags_updated_at := now_value;
  end if;

  return jsonb_build_object(
    'ok',true,
    'runs',applied,
    'flags',case when p_flags is null then null else flags_payload end,
    'flagsRevision',flags_revision,
    'updatedAt',flags_updated_at
  );
end;
$$;

revoke all on function public.lab_sync(uuid,text,integer,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.lab_sync(uuid,text,integer,jsonb,jsonb) to service_role;
