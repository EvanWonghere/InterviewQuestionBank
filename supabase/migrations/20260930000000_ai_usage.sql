-- Draft for approval: token usage of every model call, and the administrator's prices, so API 设置
-- can show where the money goes (cache hits, output and reasoning share per model) and the quiz can
-- show what each answer cost. Rows are written only by the ai-tutor function (service role);
-- a user reads their own rows and administrators read all, including AI members' music usage.
create table public.ai_usage (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 action text not null check (length(action) between 1 and 40),
 request_id uuid,
 provider text not null check (length(provider) between 1 and 20),
 model text not null check (length(model) between 1 and 80),
 input_tokens integer not null default 0 check (input_tokens >= 0),
 cached_tokens integer not null default 0 check (cached_tokens >= 0 and cached_tokens <= input_tokens),
 output_tokens integer not null default 0 check (output_tokens >= 0),
 reasoning_tokens integer not null default 0 check (reasoning_tokens >= 0 and reasoning_tokens <= output_tokens),
 -- Cost at the prices saved when the call was made; null when the model had no price.
 cost numeric(14, 6) check (cost is null or cost >= 0)
);
create index ai_usage_user_time on public.ai_usage(user_id, created_at desc);
create index ai_usage_time on public.ai_usage(created_at desc);

alter table public.ai_usage enable row level security;
create policy ai_usage_read on public.ai_usage for select to authenticated
 using (user_id = (select auth.uid()) or private.is_app_admin());
revoke all on public.ai_usage from anon, authenticated;
grant select on public.ai_usage to authenticated;
grant all on public.ai_usage to service_role;

-- Prices per million tokens by model name, in the administrator's currency:
-- { "<model>": { "input": n, "cached": n, "output": n } }. Validated again by the function.
alter table public.ai_settings add column pricing jsonb
 check (pricing is null or (jsonb_typeof(pricing) = 'object' and octet_length(pricing::text) <= 4000));
