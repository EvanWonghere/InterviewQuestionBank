-- Supabase grants new public functions to API roles automatically. Keep only
-- the public grading RPC available to anonymous visitors.
revoke execute on function public.is_app_admin() from anon;
revoke execute on function public.replace_question_tags(uuid, text[]) from anon;

-- The read policies already include administrators. Split the previous ALL
-- policies into write-only policies so authenticated SELECT has one policy.
drop policy categories_admin on public.categories;
create policy categories_admin_insert on public.categories for insert to authenticated
with check ((select private.is_app_admin()));
create policy categories_admin_update on public.categories for update to authenticated
using ((select private.is_app_admin())) with check ((select private.is_app_admin()));
create policy categories_admin_delete on public.categories for delete to authenticated
using ((select private.is_app_admin()));

drop policy questions_admin on public.questions;
create policy questions_admin_insert on public.questions for insert to authenticated
with check ((select private.is_app_admin()));
create policy questions_admin_update on public.questions for update to authenticated
using ((select private.is_app_admin())) with check ((select private.is_app_admin()));
create policy questions_admin_delete on public.questions for delete to authenticated
using ((select private.is_app_admin()));

drop policy tags_admin on public.tags;
create policy tags_admin_insert on public.tags for insert to authenticated
with check ((select private.is_app_admin()));
create policy tags_admin_update on public.tags for update to authenticated
using ((select private.is_app_admin())) with check ((select private.is_app_admin()));
create policy tags_admin_delete on public.tags for delete to authenticated
using ((select private.is_app_admin()));

drop policy question_tags_admin on public.question_tags;
create policy question_tags_admin_insert on public.question_tags for insert to authenticated
with check ((select private.is_app_admin()));
create policy question_tags_admin_update on public.question_tags for update to authenticated
using ((select private.is_app_admin())) with check ((select private.is_app_admin()));
create policy question_tags_admin_delete on public.question_tags for delete to authenticated
using ((select private.is_app_admin()));

drop policy assets_admin on public.question_assets;
create policy assets_admin_insert on public.question_assets for insert to authenticated
with check ((select private.is_app_admin()));
create policy assets_admin_update on public.question_assets for update to authenticated
using ((select private.is_app_admin())) with check ((select private.is_app_admin()));
create policy assets_admin_delete on public.question_assets for delete to authenticated
using ((select private.is_app_admin()));
