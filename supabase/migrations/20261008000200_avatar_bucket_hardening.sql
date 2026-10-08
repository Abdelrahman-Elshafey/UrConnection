-- ─────────────────────────────────────────────────────────────────────────────
-- Avatar bucket "Users-Pics": file restrictions + owner-only writes   (audit S5)
--
-- Run supabase/inspect.sql first (§5 and §6 show what this replaces).
-- Runs in one transaction: if any statement fails, nothing is changed.
--
-- Layout used by src/services/storage.service.js:  <user id>/avatar.<jpg|png|webp>
-- ─────────────────────────────────────────────────────────────────────────────
begin;

-- Only raster images, max 2 MB (the client compresses to ≤1 MB / 512px).
-- Keep in sync with AVATAR_MIME_TYPES in storage.service.js.
-- SVG is excluded on purpose: it can carry script, and this bucket is public.
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'],
    file_size_limit    = 2 * 1024 * 1024
where id = 'Users-Pics';

-- Replace every existing policy that mentions this bucket (policies are OR-ed,
-- so a leftover broad one would let anyone overwrite other users' avatars).
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (coalesce(qual, '') ilike '%Users-Pics%' or coalesce(with_check, '') ilike '%Users-Pics%')
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;

-- Public URLs (getPublicUrl) work without a select policy because the bucket is
-- public. This policy is for list() during upload/remove: own folder only.
create policy "avatars: owner list"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'Users-Pics' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: owner upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'Users-Pics' and (storage.foldername(name))[1] = auth.uid()::text);

-- Needed because uploads use upsert: true.
create policy "avatars: owner replace"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'Users-Pics' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'Users-Pics' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: owner delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'Users-Pics' and (storage.foldername(name))[1] = auth.uid()::text);

commit;
