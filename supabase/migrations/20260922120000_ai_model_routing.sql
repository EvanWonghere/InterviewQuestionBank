-- Routing metadata for the learning coach. Nullable so older rows stay valid.
-- The edge function writes these after generation; begin still stores a placeholder model.
alter table public.ai_messages
  add column provider text,
  add column model_tier text,
  add column pedagogy_action text,
  add column fallback_used boolean;

alter table public.ai_messages
  add constraint ai_messages_provider_known check (provider is null or provider in ('openai', 'deepseek')),
  add constraint ai_messages_tier_known check (model_tier is null or model_tier in ('fast', 'default', 'reasoning')),
  add constraint ai_messages_pedagogy_known check (pedagogy_action is null or pedagogy_action in (
    'ANSWER_DIRECTLY', 'GIVE_HINT', 'ASK_DIAGNOSTIC_QUESTION', 'EXPLAIN_CONCEPT', 'SHOW_EXAMPLE',
    'CHECK_STUDENT_ANSWER', 'CORRECT_MISCONCEPTION', 'GUIDE_STEP_BY_STEP', 'CHALLENGE_STUDENT', 'SIMPLIFY_EXPLANATION'
  ));

alter table public.lab_messages
  add column provider text,
  add column model_tier text,
  add column pedagogy_action text,
  add column fallback_used boolean;

alter table public.lab_messages
  add constraint lab_messages_provider_known check (provider is null or provider in ('openai', 'deepseek')),
  add constraint lab_messages_tier_known check (model_tier is null or model_tier in ('fast', 'default', 'reasoning')),
  add constraint lab_messages_pedagogy_known check (pedagogy_action is null or pedagogy_action in (
    'ANSWER_DIRECTLY', 'GIVE_HINT', 'ASK_DIAGNOSTIC_QUESTION', 'EXPLAIN_CONCEPT', 'SHOW_EXAMPLE',
    'CHECK_STUDENT_ANSWER', 'CORRECT_MISCONCEPTION', 'GUIDE_STEP_BY_STEP', 'CHALLENGE_STUDENT', 'SIMPLIFY_EXPLANATION'
  ));
