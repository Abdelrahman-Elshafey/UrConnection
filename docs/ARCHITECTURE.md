# Architecture — UrConnections

> Snapshot as of commit `86180e9` plus the bug-fix pass (branch `dev`). Line numbers may drift, so search by symbol name.

## 1. Folder map

```
index.html                  # Vite entry; title "UrConnections"
vite.config.js              # react() + tailwindcss() plugins only
vercel.json                 # SPA rewrite: everything -> /index.html
eslint.config.js            # flat config: js recommended + react-hooks (v7, includes React Compiler rules) + react-refresh
.agents/rules/              # owner's standing rules: general-rules.md, auth-implmentation.md, style-guide.md
.VSCodeCounter/             # local line-count reports (gitignored)
public/                     # favicon.svg
src/
  main.jsx                  # QueryClientProvider (shared client from lib/queryClient.js) + ReactQueryDevtools + <App/>
  App.jsx                   # createBrowserRouter route tree + loaders requireAuth / redirectIfAuth + <Analytics/>
  index.css                 # Inter font import, Tailwind import, base layer (global transitions, cursor), .hide-scrollbar, .animate-fade-in
  GenealComponents/         # (sic, typo) app shell
    RootLayout.jsx          # <ScrollToTop/> + <Outlet/>
    MainLayout.jsx          # sticky nav + <Outlet/> + footer (211 lines, all inline)
    ScrollToTop.jsx         # scrolls to top on pathname change
  lib/
    supabase.js             # createClient(url, publishableKey, {persistSession, autoRefreshToken, detectSessionInUrl})
    countries.js            # COUNTRIES_CITIES {Country: [cities…].sort()} (~118 countries, 683 lines), COUNTRY_LIST
    platforms.js            # PLATFORMS [{key,label,icon,color(tailwind),domains(RegExp),placeholder}], PLATFORM_MAP, getPlatform(key)
    groupSchema.js          # zod schema for CreateGroupForm (+ refine: link must match platform domain regex)
  services/
    auth.service.js         # signUp, signInWithPassword, signInWithOAuth, signOut, getSession, updateProfile
    storage.service.js      # uploadAvatar(userId, file), removeAvatar(userId) — bucket "Users-Pics"
  features/
    auth/
      components/AuthPage.jsx     # login + signup in one page (toggle), zod schema inline, Google OAuth
      hooks/useUser.js            # useQuery(['session']) + onAuthStateChange subscription
    groups/
      api/groupsApi.js            # getGroups, createGroup, deleteGroup, getUserGroups
      hooks/useGetGroups.js       # ['groups']
      hooks/useGetUserGroups.js   # ['groups','user',id]
      hooks/useGroup.js           # ['group',id] — calls supabase directly (not via groupsApi)
      hooks/useCreateGroup.js     # mutation, invalidates ['groups'], alert() on error
      hooks/useDeleteGroup.js     # mutation, invalidates ['groups'], alert() on error
      hooks/useUserLocation.js    # ['userLocation'] — IP geolocation via https://ipapi.co/json/, cached in localStorage
      hooks/useFilterCache.js     # NOT a hook: read/write/clearFilterCache() in sessionStorage, 60s TTL
      components/GroupList.jsx    # home page: hero/filter bar + client-side filtering + grid
      components/FilterBar.jsx    # hero search box + sticky selects (country/city/platform) + topic pills
      components/GroupCard.jsx    # card with topic/platform badges, delete (X) only when `canDelete`, Connect / View Details
      components/GroupDetail.jsx  # /groups/:groupId
      components/CreateGroupForm.jsx # /create
    profile/
      components/ProfilePage.jsx  # /profile: read/edit metadata form + user's groups grid (403 lines)
      components/ProfileAvatar.jsx# avatar display/upload/remove
      hooks/useAvatar.js          # useUploadAvatar, useRemoveAvatar → invalidate ['session']
      hooks/useUpdateProfile.js   # → invalidate ['session']
```

## 2. Routing (`src/App.jsx`)

```
RootLayout (no path)
├── "/"  MainLayout
│   ├── index              GroupList
│   ├── groups/:groupId    GroupDetail
│   ├── create             CreateGroupForm   loader: requireAuth  (redirect /login if no session)
│   └── profile            ProfilePage       loader: requireAuth
└── "login"                AuthPage          loader: redirectIfAuth (redirect / if session)
```
- The loaders read the session through the cache: `queryClient.ensureQueryData(sessionQueryOptions)`, with the shared `queryClient` in `src/lib/queryClient.js`.
- There is no `errorElement`, no 404/catch-all route, and no `React.lazy`. Every page is bundled eagerly.
- `<Analytics/>` (Vercel) renders next to `RouterProvider`.

## 3. Data layer

### TanStack Query keys
| Key | Defined in | Fetches | Invalidated by |
|---|---|---|---|
| `['session']` | `useUser` | `supabase.auth.getSession()`, `staleTime: Infinity` | upload/remove avatar, update profile; also `setQueryData` from `onAuthStateChange` |
| `['groups']` | `useGetGroups` | all groups `select('*')` | create/delete group |
| `['groups','user',id]` | `useGetUserGroups` | groups where `user_id = id` | (prefix-matched by `['groups']`) |
| `['group',id]` | `useGroup` | one group by id | **never** (see audit) |
| `['userLocation']` | `useUserLocation` | ipapi.co (localStorage-cached) | never (staleTime ∞) |

`QueryClient` (`src/lib/queryClient.js`) defaults: `staleTime: 60_000`, `refetchOnWindowFocus: false`, retry 3.

### Supabase data model (inferred from the code; there are no migrations or types in the repo)
- **Table `groups`**: `id`, `title` (≤20), `description` (20–200), `topic` (one of TOPICS), `platform` (PLATFORMS key), `meeting_link` (URL), `country`, `city`, `user_id` (set by the client), `date` (ISO string set by the client).
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
