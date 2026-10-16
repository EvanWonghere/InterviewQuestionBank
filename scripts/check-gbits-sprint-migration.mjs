import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const root = decodeURIComponent(new URL('..', import.meta.url).pathname).replace(/\/$/, '');
const old = readFileSync(`${root}/supabase/migrations/20261013000000_gbits_study_pack.sql`, 'utf8');
const sql = readFileSync(`${root}/supabase/migrations/20261015000000_gbits_sprint_pack.sql`, 'utf8');
const data = JSON.parse(readFileSync(`${root}/public/questions.json`, 'utf8'));
const db = new PGlite();
try {
  await db.exec(`
    create table categories(id uuid primary key default gen_random_uuid(),slug text unique);
    create table questions(id uuid primary key default gen_random_uuid(),legacy_id text unique,category_id uuid references categories(id),type text,title text,prompt_md text,difficulty text,payload jsonb,source_title text,source_url text,status text,visibility text,sort_order int);
    create table question_solutions(question_id uuid primary key references questions(id),solution jsonb);
    create table tags(id uuid primary key default gen_random_uuid(),name text unique);
    create table question_tags(question_id uuid references questions(id),tag_id uuid references tags(id),primary key(question_id,tag_id));
    create table attempts(id int primary key,submission text);
    create table review_states(id int primary key,evidence text);
    create table notes(id int primary key,body text);
    insert into attempts values(1,'existing attempt'); insert into review_states values(1,'existing schedule'); insert into notes values(1,'human note');
  `);
  for (const category of data.categories) await db.query('insert into categories(slug) values($1)', [category.id]);
  await db.exec(old);
  await db.exec(sql);
  assert.deepEqual((await db.query('select (select count(*) from questions)::int as questions,(select count(*) from question_solutions)::int as solutions')).rows[0], { questions: 120, solutions: 120 });
  await db.exec(`update questions set title='human title' where legacy_id in ('gbits-001','gbits-043'); update question_solutions set solution='{"referenceAnswerMd":"human answer"}' where question_id in (select id from questions where legacy_id in ('gbits-001','gbits-043'));`);
  const snapshot = async () => JSON.stringify((await db.query('select q.*,s.solution from questions q join question_solutions s on s.question_id=q.id order by legacy_id')).rows);
  const before = await snapshot();
  await db.exec(sql);
  assert.equal(await snapshot(), before);
  for (const [table, column, value] of [['attempts','submission','existing attempt'],['review_states','evidence','existing schedule'],['notes','body','human note']]) assert.equal((await db.query(`select ${column} from ${table}`)).rows[0][column], value);
  // A temporary corrupt migration must be caught by the same sentinel snapshot.
  await db.exec(sql + "\nupdate questions set title='clobbered' where legacy_id='gbits-043';");
  const corrupted = await snapshot();
  assert.throws(() => assert.equal(corrupted, before));
  console.log('PASS: 42 old + 78 new question/solution pairs; repeat preserves edits, notes, attempts and schedules; destructive mutation detected (isolated DB only)');
} finally { await db.close(); }
