-- ─────────────────────────────────────────────────────────────────────────────
-- READ-ONLY. Run this in the Supabase SQL editor BEFORE the migrations, and keep
-- the output (paste it into docs/SUPABASE.md or share it in the next session).
-- It shows exactly what the migrations will replace.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Columns of public.groups (the migrations assume id, title, description,
--    topic, platform, meeting_link, country, city, user_id, date)
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'groups'
order by ordinal_position;

-- 2. Is RLS enabled on public.groups?
select relname, relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced
from pg_class
where oid = 'public.groups'::regclass;

-- 3. Existing policies on public.groups (ALL of these get dropped and replaced)
select policyname, cmd, roles, permissive, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'groups';

-- 4. Existing constraints on public.groups
select conname, pg_get_constraintdef(oid) as definition, convalidated
from pg_constraint
where conrelid = 'public.groups'::regclass;

-- 5. Avatar bucket configuration
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'Users-Pics';

-- 6. Existing storage policies that mention the avatar bucket (these get replaced)
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and (coalesce(qual, '') ilike '%Users-Pics%' or coalesce(with_check, '') ilike '%Users-Pics%');

-- 7. Rows that would violate the new CHECK constraints (constraints are added
--    NOT VALID, so these rows keep working; fix or delete them, then VALIDATE)
select id, title, char_length(title) as title_len, char_length(description) as desc_len,
       topic, platform, left(meeting_link, 40) as link_start
from public.groups
where char_length(title) not between 1 and 20
   or char_length(description) not between 20 and 200
   or topic not in ('Programming','Language','Math','Science','Design','Business','Art')
   or meeting_link !~* '^https?://'
   or coalesce(country, '') = '' or coalesce(city, '') = '';
