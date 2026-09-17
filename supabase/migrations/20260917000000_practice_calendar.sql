-- Daily practice aggregates for the dashboard heatmap.
-- security invoker: attempts_owner RLS limits every row to auth.uid().
create function public.practice_calendar(p_tz text, p_from date, p_to date)
returns table(day date, attempts integer, questions integer, objective integer, correct integer, avg_quality numeric)
language plpgsql stable security invoker set search_path = public, pg_temp as $$
begin
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 400 then
    raise exception 'invalid_range';
  end if;
  return query
  select (a.answered_at at time zone p_tz)::date as day,
         count(*)::integer,
         count(distinct a.question_id)::integer,
         count(a.is_correct)::integer,
         count(*) filter (where a.is_correct)::integer,
         round(avg(a.quality), 2)
  from public.attempts a
  where a.user_id = (select auth.uid())
    -- Coarse UTC bounds (±1 day covers every time zone) keep idx_attempts_user_answered usable.
    and a.answered_at >= (p_from - 1)::timestamptz and a.answered_at < (p_to + 2)::timestamptz
    and (a.answered_at at time zone p_tz)::date between p_from and p_to
  group by 1
  order by 1;
end $$;

create function public.practice_day(p_tz text, p_day date)
returns setof public.attempts
language sql stable security invoker set search_path = public, pg_temp as $$
  select a.* from public.attempts a
  where a.user_id = (select auth.uid())
    and a.answered_at >= (p_day - 1)::timestamptz and a.answered_at < (p_day + 2)::timestamptz
    and (a.answered_at at time zone p_tz)::date = p_day
  order by a.answered_at desc
  limit 200;
$$;

revoke all on function public.practice_calendar(text, date, date), public.practice_day(text, date) from public, anon;
grant execute on function public.practice_calendar(text, date, date), public.practice_day(text, date) to authenticated;
