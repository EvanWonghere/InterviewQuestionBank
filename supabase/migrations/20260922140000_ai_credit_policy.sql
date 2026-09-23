-- Per-admin credit policy. Null keeps using the AI_CREDIT_POLICY secret (aggressive when unset).
alter table public.ai_settings add column credit_policy text
 check (credit_policy is null or credit_policy in ('aggressive','balanced','conservative'));
