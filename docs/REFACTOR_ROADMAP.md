# Refactor Roadmap — UrConnections

> **Phases 2–6 are superseded by [MASTER_PLAN.md](MASTER_PLAN.md)** (TypeScript monorepo + own Express backend). Their audit IDs are mapped into its stages. Phases 0–1 below remain the record of what was done on the Supabase version.

Phased so each phase ships on its own (one PR per phase or sub-step, from `dev`).
IDs refer to [CODE_AUDIT.md](CODE_AUDIT.md). Ordering logic: remaining bugs and cheap wins first, then the security work
that needs the Supabase dashboard, then shared foundations, then page rewrites built on them, then the bigger performance changes.

**Verification after every step:** `npm run lint` passes, `npm run build` passes, and a manual smoke test of
home filters, group detail, create group (logged in), login/signup/Google, profile edit, and avatar upload/remove, in both light and dark mode, desktop and mobile width.
To track bundle size, compare the `dist/assets/index-*.js` gzip size printed by `npm run build`. The baseline is **237 KB gzip**.

**Status:** B1–B21 fixed in the bug-fix pass (B4, B13, B19 partly). **Phase 0 done.** **Phase 1: repo side done; Supabase-side SQL and dashboard steps are waiting on the owner** ([SUPABASE.md](SUPABASE.md)). Phases 2–6 are open.

---

## Phase 0 — Remaining bugs + quick wins ✅ done
Bugs:
- **B22** ProfilePage form reset mid-edit: reset in the Edit click handler and delete both effects. This also covers O4 and L4.
- **B23** cached filters overriding a shared URL: restore only when the URL has no filter params.
- **B24** badge class conflict · **B25** `text-contain` · **B26** `break-all` / dead fallback · **B27** toast timer · **B28** clear user-scoped queries on sign-out.

Quick wins:
- **P3** `lib/queryClient.js` defaults: `staleTime: 60_000`, `refetchOnWindowFocus: false`.
- **P5** delete the global `*` transition rule in `index.css`.
- **S9** `npm audit fix`. Move `@tailwindcss/vite` to devDependencies.
- **L3** FilterBar search: uncontrolled input with `key`.
- **O5, O10** trivial wrappers and the `React.createElement` / unused React imports.
- Hygiene: **H1** unused deps · **H2** unused assets · **H3** untrack `.VSCodeCounter` · **H7** `.gitignore` · **H10**.

## Phase 1 — Security hardening 🟡 repo side done, owner runs [SUPABASE.md](SUPABASE.md)
Decisions made: S7 links stay public, no creation limits. S3 keeps geolocation with a 7-day TTL. S1 needs no rotation.

1. **S2** export the current schema and RLS (`supabase db dump --schema public`, or copy the policies) into `supabase/` or `docs/SUPABASE.md`. Review: `groups` insert `WITH CHECK (user_id = auth.uid())`, delete/update `USING (user_id = auth.uid())`, storage policies scoped to `(storage.foldername(name))[1] = auth.uid()::text`.
2. **S5** bucket `Users-Pics`: allowed MIME types `image/jpeg,image/png,image/webp`, size limit around 2 MB.
3. **S6** `CHECK` constraints on `groups` (lengths, `platform` enum, `meeting_link ~ '^https://'`). Make `user_id default auth.uid()` and `date`/`created_at default now()`; this finishes B19.
4. **S8** `vercel.json` security headers. Ship the CSP as `Report-Only` first, then enforce.
5. **S10** password policy + leaked-password protection in Supabase Auth settings.
6. ❓ **S7** hide `meeting_link` from anonymous users? Rate-limit or report groups? **S3** keep IP geolocation (consent, TTL)?
7. **S1** check the old `.env` in git history locally. Rotate keys only if a secret key was ever in it.

## Phase 2 — Foundations
1. **D11** theme tokens via Tailwind v4 `@theme` (`--color-accent: #0071e3`, surfaces, lines). Replace hex literals gradually.
2. **D5** `lib/topics.js` · **D7** query-key factories (`groupKeys`, `authKeys`).
3. **R1/R2** `groupsApi.getGroupById`, explicit `GROUP_COLUMNS` instead of `*`.
4. **O6 + P2** storage: convert to WebP, fixed path `<uid>/avatar.webp`, one call each for upload and remove. Lazy-import `browser-image-compression`.
5. **D9** `useSignOut()` mutation hook: sign out, clear user caches, navigate.
6. **O2** trim `useUserLocation` options. Add a TTL to its localStorage entry.
7. **O7** pre-sorted country data (no runtime `.sort()`).
8. Renames: **H4** `GenealComponents/` → `app/layouts/` · **H5** `useFilterCache.js` → `utils/filterCache.js`.

