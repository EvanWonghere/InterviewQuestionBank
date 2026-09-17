import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db=new PGlite();
const a='00000000-0000-0000-0000-000000000001', b='00000000-0000-0000-0000-000000000002';
const q='10000000-0000-0000-0000-000000000001';
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
create schema auth;create schema private;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create table public.app_admins(user_id uuid primary key references auth.users);
create function private.is_app_admin() returns boolean language sql stable security definer as $$select exists(select 1 from public.app_admins where user_id=auth.uid())$$;
create table public.questions(id uuid primary key);
create table public.attempts(id uuid primary key default gen_random_uuid(),user_id uuid not null,question_id uuid not null,submission jsonb not null default '{}',is_correct boolean,quality smallint not null default 0,error_reasons text[] not null default '{}',custom_error_reason text,answered_at timestamptz not null default now());
alter table public.attempts enable row level security;
create policy attempts_owner on public.attempts for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,insert on public.attempts to authenticated;
create table public.notes(user_id uuid,question_id uuid,body_md text,unique(user_id,question_id));
grant usage on schema public,auth,private to anon,authenticated,service_role;
insert into auth.users values('${a}'),('${b}'); insert into app_admins values('${a}');insert into questions values('${q}');`);
await db.exec(await readFile(new URL('../supabase/migrations/20260916000000_ai_tutor.sql',import.meta.url),'utf8'));
const req=n=>`20000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const begin=n=>db.query(`select ai_begin($1,$2,'version',$3,'why','hint','model') as result`,[a,q,req(n)]);
const first=(await begin(1)).rows[0].result;
assert.equal(first.duplicate,false);
assert.equal((await begin(1)).rows[0].result.duplicate,true);
await assert.rejects(()=>begin(2),/generation_busy/);
await assert.rejects(()=>db.query('select ai_clear($1,$2)',[a,q]),/generation_busy/);
await db.exec(`update ai_messages set status='complete' where role='assistant';`);
for(let i=2;i<=10;i++){await begin(i);await db.exec(`update ai_messages set status='complete' where role='assistant';`);}
await assert.rejects(()=>begin(11),/rate_limit/);
await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${b}',false);`);
assert.equal((await db.query('select * from ai_messages')).rows.length,0);
await assert.rejects(()=>db.query(`insert into ai_settings(user_id) values('${b}')`),/permission denied/);
await assert.rejects(()=>begin(12),/permission denied/);
await db.exec(`select set_config('request.jwt.claim.sub','${a}',false);`);
assert.equal((await db.query('select * from ai_messages')).rows.length,20);
await db.exec('reset role;');
await db.exec(`delete from app_admins;set role authenticated;`);
assert.equal((await db.query('select * from ai_messages')).rows.length,0);
await db.exec('reset role;set role anon;');
await assert.rejects(()=>db.query('select * from ai_settings'),/permission denied/);
await db.exec('reset role;');
assert.match((await db.query('select ai_append_note($1,$2,$3,$4) as body',[a,q,'new note',''])).rows[0].body,/new note/);
await assert.rejects(()=>db.query('select ai_append_note($1,$2,$3,$4)',[a,q,'overwrite','stale']),/note_conflict/);
assert.equal((await db.query('select * from notes')).rows.length,1);
await db.query('select ai_clear($1,$2)',[a,q]);
assert.equal((await db.query('select * from ai_messages')).rows.length,0);
assert.equal((await db.query('select * from notes')).rows.length,1);
assert.equal((await db.query(`select column_default from information_schema.columns where table_name='attempts' and column_name='assistance_used'`)).rows[0].column_default,null);

