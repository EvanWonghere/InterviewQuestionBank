-- Run with `supabase test db` after `supabase start`.
begin;
select plan(6);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'admin@example.test'),
  ('00000000-0000-0000-0000-000000000002', 'learner@example.test')
on conflict (id) do nothing;
insert into public.app_admins (user_id)
values ('00000000-0000-0000-0000-000000000001')
on conflict do nothing;

insert into public.categories (id, slug, name, sort_order)
values ('20000000-0000-0000-0000-000000000001', 'rls-test', 'RLS test', 9999)
on conflict (id) do update set name = excluded.name;
insert into public.questions (id, legacy_id, category_id, title, prompt_md, type, difficulty, visibility, status, created_by)
values
  ('10000000-0000-0000-0000-000000000001', 'rls-public', '20000000-0000-0000-0000-000000000001', 'Public', 'Visible', 'short_answer', 'easy', 'public', 'published', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', 'rls-private', '20000000-0000-0000-0000-000000000001', 'Private', 'Hidden', 'short_answer', 'easy', 'private', 'draft', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;
insert into public.question_solutions (question_id, solution)
values ('10000000-0000-0000-0000-000000000001', '{"referenceAnswer":"secret"}'::jsonb)
on conflict (question_id) do nothing;
insert into public.question_assets (id, question_id, storage_path, mime_type, byte_size, created_by)
values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'private/test.png', 'image/png', 10, '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

set local role anon;
select is((select count(*)::integer from public.questions where id in ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002')), 1, 'anonymous sees only published public questions');
select throws_ok($$select * from public.question_solutions$$, '42501', null, 'anonymous cannot read raw solutions');
select is((select count(*)::integer from public.question_assets where id = '30000000-0000-0000-0000-000000000001'), 0, 'anonymous cannot discover private image metadata');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
select is((with changed as (update public.questions set title = 'Nope' where id = '10000000-0000-0000-0000-000000000001' returning id) select count(*)::integer from changed), 0, 'ordinary users cannot edit questions');
select lives_ok($$insert into public.notes (user_id, question_id, body_md) values ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'mine') on conflict do nothing$$, 'users can write their own notes');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select lives_ok($$update public.questions set title = 'Admin updated' where id = '10000000-0000-0000-0000-000000000002'$$, 'administrator can edit private questions');
reset role;

select * from finish();
rollback;
