-- Draft for approval: lets music_messages keep AI-written Strudel snippets for the live-coding
-- page (kind 'strudel', snippet code in payload). No other table, function or policy changes.
alter table public.music_messages drop constraint music_messages_kind_check;
alter table public.music_messages add constraint music_messages_kind_check
 check (kind in ('lesson','homework','composition','arrangement','strudel'));
