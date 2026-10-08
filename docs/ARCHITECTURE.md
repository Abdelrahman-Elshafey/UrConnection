# Architecture — UrConnections

> **Current as of Stage 2** (branch `stage-02-typed-data-layer`). Updated at the end of every stage (see MASTER_PLAN.md §3).
> This file describes the code **as it is now**. The target layout is in MASTER_PLAN.md §2. Line numbers drift, so search by symbol name.

## 1. Folder map

```
package.json                # npm workspaces root: ["web", "packages/*"]; scripts dev/build/lint/typecheck
package-lock.json           # the only lockfile (don't delete: it pins every version)
tsconfig.base.json          # shared strict TS settings (strict, noUncheckedIndexedAccess, bundler resolution)
tsconfig.json               # solution file: `npm run typecheck` = tsc -b over web + packages/shared
eslint.config.js            # one flat config for the repo: JS + typescript-eslint + react-hooks (web/src only)
.agents/rules/              # owner's standing rules: general-rules.md, auth-implmentation.md, style-guide.md
docs/                       # this file, CODE_AUDIT, MASTER_PLAN (the plan), SUPABASE (v1 security runbook), REFACTOR_ROADMAP (history)
supabase/                   # v1 only: inspect.sql + migrations (RLS, CHECKs, bucket). Removed in Stage 16
.VSCodeCounter/             # local line-count reports (gitignored)

packages/shared/            # @urconnections/shared: TS source imported directly (no build step)
  src/index.ts              # public exports (import only from "@urconnections/shared")
  src/topics.ts             # TOPICS (as const) + Topic type
  src/platforms.ts          # PLATFORMS: key, label, linkPattern (RegExp), placeholder; PLATFORM_KEYS/MAP, isPlatformKey
  src/countries.ts          # COUNTRIES_CITIES (stored pre-sorted), COUNTRY_LIST, getCities(), isCountry()
  src/schemas/group.ts      # createGroupSchema (form/API input) + groupSchema (stored row); CreateGroupInput, Group types
  src/schemas/auth.ts       # loginSchema, signupSchema, passwordSchema; LoginInput, SignupInput
  src/schemas/profile.ts    # profileSchema + profileFields (reused by signup); ProfileInput

web/                        # the React app (Vite)
  index.html                # Vite entry; title "UrConnections"
  vite.config.ts            # react() + tailwindcss() plugins only
  vercel.json               # SPA rewrite + security headers (CSP report-only). Vercel Root Directory must be `web` if deployed
  .env.example              # required VITE_* vars (copy to web/.env, which is gitignored)
  tsconfig.json / tsconfig.app.json / tsconfig.node.json   # Vite-template layout; allowJs during the JS→TS migration
  public/favicon.svg
  src/
    main.jsx                # QueryClientProvider (lib/queryClient) + ReactQueryDevtools + <App/>
    App.jsx                 # createBrowserRouter route tree + loaders requireAuth / redirectIfAuth + <Analytics/>
    index.css               # Inter font @import, Tailwind, base layer (border color, cursor), --nav-height, .hide-scrollbar, .animate-fade-in
    vite-env.d.ts           # types for import.meta.env.VITE_*
    GenealComponents/       # (sic, typo; renamed in Stage 11) app shell
      RootLayout.jsx        # useAuthListener() + <ScrollToTop/> + <Outlet/>
      MainLayout.jsx        # sticky nav + <Outlet/> + footer (all inline)
      ScrollToTop.jsx       # scrolls to top on pathname change
    lib/
      supabase.ts           # createClient(...); throws at startup if env vars are missing
      queryClient.ts        # shared QueryClient (staleTime 60s, no refetch on focus); also used by route loaders
      platforms.ts          # UI side of platforms: icon + Tailwind badge colors per PlatformKey; PLATFORMS, getPlatform(key)
    services/
      auth.service.ts       # signUp, signInWithPassword, signInWithOAuth, signOut, onAuthStateChange, getSession, updateProfile
      storage.service.ts    # uploadAvatar / removeAvatar (bucket "Users-Pics"; jpeg/png/webp only; no remote worker)
    features/
      auth/
        components/AuthPage.jsx       # login + signup in one page; authResolver picks loginSchema/signupSchema; Google OAuth
        hooks/useUser.ts              # SESSION_QUERY_KEY, sessionQueryOptions (queryOptions), useUser, useAuthListener
      groups/
        api/groupsApi.ts              # getGroups, getGroupById, getUserGroups, createGroup, deleteGroup (explicit columns)
        api/queryKeys.ts              # groupKeys factory: all / list / byUserRoot / byUser / detail
        hooks/useGetGroups.ts         # groupKeys.list()
        hooks/useGetUserGroups.ts     # groupKeys.byUser(id), enabled once id is known
        hooks/useGroup.ts             # groupKeys.detail(id)
        hooks/useCreateGroup.ts       # mutation → invalidate groupKeys.all; alert() on error (toast in Stage 7)
        hooks/useDeleteGroup.ts       # mutation → remove detail, invalidate groupKeys.all; alert() on error
        hooks/useUserLocation.ts      # ['userLocation']: ipapi.co, localStorage cache with 7-day TTL, never throws
        utils/filterCache.ts          # read/write/clearFilterCache(): sessionStorage, 60s TTL (replaced in Stage 5)
        components/GroupList.jsx      # home page: FilterBar + client-side filtering + grid
        components/FilterBar.jsx      # hero search (uncontrolled input) + sticky selects + topic pills
        components/GroupCard.jsx      # card: topic/platform badges, delete (X) only when `canDelete`, Connect / View Details
        components/GroupDetail.jsx    # /groups/:groupId
        components/CreateGroupForm.jsx # /create, validated by createGroupSchema
      profile/
        components/ProfilePage.jsx    # /profile: read/edit form (profileSchema) + the user's groups grid
        components/ProfileAvatar.jsx  # avatar display / upload / remove
        hooks/useAvatar.ts            # useUploadAvatar, useRemoveAvatar → invalidate SESSION_QUERY_KEY
        hooks/useUpdateProfile.ts     # → invalidate SESSION_QUERY_KEY
```
**TypeScript status:** `packages/shared` and the whole web data layer (`lib`, `services`, `hooks`, `api`, `utils`) are TS. Components (`.jsx`) are converted in Stage 11.