// Practice calendar: owner-only aggregates grouped by the caller's time zone.
await db.exec(await readFile(new URL('../supabase/migrations/20260917000000_practice_calendar.sql',import.meta.url),'utf8'));
await db.query(`insert into attempts(user_id,question_id,is_correct,quality,answered_at) values
 ($1,$3,true,5,'2026-09-16T23:30:00Z'),($1,$3,false,0,'2026-09-17T01:00:00Z'),($1,$3,null,4,'2026-09-17T02:00:00Z'),($2,$3,true,5,'2026-09-17T02:00:00Z')`,[a,b,q]);
const calendar=(tz,from='2026-09-01',to='2026-09-30')=>db.query('select * from practice_calendar($1,$2,$3)',[tz,from,to]).then(r=>r.rows);
await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${a}',false);`);
const utc=await calendar('UTC');
assert.deepEqual(utc.map(r=>[r.day.toISOString().slice(0,10),r.attempts,r.questions,r.objective,r.correct]),[['2026-09-16',1,1,1,1],['2026-09-17',2,1,1,0]]);
const sh=await calendar('Asia/Shanghai');
assert.deepEqual(sh.map(r=>[r.day.toISOString().slice(0,10),r.attempts,Number(r.avg_quality)]),[['2026-09-17',3,3]]);
assert.equal((await db.query(`select * from practice_day('UTC','2026-09-17')`)).rows.length,2);
await assert.rejects(()=>calendar('UTC','2025-01-01','2026-09-30'),/invalid_range/);
await db.exec(`select set_config('request.jwt.claim.sub','${b}',false);`);
assert.deepEqual((await calendar('UTC')).map(r=>r.attempts),[1]);
await db.exec('reset role;set role anon;');
await assert.rejects(()=>calendar('UTC'),/permission denied/);
await db.exec('reset role;');

