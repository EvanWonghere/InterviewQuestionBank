-- Draft for approval: cloud copies of the blog music room's saved works and arrangements, so the
-- administrator's devices stay in step. The browser keeps its local copy and reads/writes this table
-- directly with its own session; RLS limits every row to its owner while they are an administrator.
-- Rows are never hard-deleted by the browser: a deletion leaves a tombstone (deleted, body null) so
-- other devices can remove their copy. Practice progress is not stored here.
create table public.music_works (
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 kind text not null check (kind in ('score','live','arrangement')),
 id text not null check (id ~ '^[A-Za-z0-9_-]{1,100}$'),
 title text not null check (length(title) between 1 and 100),
 body jsonb,
 content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
 revision integer not null default 1 check (revision >= 1),
 deleted boolean not null default false,
 updated_at timestamptz not null default now(),
 primary key (user_id, kind, id),
 check (deleted = (body is null)),
 check (body is null or octet_length(body::text) <= 400000)
);

-- Revisions are assigned here, never by the browser: an insert starts at 1, every update adds 1,
-- so a device that writes "based on revision n" (update ... where revision = n) cannot overwrite a
-- newer copy. Keys cannot change, and each administrator has at most 50 live works per kind and
-- 8 MB of bodies in total.
create function private.music_works_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare live integer; total bigint;
begin
 perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 1));
 if tg_op = 'INSERT' then
  new.revision := 1;
 else
  if new.user_id <> old.user_id or new.kind <> old.kind or new.id <> old.id then raise exception 'music_works_key_immutable'; end if;
  new.revision := old.revision + 1;
 end if;
 new.updated_at := now();
 if not new.deleted then
  select count(*) into live from public.music_works w
   where w.user_id = new.user_id and w.kind = new.kind and not w.deleted and w.id <> new.id;
  if live >= 50 then raise exception 'music_works_limit'; end if;
 end if;
 select coalesce(sum(octet_length(w.body::text)), 0) into total from public.music_works w
  where w.user_id = new.user_id and not (w.kind = new.kind and w.id = new.id);
 if total + coalesce(octet_length(new.body::text), 0) > 8388608 then raise exception 'music_works_quota'; end if;
 return new;
end; $$;
revoke all on function private.music_works_guard() from public, anon, authenticated;
create trigger music_works_guard before insert or update on public.music_works
 for each row execute function private.music_works_guard();

create index music_works_changes on public.music_works(user_id, updated_at);

alter table public.music_works enable row level security;
create policy music_works_owner on public.music_works for all to authenticated
 using (user_id = (select auth.uid()) and private.is_app_admin())
 with check (user_id = (select auth.uid()) and private.is_app_admin());
revoke all on public.music_works from anon, authenticated;
grant select, insert, update on public.music_works to authenticated;
grant all on public.music_works to service_role;
