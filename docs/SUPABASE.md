# Supabase — security runbook (Phase 1)

The project's database security lives in Supabase, not in this repo's JS. This file explains what to run, in what order, and how to check it worked.
SQL files live in [`supabase/`](../supabase/). Run them in **Dashboard → SQL Editor** as the default `postgres` role.

## 1. Inspect (read-only)
Run [`supabase/inspect.sql`](../supabase/inspect.sql). Check:
- §1: `user_id` is type **uuid**. If it's `text`, the groups migration fails safely (nothing changes); come back and adjust it.
- §3 and §6: these are the policies that **will be dropped and replaced**. Make sure none of them are needed for something else.
- §7: existing rows that break the new rules. They keep working (constraints are `NOT VALID`), but fix or delete them before validating (step 4).

Paste the output below under "Current state" so future sessions know the real schema.

## 2. Run the migrations (each is one transaction: all or nothing)
1. [`20261008000100_groups_rls_and_checks.sql`](../supabase/migrations/20261008000100_groups_rls_and_checks.sql)
   - RLS: public read; insert, update and delete only by the owner.
   - Defaults: `user_id = auth.uid()`, `date = now()`.
   - `CHECK` constraints mirroring the zod schema: title, description, topic, platform, http(s) link, location.
2. [`20261008000200_avatar_bucket_hardening.sql`](../supabase/migrations/20261008000200_avatar_bucket_hardening.sql)
   - Bucket `Users-Pics`: only JPEG/PNG/WebP, max 2 MB.
   - Storage policies: users can only list and write inside their own `<uid>/` folder.

## 3. Verify (SQL editor; everything rolls back)
Replace `USER_A` with a real user id that owns at least one group, and `USER_B` with a different user id.
```sql
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"USER_A","role":"authenticated"}', true);

-- expect 0 rows: A cannot delete B's groups
delete from public.groups where user_id = 'USER_B' returning id;

-- expect ERROR "new row violates row-level security policy": A cannot create as B
insert into public.groups (title, description, topic, platform, meeting_link, country, city, user_id)
values ('t', repeat('a', 20), 'Math', 'discord', 'https://discord.gg/x', 'Egypt', 'Cairo', 'USER_B');
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"USER_A","role":"authenticated"}', true);
-- expect ERROR violating check constraint "groups_meeting_link_http"
insert into public.groups (title, description, topic, platform, meeting_link, country, city)
values ('t', repeat('a', 20), 'Math', 'discord', 'javascript:alert(1)', 'Egypt', 'Cairo');
rollback;
```
Then, in the app: create a group, delete it from the profile page, and upload, replace and remove an avatar. Uploading a `.gif` or `.svg` should be refused.

## 4. After cleanup: validate the constraints
When `inspect.sql` §7 returns no rows, run the `validate constraint` lines at the bottom of the groups migration.

## 5. Dashboard settings SQL can't change (audit S10)
- **Authentication settings → Password security** (the menu location varies by dashboard version; look for "Password strength"): minimum length **8** and required characters "lowercase, uppercase, digits and symbols", matching the signup form.
- **Same section → Leaked password protection**: on. This needs the Pro plan; skip it on Free.
- **Authentication → URL Configuration**: Site URL is the production domain. *Redirect URLs* contains exactly the production URL, `http://localhost:5173`, and Vercel previews if you use them. No wildcards on foreign domains.
- **Authentication → Providers → Email → Confirm email**: decide on or off. The signup page handles both (it shows "check your email" when no session is returned).

## 6. Security headers rollout (audit S8, in `vercel.json`)
- Enforced now: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy`.
- The CSP ships as **`Content-Security-Policy-Report-Only`**. After deploying, open the production site, sign in with password and Google, browse, create a group, and upload an avatar. Watch the DevTools console for `[Report Only]` CSP messages.
- If there are no violations (or you've added any missing host to the policy), rename the header key to `Content-Security-Policy` to enforce it.
- HSTS: Vercel already sends `Strict-Transport-Security` on its domains, so it isn't duplicated here.

## 7. Client follow-up once the migrations are live
`CreateGroupForm` still sends `date` and `user_id`. Both are now DB defaults, so they can be dropped from the insert payload, which finishes B19. Don't do that before the migration runs, or new groups get a null `date`.

---

## Current state (paste the `inspect.sql` output here)
_Not captured yet._
