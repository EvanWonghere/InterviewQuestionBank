import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const sql = readFileSync(new URL('../supabase/migrations/20261013000000_gbits_study_pack.sql', import.meta.url), 'utf8');
const data = JSON.parse(readFileSync(new URL('../public/questions.json', import.meta.url), 'utf8'));
const db = new PGlite();
try {
  // Isolated contract fixture; production RLS/Auth are intentionally outside this pack test.
  await db.exec(`
    create table categories(id uuid primary key default gen_random_uuid(),slug text unique);
    create table questions(id uuid primary key default gen_random_uuid(),legacy_id text unique,category_id uuid references categories(id),type text,title text,prompt_md text,difficulty text,payload jsonb,source_title text,source_url text,status text,visibility text,sort_order int);
    create table question_solutions(question_id uuid primary key references questions(id),solution jsonb);
    create table tags(id uuid primary key default gen_random_uuid(),name text unique);
    create table question_tags(question_id uuid references questions(id),tag_id uuid references tags(id),primary key(question_id,tag_id));
    create table attempts(id int primary key,submission text);
    insert into attempts values(1,'existing learning evidence');
  `);
  for (const category of data.categories) await db.query('insert into categories(slug) values($1)', [category.id]);
  await db.exec(sql);
  const counts = await db.query('select (select count(*) from questions)::int as questions,(select count(*) from question_solutions)::int as solutions');
  assert.deepEqual(counts.rows[0], { questions: 42, solutions: 42 });
  await db.exec("update questions set title='human edited title' where legacy_id='gbits-001'; update question_solutions set solution='{\"referenceAnswerMd\":\"human edited answer\"}' where question_id=(select id from questions where legacy_id='gbits-001')");
  const before = JSON.stringify((await db.query('select q.*,s.solution from questions q join question_solutions s on s.question_id=q.id order by legacy_id')).rows);
  await db.exec(sql);
  const after = JSON.stringify((await db.query('select q.*,s.solution from questions q join question_solutions s on s.question_id=q.id order by legacy_id')).rows);
  assert.equal(after, before);
  assert.equal((await db.query('select submission from attempts')).rows[0].submission, 'existing learning evidence');
  console.log('PASS: isolated migration inserts 42 questions/solutions and repeat application preserves human edits and attempts');
} finally { await db.close(); }
