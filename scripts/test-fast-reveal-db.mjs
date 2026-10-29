import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const admin = '00000000-0000-0000-0000-000000000001';
const member = '00000000-0000-0000-0000-000000000002';
const source = await readFile(new URL('../supabase/migrations/20261028000000_reveal_question.sql', import.meta.url), 'utf8');
const stubs = `create role anon;create role authenticated;create role service_role bypassrls;
create schema auth;create schema private;create schema storage;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;
grant usage on schema public,auth,private,storage to anon,authenticated,service_role;
alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
alter default privileges in schema public grant all on functions to anon,authenticated,service_role;
insert into auth.users values('${admin}'),('${member}');`;

async function createDatabase(sql) {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(stubs);
  for (const name of ['202608290001_cloud_question_bank.sql', '202608290002_harden_grants_and_policies.sql'])
    await db.exec(await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8'));
  await db.exec(sql);
  await db.exec(`insert into app_admins(user_id) values('${admin}');
    insert into categories(id,slug,name) values ('10000000-0000-0000-0000-000000000001','test','test');
    insert into questions(id,category_id,type,title,prompt_md,difficulty,status,visibility) values
    ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','single_choice','public','q','easy','published','public'),
    ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','fill_blank','private','q','easy','published','private'),
    ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','short_answer','draft','q','easy','draft','public'),
    ('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','short_answer','archived','q','easy','archived','public');
    insert into question_solutions(question_id,solution) values
    ('20000000-0000-0000-0000-000000000001','{"correctOptionIds":["b"],"referenceAnswerMd":"public answer","secretExtra":"not returned"}'),
    ('20000000-0000-0000-0000-000000000002','{"acceptedAnswers":{"x":["private answer"]}}'),
    ('20000000-0000-0000-0000-000000000003','{"referenceAnswerMd":"draft answer"}'),
    ('20000000-0000-0000-0000-000000000004','{"referenceAnswerMd":"archived answer"}');`);
  return db;
}
const id = (number) => `20000000-0000-0000-0000-${String(number).padStart(12, '0')}`;
const reveal = (db, questionId) => db.query('select public.reveal_question($1) as result', [questionId]).then(({ rows }) => rows[0].result);
async function identity(db, role, user = '') {
  await db.exec(`reset role;set role ${role};select set_config('request.jwt.claim.sub','${user}',false);`);
}
async function check(db) {
  for (const [role, user] of [['anon', ''], ['authenticated', member]]) {
    await identity(db, role, user);
    const result = await reveal(db, id(1));
    assert.deepEqual(result.correctOptionIds, ['b']);
    assert.equal(result.referenceAnswerMd, 'public answer');
    assert.equal('correct' in result, false);
    assert.equal('secretExtra' in result, false);
    for (const n of [2, 3, 4]) await assert.rejects(() => reveal(db, id(n)), /question not available/);
  }
  await identity(db, 'authenticated', admin);
  assert.deepEqual((await reveal(db, id(2))).acceptedAnswers, { x: ['private answer'] });
  assert.equal((await reveal(db, id(3))).referenceAnswerMd, 'draft answer');
  assert.equal((await reveal(db, id(4))).referenceAnswerMd, 'archived answer');
  await db.exec('reset role');
  assert.equal((await db.query('select count(*)::int as n from attempts')).rows[0].n, 0);
  assert.equal((await db.query('select count(*)::int as n from review_states')).rows[0].n, 0);
}

const db = await createDatabase(source);
await check(db);
await db.close();
console.log('PASS: reveal permissions, answer fields, and no learning writes');

const unsafe = source.replace('and not private.is_app_admin() then', 'and false then');
assert.notEqual(unsafe, source, 'negative probe must change the permission check');
const probe = await createDatabase(unsafe);
const caught = await check(probe).then(() => null, (error) => error);
await probe.close();
assert.ok(caught, 'negative probe did not catch bypassed reveal permissions');
console.log('PROBE OK: bypassed reveal permission was rejected by tests');