// AI evaluations: follow-up chains, round limits, idempotency, RLS, calendar enrichment.
await db.exec(await readFile(new URL('../supabase/migrations/20260917001000_ai_evaluations.sql',import.meta.url),'utf8'));
await db.exec(`insert into app_admins values('${a}') on conflict do nothing;update ai_settings set request_count=0;`);
const ev=(n,{mode='practice',parent=null,session=null,correct=null}={})=>db.query(`select ai_begin_evaluation($1,$2,'v',$3,$4,$5,$6,'{"answerMd":"x"}',$7,'model') as r`,[a,q,req(100+n),mode,session,parent,correct]).then(r=>r.rows[0].r);
const complete=(id,followUp=true)=>db.query(`update ai_evaluations set status='complete',score=60,result=$2 where id=$1`,[id,JSON.stringify({verdict:'v',weaknesses:[],followUp:followUp?{question:'why?',targets:'t'}:null})]);
const e1=await ev(1,{correct:false});
assert.equal(e1.duplicate,false);assert.equal(e1.evaluation.round,1);assert.equal(e1.evaluation.is_correct,false);
assert.equal((await ev(1)).duplicate,true);
await assert.rejects(()=>ev(2),/generation_busy/);
await complete(e1.evaluation.id);
const e2=await ev(3,{parent:e1.evaluation.id,correct:true});
assert.equal(e2.evaluation.round,2);assert.equal(e2.evaluation.root_id,e1.evaluation.id);
assert.equal(e2.evaluation.follow_up_question,'why?');assert.equal(e2.evaluation.is_correct,false);
await complete(e2.evaluation.id);
await assert.rejects(()=>ev(4,{parent:e1.evaluation.id}),/followup_invalid/); // already answered
await assert.rejects(()=>ev(5,{parent:e2.evaluation.id,mode:'interview'}),/followup_invalid/); // mode mismatch
const noFollow=await ev(6);await complete(noFollow.evaluation.id,false);
await assert.rejects(()=>ev(7,{parent:noFollow.evaluation.id}),/followup_invalid/);
const e3=await ev(8,{parent:e2.evaluation.id});await complete(e3.evaluation.id);
const e4=await ev(9,{parent:e3.evaluation.id});assert.equal(e4.evaluation.round,4);assert.equal(e4.evaluation.root_id,e1.evaluation.id);await complete(e4.evaluation.id);
await assert.rejects(()=>ev(10,{parent:e4.evaluation.id}),/followup_invalid/); // practice limit: 4 rounds
const session='30000000-0000-0000-0000-000000000001';
await db.exec(`update ai_settings set request_count=0;`);
const i1=await ev(11,{mode:'interview',session});await complete(i1.evaluation.id);
const i2=await ev(12,{mode:'interview',parent:i1.evaluation.id,session:null});assert.equal(i2.evaluation.session_id,session);await complete(i2.evaluation.id);
const i3=await ev(13,{mode:'interview',parent:i2.evaluation.id});await complete(i3.evaluation.id);
await assert.rejects(()=>ev(14,{mode:'interview',parent:i3.evaluation.id}),/followup_invalid/); // interview limit: 3 rounds
await assert.rejects(()=>ev(15,{parent:'40000000-0000-0000-0000-000000000001'}),/followup_invalid/);
await db.exec(`update ai_settings set request_count=10,window_start=now();`);
await assert.rejects(()=>ev(16),/rate_limit/);
await db.exec(`update ai_settings set request_count=0;`);
const report=(n,kind='interview')=>db.query(`select ai_begin_report($1,$2,$3,$4,'model') as r`,[a,kind,session,req(200+n)]).then(r=>r.rows[0].r);
const r1=await report(1);assert.equal(r1.duplicate,false);assert.equal((await report(1)).duplicate,true);
await assert.rejects(()=>report(2),/generation_busy/);
assert.equal((await report(3,'weakness')).duplicate,false);
await db.query(`update ai_reports set status='complete',created_at='2026-09-17T02:00:00Z' where kind='interview'`);
// Link an attempt to an evaluation, check calendar enrichment, then set-null on delete.
await db.query(`update attempts set ai_evaluation_id=$1 where user_id=$2 and answered_at='2026-09-17T02:00:00Z'`,[e1.evaluation.id,a]);
await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${a}',false);`);
const enriched=await calendar('UTC');
assert.deepEqual(enriched.map(r=>[r.day.toISOString().slice(0,10),r.attempts,r.ai_avg_score==null?null:Number(r.ai_avg_score),r.interviews]),[['2026-09-16',1,null,0],['2026-09-17',2,60,1]]);
assert.equal((await db.query('select * from ai_evaluations')).rows.length,8);
assert.equal((await db.query('select * from ai_reports')).rows.length,2);
await assert.rejects(()=>db.query(`insert into ai_evaluations(user_id,question_id,question_version,request_id,round,mode,status,model) values('${a}','${q}','v','${req(999)}',1,'practice','complete','m')`),/permission denied/);
await assert.rejects(()=>ev(17),/permission denied/);
await db.exec(`select set_config('request.jwt.claim.sub','${b}',false);`);
assert.equal((await db.query('select * from ai_evaluations')).rows.length,0);
assert.deepEqual((await calendar('UTC')).map(r=>[r.attempts,r.interviews]),[[1,0]]);
await db.exec('reset role;set role anon;');
await assert.rejects(()=>db.query('select * from ai_reports'),/permission denied/);
await db.exec('reset role;');
await db.query('delete from ai_evaluations where id=$1',[e1.evaluation.id]);
assert.equal((await db.query(`select count(*)::int as n from ai_evaluations where root_id=$1`,[e1.evaluation.id])).rows[0].n,0); // chain cascades
assert.equal((await db.query(`select count(*)::int as n from attempts where ai_evaluation_id is not null`)).rows[0].n,0);
assert.equal((await db.query(`select count(*)::int as n from attempts`)).rows[0].n,4);
await db.close();console.log('PASS: SQL migration, idempotency, single-flight, 10/min, owner/admin RLS, revocation, append conflict, clear isolation, NULL legacy assistance, practice calendar, AI evaluation chains/limits/reports');
