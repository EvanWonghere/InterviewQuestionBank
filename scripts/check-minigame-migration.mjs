import { PGlite } from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(path.join(root, 'supabase/migrations/20261027000000_minigame_client_pack.sql'), 'utf8');
const data = JSON.parse(readFileSync(path.join(root, 'public/questions.json'), 'utf8'));
async function createDB({ missingCategory = null } = {}) {
  const db = new PGlite();
  await db.exec(`
    create table public.categories(id uuid primary key default gen_random_uuid(), slug text unique);
    create table public.questions(id uuid primary key default gen_random_uuid(),legacy_id text unique,category_id uuid references public.categories(id),type text,title text,prompt_md text,difficulty text,payload jsonb,source_title text,source_url text,status text,visibility text,sort_order int);
    create table public.question_solutions(question_id uuid primary key references public.questions(id),solution jsonb);
    create table public.tags(id uuid primary key default gen_random_uuid(),name text unique);
    create table public.question_tags(question_id uuid references public.questions(id),tag_id uuid references public.tags(id),primary key(question_id,tag_id));
    create table public.attempts(id int primary key,question_id uuid references public.questions(id),evidence text);
    create table public.review_states(id int primary key,question_id uuid references public.questions(id),evidence text);
    create table public.notes(id int primary key,question_id uuid references public.questions(id),evidence text);
  `);
  for (const c of data.categories) if (c.id !== missingCategory) await db.query('insert into public.categories(slug) values($1)', [c.id]);
  return db;
}
async function snapshot(db) {
  const queries = [
    'select * from public.questions order by legacy_id',
    'select s.question_id,s.solution from public.question_solutions s order by s.question_id',
    'select t.question_id,t.tag_id from public.question_tags t order by t.question_id,t.tag_id',
    'select * from public.tags order by name',
    'select * from public.attempts order by id',
    'select * from public.review_states order by id',
    'select * from public.notes order by id',
  ];
  const result = [];
  for (const q of queries) result.push((await db.query(q)).rows);
  return result;
}
async function existingSnapshot(db) {
  const ids = "select id from public.questions where legacy_id in ('minigame-001','minigame-002')";
  const queries = [
    `select * from public.questions where id in (${ids}) order by legacy_id`,
    `select * from public.question_solutions where question_id in (${ids}) order by question_id`,
    `select * from public.question_tags where question_id in (${ids}) order by question_id,tag_id`,
    "select * from public.tags where name='existing human tag'",
    `select * from public.attempts where question_id in (${ids}) order by id`,
    `select * from public.review_states where question_id in (${ids}) order by id`,
    `select * from public.notes where question_id in (${ids}) order by id`,
  ];
  return Promise.all(queries.map(async (query) => (await db.query(query)).rows));
}
const db = await createDB();
try {
  await db.exec(`
    insert into public.questions(legacy_id,category_id,type,title,prompt_md,difficulty,payload,status,visibility,sort_order)
      select 'minigame-001',id,'short_answer','existing human title','existing','medium','{}','draft','private',17 from public.categories where slug='computer-networks';
    insert into public.questions(legacy_id,category_id,type,title,prompt_md,difficulty,payload,status,visibility,sort_order)
      select 'minigame-002',id,'short_answer','existing without solution','existing','medium','{}','draft','private',18 from public.categories where slug='design-patterns';
    insert into public.question_solutions(question_id,solution)
      select id,'{"referenceAnswerMd":"existing human answer"}' from public.questions where legacy_id='minigame-001';
    insert into public.tags(name) values('existing human tag');
    insert into public.question_tags(question_id,tag_id)
      select q.id,t.id from public.questions q cross join public.tags t where q.legacy_id='minigame-001' and t.name='existing human tag';
    insert into public.attempts select 1,id,'existing attempt' from public.questions where legacy_id='minigame-001';
    insert into public.review_states select 1,id,'existing schedule' from public.questions where legacy_id='minigame-001';
    insert into public.notes select 1,id,'existing note' from public.questions where legacy_id='minigame-001';
  `);
  const beforeExisting = await existingSnapshot(db);
  await db.exec(sql);
  assert.deepEqual(await existingSnapshot(db), beforeExisting);
  assert.equal((await db.query('select count(*)::int as n from public.questions')).rows[0].n, 8);
  assert.equal((await db.query('select count(*)::int as n from public.question_solutions')).rows[0].n, 7);
  assert.equal((await db.query("select count(*)::int as n from public.questions where legacy_id like 'minigame-%' and status='published' and visibility='public'")).rows[0].n, 6);
  const initial = await snapshot(db);
  const existing = (await db.query("select title,status,visibility from public.questions where legacy_id='minigame-001'")).rows[0];
  assert.deepEqual(existing, { title: 'existing human title', status: 'draft', visibility: 'private' });
  assert.equal((await db.query("select count(*)::int as n from public.question_solutions s join public.questions q on q.id=s.question_id where q.legacy_id='minigame-002'")).rows[0].n, 0);
  await db.exec(sql);
  assert.deepEqual(await snapshot(db), initial);
  await db.exec("update public.questions set title='fault injected' where legacy_id='minigame-001'");
  const corrupted = await snapshot(db);
  assert.throws(() => assert.deepEqual(corrupted, initial));
  console.log('PASS: existing IDs/answers/tags/progress preserved, missing solution untouched, repeat is idempotent; destructive mutation detected.');
} finally { await db.close(); }
const missing = await createDB({ missingCategory: 'rendering-graphics' });
try {
  await assert.rejects(missing.exec(sql));
  assert.equal((await missing.query('select count(*)::int as n from public.questions')).rows[0].n, 0);
  console.log('PASS: missing category rolls the whole pack back with zero inserted questions.');
} finally { await missing.close(); }
