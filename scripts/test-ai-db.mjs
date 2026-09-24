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
// Reasoning settings and the 150s stale cutoff.
await db.exec(await readFile(new URL('../supabase/migrations/20260917002000_ai_reasoning_settings.sql',import.meta.url),'utf8'));
assert.equal((await db.query(`select reasoning_effort from ai_settings where user_id=$1`,[a])).rows[0].reasoning_effort,'high');
await assert.rejects(()=>db.query(`update ai_settings set reasoning_effort='extreme' where user_id=$1`,[a]),/check constraint/);
await db.exec(`update ai_settings set request_count=0;delete from ai_evaluations;`);
const slow=await db.query(`select ai_begin_evaluation($1,$2,'v',$3,'practice',null,null,'{}',null,'m') as r`,[a,q,req(300)]).then(r=>r.rows[0].r);
await db.query(`update ai_evaluations set created_at=now()-interval '100 seconds' where id=$1`,[slow.evaluation.id]);
await assert.rejects(()=>db.query(`select ai_begin_evaluation($1,$2,'v',$3,'practice',null,null,'{}',null,'m')`,[a,q,req(301)]),/generation_busy/); // 100s: still healthy
await db.query(`update ai_evaluations set created_at=now()-interval '160 seconds' where id=$1`,[slow.evaluation.id]);
assert.equal((await db.query(`select ai_begin_evaluation($1,$2,'v',$3,'practice',null,null,'{}',null,'m') as r`,[a,q,req(302)])).rows[0].r.duplicate,false);
assert.equal((await db.query(`select status from ai_evaluations where id=$1`,[slow.evaluation.id])).rows[0].status,'failed');
await db.exec(`update ai_settings set request_count=0;`);
const chat=await db.query(`select ai_begin($1,$2,'v',$3,'why','hint','m') as r`,[a,q,req(310)]).then(r=>r.rows[0].r);
await db.query(`update ai_messages set created_at=now()-interval '100 seconds' where id=$1`,[chat.message.id]);
await assert.rejects(()=>db.query(`select ai_begin($1,$2,'v',$3,'why','hint','m')`,[a,q,req(311)]),/generation_busy/);
await db.query(`update ai_messages set created_at=now()-interval '160 seconds' where id=$1`,[chat.message.id]);
assert.equal((await db.query(`select ai_begin($1,$2,'v',$3,'why','hint','m') as r`,[a,q,req(312)])).rows[0].r.duplicate,false);
// Question provenance: nullable link, cleared when the evaluation disappears.
await db.exec(await readFile(new URL('../supabase/migrations/20260918000000_question_origin.sql',import.meta.url),'utf8'));
await db.exec(`update ai_settings set request_count=0;update ai_evaluations set status='complete' where status='running';`);
const origin=await db.query(`select ai_begin_evaluation($1,$2,'v',$3,'practice',null,null,'{}',null,'m') as r`,[a,q,req(400)]).then(r=>r.rows[0].r.evaluation.id);
const q2='10000000-0000-0000-0000-000000000002';
await db.query(`insert into questions(id,origin_kind,origin_evaluation_id) values($1,'follow_up',$2)`,[q2,origin]);
await db.query(`insert into questions(id,origin_kind,origin_weakness_tag) values('10000000-0000-0000-0000-000000000003','weakness','事件退订')`);
await assert.rejects(()=>db.query(`insert into questions(id,origin_kind) values('10000000-0000-0000-0000-000000000004','manual')`),/check constraint/);
await assert.rejects(()=>db.query(`insert into questions(id,origin_weakness_tag) values('10000000-0000-0000-0000-000000000005',$1)`,['x'.repeat(41)]),/check constraint/);
assert.equal((await db.query(`select origin_evaluation_id from questions where id=$1`,[q2])).rows[0].origin_evaluation_id,origin);
await db.query(`delete from ai_evaluations where id=$1`,[origin]);
assert.equal((await db.query(`select origin_evaluation_id from questions where id=$1`,[q2])).rows[0].origin_evaluation_id,null);
assert.equal((await db.query(`select count(*)::int as n from questions where origin_evaluation_id is null`)).rows[0].n,3);
assert.equal((await db.query(`select origin_kind from questions where id=$1`,[q2])).rows[0].origin_kind,'follow_up'); // kind survives evaluation deletion
// Music practice room AI: separate table, owner/admin RLS, dedup, conflict, single flight, shared 10/min.
await db.exec(await readFile(new URL('../supabase/migrations/20260925000000_music_ai.sql',import.meta.url),'utf8'));
await db.exec(`insert into app_admins values('${a}') on conflict do nothing;update ai_settings set request_count=0;update ai_messages set status='complete' where status='running';`);
const hash=c=>c.repeat(64);
const music=(n,{kind='lesson',subject='pitch',version='v1',h=hash('a'),user=a}={})=>db.query(`select music_begin($1,$2,$3,$4,$5,$6,'why','m') as r`,[user,req(500+n),kind,subject,version,h]).then(r=>r.rows[0].r);
const m1=await music(1);
assert.equal(m1.duplicate,false);
const again=await music(1);assert.equal(again.duplicate,true);assert.equal(again.message.status,'running');
await assert.rejects(()=>music(1,{h:hash('b')}),/request_context_conflict/);
await assert.rejects(()=>music(1,{subject:'staff'}),/request_context_conflict/);
await assert.rejects(()=>music(2),/generation_busy/);
await assert.rejects(()=>db.query(`insert into music_messages(user_id,request_id,kind,subject_id,subject_version,context_hash,role,status,model) values($1,$2,'lesson','pitch','v',$3,'assistant','running','m')`,[a,req(599),hash('c')]),/duplicate key|unique/);
await assert.rejects(()=>music(3,{user:b}),/admin_required/);
// A chat on the quiz side does not block music, but they share the per-minute limit.
const quizChat=await db.query(`select ai_begin($1,$2,'v',$3,'why','hint','m') as r`,[a,q,req(598)]).then(r=>r.rows[0].r);
assert.equal(quizChat.duplicate,false);
await db.exec(`update music_messages set status='complete',body='answer' where status='running';`);
assert.equal((await music(1)).message.body,'answer');
await assert.rejects(()=>music(3,{kind:'quiz'}),/check constraint/);
await assert.rejects(()=>music(3,{subject:'../x'}),/check constraint/);
await db.exec(`update ai_settings set request_count=10,window_start=now();`);
await assert.rejects(()=>music(4),/rate_limit/);
await db.exec(`update ai_settings set request_count=0;`);
// 150-second stale cutoff.
await music(5,{kind:'composition',subject:'draft',version:'score-v1'});
await db.exec(`update music_messages set created_at=now()-interval '160 seconds' where status='running';`);
assert.equal((await music(6)).duplicate,false);
assert.equal((await db.query(`select status from music_messages where request_id=$1 and role='assistant'`,[req(505)])).rows[0].status,'failed');
// Clear removes finished requests of one subject only and never a running one.
assert.equal((await db.query(`select music_clear($1,'lesson','pitch') as n`,[a])).rows[0].n,2);
assert.equal((await db.query(`select count(*)::int as n from music_messages where subject_id='pitch'`)).rows[0].n,2);
assert.equal((await db.query(`select count(*)::int as n from music_messages where subject_id='draft'`)).rows[0].n,2);
// Arrangement proposals: stored payload, size limit, and the same dedup on retry.
await db.exec(`update music_messages set status='complete' where status='running';`);
const arr=await music(40,{kind:'arrangement',subject:'arr-test',version:hash('d')});
assert.equal(arr.duplicate,false);
await db.query(`update music_messages set status='complete',body='summary',payload=$1 where request_id=$2 and role='assistant'`,[JSON.stringify({ops:[{type:'setMeta',tempo:90}]}),req(540)]);
const again40=await music(40,{kind:'arrangement',subject:'arr-test',version:hash('d')});
assert.equal(again40.duplicate,true);assert.equal(again40.message.payload.ops[0].tempo,90);
await assert.rejects(()=>db.query(`update music_messages set payload=$1 where request_id=$2 and role='assistant'`,[JSON.stringify({big:'x'.repeat(70000)}),req(540)]),/check constraint/);
await db.query(`delete from music_messages where subject_id='arr-test'`);
// RLS: owner admin reads, other users and anon do not, nobody writes directly.
await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${a}',false);`);
assert.equal((await db.query('select * from music_messages')).rows.length,4);
await assert.rejects(()=>db.query(`update music_messages set body='x'`),/permission denied/);
await assert.rejects(()=>db.query(`delete from music_messages`),/permission denied/);
await assert.rejects(()=>music(7),/permission denied/);
await assert.rejects(()=>db.query(`select music_clear($1,'lesson','pitch')`,[a]),/permission denied/);
await db.exec(`select set_config('request.jwt.claim.sub','${b}',false);`);
assert.equal((await db.query('select * from music_messages')).rows.length,0);
await db.exec('reset role;set role anon;');
await assert.rejects(()=>db.query('select * from music_messages'),/permission denied/);
await db.exec('reset role;');
await db.exec(`delete from app_admins where user_id='${a}';set role authenticated;select set_config('request.jwt.claim.sub','${a}',false);`);
assert.equal((await db.query('select * from music_messages')).rows.length,0);
await db.exec('reset role;');
await db.close();console.log('PASS: SQL migration, idempotency, single-flight, 10/min, owner/admin RLS, revocation, append conflict, clear isolation, NULL legacy assistance, practice calendar, AI evaluation chains/limits/reports, reasoning settings, 150s stale cutoff, question provenance, music AI dedup/conflict/single-flight/shared limit/RLS/clear');
