-- ─────────────────────────────────────────────────────────────────────────────
-- Groups: row-level security + server-side validation   (audit S2, S6, B19)
--
-- Run supabase/inspect.sql first and review its output.
-- Runs in one transaction: if any statement fails, nothing is changed.
--
-- Access model (owner decision: invite links stay public):
--   • anyone (anon + signed in) can read groups
--   • signed-in users can create groups only as themselves
--   • only the owner can update / delete their group
-- ─────────────────────────────────────────────────────────────────────────────
begin;

alter table public.groups enable row level security;

-- Policies are OR-ed: one leftover broad policy would defeat the strict ones
-- below, so every existing policy on public.groups is dropped and recreated.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'groups'
  loop
    execute format('drop policy %I on public.groups', p.policyname);
  end loop;
end $$;

create policy "groups: public read"
  on public.groups for select
  to anon, authenticated
  using (true);

create policy "groups: owner insert"
  on public.groups for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "groups: owner update"
  on public.groups for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "groups: owner delete"
  on public.groups for delete
  to authenticated
  using (user_id = auth.uid());

-- Server-side defaults so the client no longer has to (and cannot fake) them.
alter table public.groups alter column user_id set default auth.uid();

do $$
declare col_type text;
begin
  select data_type into col_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'groups' and column_name = 'date';

  if col_type in ('timestamp with time zone', 'timestamp without time zone', 'date') then
    execute 'alter table public.groups alter column date set default now()';
  elsif col_type in ('text', 'character varying') then
    -- Same ISO-8601 shape the client currently sends (new Date().toISOString()).
    execute $q$alter table public.groups alter column date
             set default to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')$q$;
  else
    raise notice 'groups.date has type %, default not changed', coalesce(col_type, '(missing)');
  end if;
end $$;

-- Mirror the client zod schema (src/lib/groupSchema.js, src/lib/platforms.js).
-- NOT VALID = enforced for new/updated rows only; existing rows are untouched.
-- After cleaning up rows listed by inspect.sql §7, run the VALIDATE statements
-- at the bottom of this file.
alter table public.groups drop constraint if exists groups_title_length;
alter table public.groups add constraint groups_title_length
  check (char_length(title) between 1 and 20) not valid;

alter table public.groups drop constraint if exists groups_description_length;
alter table public.groups add constraint groups_description_length
  check (char_length(description) between 20 and 200) not valid;

alter table public.groups drop constraint if exists groups_topic_allowed;
alter table public.groups add constraint groups_topic_allowed
  check (topic in ('Programming','Language','Math','Science','Design','Business','Art')) not valid;

alter table public.groups drop constraint if exists groups_platform_allowed;
alter table public.groups add constraint groups_platform_allowed
  check (platform in (
    'whatsapp','telegram','discord','zoom','google_meet','facebook','messenger',
    'instagram','reddit','slack','teams','skype','signal','linkedin','meetup',
    'twitter','tiktok','youtube','twitch','snapchat','pinterest','threads'
  )) not valid;

-- Blocks javascript:, data:, etc. (the per-platform domain check stays client-side).
alter table public.groups drop constraint if exists groups_meeting_link_http;
alter table public.groups add constraint groups_meeting_link_http
  check (meeting_link ~* '^https?://[^[:space:]]+$' and char_length(meeting_link) <= 500) not valid;

alter table public.groups drop constraint if exists groups_location_present;
alter table public.groups add constraint groups_location_present
  check (coalesce(country, '') <> '' and coalesce(city, '') <> '') not valid;

commit;

-- ── Later, once inspect.sql §7 returns no rows: ──────────────────────────────
-- alter table public.groups validate constraint groups_title_length;
-- alter table public.groups validate constraint groups_description_length;
-- alter table public.groups validate constraint groups_topic_allowed;
-- alter table public.groups validate constraint groups_platform_allowed;
-- alter table public.groups validate constraint groups_meeting_link_http;
-- alter table public.groups validate constraint groups_location_present;