## 2. Routing (`web/src/App.jsx`)

```
RootLayout (no path)
├── "/"  MainLayout
│   ├── index              GroupList
│   ├── groups/:groupId    GroupDetail
│   ├── create             CreateGroupForm   loader: requireAuth  (redirect /login if no session)
│   └── profile            ProfilePage       loader: requireAuth
└── "login"                AuthPage          loader: redirectIfAuth (redirect / if session)
```
- The loaders read the session through the cache: `queryClient.ensureQueryData(sessionQueryOptions)`, with the shared `queryClient` in `web/src/lib/queryClient.ts`.
- There is no `errorElement`, no 404/catch-all route, and no `React.lazy`. Every page is bundled eagerly.
- `<Analytics/>` (Vercel) renders next to `RouterProvider`.

## 3. Data layer

### TanStack Query keys
| Key | Defined in | Fetches | Invalidated by |
|---|---|---|---|
| `['session']` (`SESSION_QUERY_KEY`) | `useUser` (`sessionQueryOptions`) | `getSession()`, `staleTime: Infinity` | avatar upload/remove, profile update; kept in sync by `useAuthListener` (`setQueryData`) |
| `['groups','list']` (`groupKeys.list()`) | `useGetGroups` | all groups, explicit columns | create/delete (`groupKeys.all`) |
| `['groups','user',id]` (`groupKeys.byUser`) | `useGetUserGroups` | groups where `user_id = id` | create/delete; removed on sign-out |
| `['groups','detail',id]` (`groupKeys.detail`) | `useGroup` | one group (`getGroupById`) | create/delete (removed on its own delete) |
| `['userLocation']` | `useUserLocation` | ipapi.co (localStorage-cached, 7-day TTL) | never (staleTime ∞) |

