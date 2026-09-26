-- Draft for approval: cloud copy of the stage game's local state, so the administrator's devices
-- share stage and patrol records, boss results, best-star high-water marks, combo bonus XP and
-- announced achievements. Stars, XP, streaks and achievements themselves are still derived in the
-- browser from attempts and review_states (docs/GAMIFICATION.md); this table holds only what cannot
-- be derived. One row per administrator. Visitors and AI members keep the game in local storage.
create table public.game_progress (
 user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
 records jsonb not null default '{}'::jsonb check (jsonb_typeof(records) = 'object'),
 best_stars jsonb not null default '{}'::jsonb check (jsonb_typeof(best_stars) = 'object'),
 bonus_xp integer not null default 0 check (bonus_xp between 0 and 10000000),
 seen_achievements text[] not null default '{}',
 updated_at timestamptz not null default now(),
 check (octet_length(records::text) <= 500000 and octet_length(best_stars::text) <= 200000),
 check (cardinality(seen_achievements) <= 200)
);

-- Merging one record field by field is order-independent, so devices can sync in any order:
-- booleans OR (a stage once cleared stays cleared), numbers take the maximum (best combo, best
-- boss score, run count), strings take the later value (ISO timestamps). Unknown shapes keep the
-- stored value.
create function private.game_merge_record(stored jsonb, incoming jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare result jsonb := coalesce(stored, '{}'::jsonb); k text; a jsonb; b jsonb;
begin
 if jsonb_typeof(incoming) is distinct from 'object' then return result; end if;
 for k, b in select * from jsonb_each(incoming) loop
  a := result -> k;
  if a is null then
   if jsonb_typeof(b) in ('boolean', 'number', 'string') then result := result || jsonb_build_object(k, b); end if;
  elsif jsonb_typeof(a) = 'boolean' and jsonb_typeof(b) = 'boolean' then
   result := result || jsonb_build_object(k, a::boolean or b::boolean);
  elsif jsonb_typeof(a) = 'number' and jsonb_typeof(b) = 'number' then
   result := result || jsonb_build_object(k, greatest(a::numeric, b::numeric));
  elsif jsonb_typeof(a) = 'string' and jsonb_typeof(b) = 'string' then
   result := result || jsonb_build_object(k, greatest(a #>> '{}', b #>> '{}'));
  end if;
 end loop;
 return result;
end; $$;
revoke all on function private.game_merge_record(jsonb, jsonb) from public, anon, authenticated;

-- The only write path. The browser sends its whole local state plus the combo bonus XP earned since
-- its last successful sync (a delta, so two devices' bonuses add up); the row is merged under a lock
-- and returned so the device can adopt the union.
create function public.game_progress_merge(
 p_records jsonb, p_best_stars jsonb, p_bonus_delta integer, p_seen text[]
) returns public.game_progress
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); prog public.game_progress; k text; v jsonb; merged jsonb; stars jsonb;
begin
 if uid is null or not private.is_app_admin() then raise exception 'permission denied for game_progress'; end if;
 if jsonb_typeof(coalesce(p_records, '{}'::jsonb)) <> 'object' or jsonb_typeof(coalesce(p_best_stars, '{}'::jsonb)) <> 'object' then
  raise exception 'game_progress_invalid';
 end if;
 if coalesce(p_bonus_delta, 0) not between 0 and 10000 then raise exception 'game_progress_invalid'; end if;
 if cardinality(coalesce(p_seen, '{}')) > 200 then raise exception 'game_progress_invalid'; end if;
 for k, v in select * from jsonb_each(coalesce(p_records, '{}'::jsonb)) loop
  if k !~ '^(patrol:[0-9]{4}-[0-9]{2}-[0-9]{2}|boss:[A-Za-z0-9_-]{1,64}|[A-Za-z0-9_-]{1,64}:[0-9]{1,3})$' or jsonb_typeof(v) <> 'object' then
   raise exception 'game_progress_invalid';
  end if;
 end loop;
 for k, v in select * from jsonb_each(coalesce(p_best_stars, '{}'::jsonb)) loop
  if k !~ '^[A-Za-z0-9_-]{1,64}$' or jsonb_typeof(v) <> 'number' or v::numeric not in (0, 1, 2, 3) then
   raise exception 'game_progress_invalid';
  end if;
 end loop;
 if exists (select 1 from unnest(coalesce(p_seen, '{}')) s where s !~ '^[a-z0-9-]{1,64}$') then raise exception 'game_progress_invalid'; end if;

 insert into public.game_progress(user_id) values (uid) on conflict (user_id) do nothing;
 select * into prog from public.game_progress where user_id = uid for update;

 merged := prog.records;
 for k, v in select * from jsonb_each(coalesce(p_records, '{}'::jsonb)) loop
  merged := merged || jsonb_build_object(k, private.game_merge_record(merged -> k, v));
 end loop;
 stars := prog.best_stars;
 for k, v in select * from jsonb_each(coalesce(p_best_stars, '{}'::jsonb)) loop
  stars := stars || jsonb_build_object(k, greatest(coalesce((stars ->> k)::int, 0), (v #>> '{}')::int));
 end loop;

 update public.game_progress set
  records = merged,
  best_stars = stars,
  bonus_xp = least(10000000, bonus_xp + coalesce(p_bonus_delta, 0)),
  seen_achievements = (select coalesce(array_agg(distinct s order by s), '{}') from unnest(seen_achievements || coalesce(p_seen, '{}')) s),
  updated_at = now()
 where user_id = uid
 returning * into prog;
 return prog;
end; $$;
revoke all on function public.game_progress_merge(jsonb, jsonb, integer, text[]) from public, anon;
grant execute on function public.game_progress_merge(jsonb, jsonb, integer, text[]) to authenticated;

alter table public.game_progress enable row level security;
create policy game_progress_owner on public.game_progress for select to authenticated
 using (user_id = (select auth.uid()) and private.is_app_admin());
revoke all on public.game_progress from anon, authenticated;
grant select on public.game_progress to authenticated;
grant all on public.game_progress to service_role;