## Phase 3 — Shared UI kit (`src/components/ui/`), pure extraction with identical visuals
`Spinner` + `FullPageLoader` (D1) · `BackLink` (D2) · `Button` (D10) · `PageHero` (D12) · `Avatar` + `lib/user.js getProfile()` (D6) · `PlatformBadge` (D8, B24) ·
`form/TextField`, `SelectField`, `TextAreaField`, `FieldError`, `PasswordInput` with `useId()`-linked labels and `aria-*` (D3, **A1**) · `LocationSelects` (D4) ·
`Toast` + `ConfirmDialog` (replaces `alert` / `window.confirm`, finishes B4).

Compare screenshots before and after for each page.

## Phase 4 — Page-level rewrites (on top of Phases 2–3)
- **GroupList / FilterBar**: `useGroupFilters()` with the URL as the single source of truth (**O1**, finishes B13, fixes B29). `<FilterBar filters onChange>` (**O8**). Pure `filterGroups()` + `useMemo` (**P8**). Split into `HeroSearch` / `DiscoveryBar` / `TopicPills`. `aria-label`s and `aria-pressed` (**A2, A4**).
- **GroupCard**: delete via `onDelete` / `DeleteGroupButton` only when owned (**O9**). Readable font sizes (**A3**). `transition-transform` instead of `transition-all` (**P6**).
- **AuthPage**: split into `LoginForm` / `SignupForm` with separate schemas, and zod 4 `z.email()` (**O3**).
- **ProfilePage**: `ProfileInfoView` / `ProfileEditForm` / `UserGroupsSection`. The form logic was already simplified in Phase 0.
- **MainLayout**: `Navbar` (a proper mobile menu) + `Footer`.

## Phase 5 — Performance & routing
1. **P1 / R5** lazy routes (`lazy:` in the RR7 route objects). Target: home chunk **≤ 190 KB gzip** (from 237).
2. **R4** route `errorElement` + catch-all 404.
3. **R3** `/groups/:groupId` loader: `ensureQueryData(groupDetailQuery(id))`.
4. **P4** server-side filtering + `.range()` pagination ("Load more" or infinite scroll). DB indexes on `(country, city)`, `topic`, `platform`. `placeholderData: keepPreviousData`.
5. **P7** self-host Inter (`@fontsource-variable/inter`). **P6** reduce `backdrop-blur`. **P9** image attributes.
6. Optional: run Lighthouse (mobile) before and after, and record LCP / TBT in this file.

## Phase 6 — Optional / larger decisions (ask the owner first)
- TypeScript, or JSDoc + generated Supabase `Database` types (R6).
- Manual theme toggle (R7). Member counts and social proof with a `group_members` table (R8).
- Vitest + RTL (H9). First targets are `filterGroups`, `useGroupFilters` parsing, `findMatchingCountry`, and `groupSchema`.
- Rewrite the README (H6). Trim the style guide (H8).

---

## Proposed target structure
```
src/
  main.jsx
  app/
    router.jsx              # route tree (lazy pages), loaders, errorElement
    layouts/RootLayout.jsx  # useAuthListener, ScrollToTop
    layouts/MainLayout.jsx  # Navbar + Outlet + Footer
    components/Navbar.jsx, Footer.jsx, ErrorPage.jsx, NotFound.jsx
  components/ui/            # Button, Spinner, BackLink, Avatar, PageHero, Toast, ConfirmDialog, PlatformBadge
  components/ui/form/       # TextField, SelectField, TextAreaField, FieldError, PasswordInput, LocationSelects
  lib/                      # supabase.js, queryClient.js, countries.js, platforms.js, topics.js, user.js
  services/                 # auth.service.js, storage.service.js
  features/
    auth/    hooks/useUser.js (sessionQueryOptions, useAuthListener), useSignOut.js · components/AuthPage, LoginForm, SignupForm · schemas.js
    groups/  api/groupsApi.js, queryKeys.js · hooks/…, useGroupFilters.js · utils/filterGroups.js, filterCache.js · schemas/groupSchema.js
             components/GroupList, GroupCard, DeleteGroupButton, GroupDetail, CreateGroupForm, HeroSearch, DiscoveryBar, TopicPills
    profile/ hooks/… · components/ProfilePage, ProfileInfoView, ProfileEditForm, UserGroupsSection, ProfileAvatar
supabase/                   # (Phase 1) schema + RLS policies under version control
```