`QueryClient` (`web/src/lib/queryClient.ts`) defaults: `staleTime: 60_000`, `refetchOnWindowFocus: false`, retry 3.

### Supabase data model (v1; inferred from the code)
- **Table `groups`**: `id`, `title` (≤20), `description` (20–200), `topic` (one of TOPICS), `platform` (PLATFORMS key), `meeting_link` (http(s) URL), `country`, `city`, `user_id` (set by the client), `date` (ISO string set by the client). Shape and rules: `groupSchema` / `createGroupSchema` in packages/shared.
- **Auth `user_metadata`**: `display_name`, `phone_number`, `country`, `city`, `avatar_url`. There is no profiles table, so all of this lives in the auth user's metadata.
- **Storage bucket `Users-Pics`**: path `${userId}/avatar.${ext}`. The public URL is stored in `user_metadata.avatar_url` with `?t=timestamp` for cache-busting.
- RLS, constraints, and bucket policies are defined in `supabase/migrations/` (Phase 1). Check `docs/SUPABASE.md` to see whether they have been applied.

### Auth flow
1. `AuthPage` submits to `signInWithPassword` / `signUp(email, pw, metadata)`, then calls `navigate('/')`. OAuth uses `signInWithOAuth('google')` with `redirectTo: VITE_AUTH_REDIRECT_URL` and `prompt: select_account`.
2. `useAuthListener()` (mounted once in `RootLayout`) subscribes through `auth.service.onAuthStateChange` and writes each session into `['session']`. `useUser()` is a plain `useQuery(sessionQueryOptions)`. Password login also primes `['session']` directly.
3. `signOut()` calls `supabase.auth.signOut()`, then clears only the filter cache. The listener sets `['session']` to null.
4. Profile edits use `supabase.auth.updateUser({ data })`.

### Home page filter flow (`GroupList` + `FilterBar`)
- The source of truth is the URL search params `query`, `topic`, `country`, `city`, `platform` (`topic` defaults to `"All"`).
- `updateParam(key, value)` sets or deletes the param, clears `city` when `country` changes, and writes a snapshot to the sessionStorage filter cache (60s TTL).
- On mount, if a cache exists, it is restored into the URL (`hasInitialized = true`).
- Otherwise, once IP geolocation resolves and the URL is empty, it presets `country`/`city` from the detected location.
- Filtering runs **client-side** over all groups (case-insensitive equality on topic/country/city/platform, substring match on title/description).
- The filter cache is cleared on successful sign-in (password or before the OAuth redirect) and on sign-out.

## 4. UI conventions (current reality)
- All styling is inline Tailwind class strings, and many are long and duplicated: inputs, labels, spinners, back buttons, CTA pills. Only `ProfilePage` extracts `INPUT_CLS`/`SELECT_CLS` constants.
- Colors are hard-coded hex values: `#0071e3` (accent), `#f5f5f7`, `#111111`, `#1d1d1f`, `#0a0a0a`, `#333336`. There are no theme tokens (Tailwind v4 `@theme` is unused).
- Dark mode uses the `dark:` variant, driven by the system preference. There's no manual toggle, although the style guide asks for one.
- Icons are inline `<svg>` paths (chevron, X, pin, camera, check, pencil) plus `react-icons` for platforms and Google.
- Feedback is a mix of `alert()`, `window.confirm()`, inline error boxes, and one hand-rolled toast in ProfilePage.

## 5. External services
- Supabase (auth, Postgres, storage)
- ipapi.co (client-side IP geolocation, 5s timeout, fails silently)
- Google Fonts (Inter, `@import` in CSS)
- Vercel Analytics
