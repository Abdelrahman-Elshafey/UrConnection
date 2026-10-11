# Architecture — UrConnections

> **Current as of Stage 5** (branch `stage-05-groups-read-api`). Updated at the end of every stage (see MASTER_PLAN.md §3).
> This file describes the code **as it is now**. The target layout is in MASTER_PLAN.md §2. Line numbers drift, so search by symbol name.

## 1. Folder map

```
package.json                # npm workspaces root: ["web", "api", "packages/*"]; scripts dev (web+api), test, lint, typecheck, db:up/down/logs
package-lock.json           # the only lockfile (don't delete: it pins every version)
tsconfig.base.json          # shared strict TS settings (strict, noUncheckedIndexedAccess, bundler resolution)
tsconfig.json               # solution file: `npm run typecheck` = tsc -b over web + api + packages/shared
docker-compose.yml          # dev services: postgres:18-alpine on 127.0.0.1:5433 (named volume pgdata, health check)
.github/workflows/ci.yml    # on push/PR: npm ci → lint → typecheck → test → build
eslint.config.js            # one flat config for the repo: JS + typescript-eslint + react-hooks (web/src only)
.agents/rules/              # owner's standing rules: general-rules.md, auth-implmentation.md, style-guide.md
docs/                       # this file, CODE_AUDIT, MASTER_PLAN (the plan), SUPABASE (v1 security runbook), REFACTOR_ROADMAP (history)
supabase/                   # v1 only: inspect.sql + migrations (RLS, CHECKs, bucket). Removed in Stage 16
.VSCodeCounter/             # local line-count reports (gitignored)

api/                        # @urconnections/api: Express 5 + TypeScript, run by tsx (no build step yet; Stage 13)
  .env.example              # NODE_ENV, PORT, DATABASE_URL, LOG_LEVEL (copy to api/.env, gitignored)
  vitest.config.ts          # unit tests (no DB): fake DATABASE_URL, excludes *.db.test.ts
  vitest.db.config.ts       # database tests: real Postgres via TEST_DATABASE_URL (default: Docker urconnections_test)
  src/index.ts              # starts the server (listen) + graceful shutdown on SIGINT/SIGTERM
  src/app.ts                # createApp(deps): helmet → pino-http (request ids) → express.json → routes → 404 → error handler
  src/app.test.ts           # Supertest: health up/down, request id, 404 JSON, bad JSON 400, security headers
  src/test/fakes.ts         # fakeDeps(overrides) + sampleGroup(): complete fake dependencies for createApp()
  src/config.ts             # loads api/.env if present; validates env with zod; exits with a clear message if invalid
  src/db/pool.ts            # pg Pool (max 10) + checkDatabase() ("select 1")
  src/db/db.ts              # `db`: Kysely<Database> on that pool (use this for all queries)
  src/db/types.ts           # hand-written table types (Database, UsersTable, GroupsTable, ...); NewGroupRow etc.
  src/db/migrations/        # 0001_initial_schema.ts (raw SQL up/down) + index.ts (explicit ordered list)
  src/db/migrator.ts        # runMigrations(db, latest | down | reset), shared by CLI and tests
  src/db/migrate.ts         # CLI behind npm run db:migrate / db:rollback / db:reset (reset refused in production)
  src/db/connectionHelp.ts  # explainDatabaseError(): plain-language hints for DB down / wrong password / no schema (CLI scripts)
  src/db/seed.ts            # CLI behind npm run db:seed: truncates, inserts 3 users + GROUP_COUNT groups (refused in production)
  src/db/schema.db.test.ts  # 44 DB tests: migrations, CHECKs, citext, uuidv7, trigger, cascade, shared↔DB drift
  src/db/test/globalSetup.ts  # creates the *_test database if missing; refuses non-_test names
  src/lib/logger.ts         # pino (pretty in dev, JSON in prod, silent in tests); redacts auth/cookie headers
  src/lib/errors.ts         # HttpError(status, code, message, details?) + ErrorBody shape
  src/lib/validate.ts       # parseOrThrow(schema, input): typed value or 400 invalid_request with per-field details
  src/middleware/errorHandler.ts       # notFound (JSON 404) + errorHandler (HttpError / bad JSON / 500 without details in prod)
  src/modules/health/health.routes.ts  # GET /api/health → 200 {ok,db:"up"} or 503 {ok:false,db:"down"}
  src/modules/groups/groups.repository.ts  # GroupsRepository interface + Kysely implementation (filters, search, cursor paging)
  src/modules/groups/groups.routes.ts      # GET /api/groups, GET /api/groups/:id (validated with shared schemas)
  src/modules/groups/groups.routes.test.ts # HTTP layer with a fake repository: validation, 400/404, response shape
  src/modules/groups/groups.db.test.ts     # real Postgres: every filter, search escaping, pagination, detail

packages/shared/            # @urconnections/shared: TS source imported directly (no build step)
  src/index.ts              # public exports (import only from "@urconnections/shared")
  src/topics.ts             # TOPICS (as const) + Topic type
  src/platforms.ts          # PLATFORMS: key, label, linkPattern (RegExp), placeholder; PLATFORM_KEYS/MAP, isPlatformKey
  src/countries.ts          # COUNTRIES_CITIES (stored pre-sorted), COUNTRY_LIST, getCities(), isCountry()
  src/schemas/group.ts      # createGroupSchema (input), groupSchema (API group, created_at ISO), groupListQuerySchema,
                            # groupListResponseSchema ({ items, nextCursor }); types Group, GroupListQuery/Params/Response
  src/schemas/auth.ts       # loginSchema, signupSchema, passwordSchema; LoginInput, SignupInput
  src/schemas/profile.ts    # profileSchema + profileFields (reused by signup); ProfileInput

web/                        # the React app (Vite)
  index.html                # Vite entry; title "UrConnections"
  vite.config.ts            # react() + tailwindcss(); dev proxy /api → http://localhost:3000
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
      apiClient.ts          # apiGet(path, schema, params): fetch our API (same origin), ApiError on failure, zod-validated JSON
      platforms.ts          # UI side of platforms: icon + Tailwind badge colors per PlatformKey; PLATFORMS, getPlatform(key)
    services/
      auth.service.ts       # signUp, signInWithPassword, signInWithOAuth, signOut, onAuthStateChange, getSession, updateProfile
      storage.service.ts    # uploadAvatar / removeAvatar (bucket "Users-Pics"; jpeg/png/webp only; no remote worker)
    features/
      auth/
        components/AuthPage.jsx       # login + signup in one page; authResolver picks loginSchema/signupSchema; Google OAuth
        hooks/useUser.ts              # SESSION_QUERY_KEY, sessionQueryOptions (queryOptions), useUser, useAuthListener
      groups/
        api/groupsApi.ts              # API: getGroups(params), getGroupById · Supabase until Stage 7: getUserGroups, createGroup, deleteGroup
        api/queryKeys.ts              # groupKeys factory: all / lists / list(filters) / byUserRoot / byUser / detail
        hooks/useGroups.ts            # useInfiniteQuery over getGroups: pages + fetchNextPage, keepPreviousData
        hooks/useGroupFilters.ts      # filters from/to the URL; saved search; one-time location preset
        hooks/useGetUserGroups.ts     # groupKeys.byUser(id), enabled once id is known
        hooks/useGroup.ts             # groupKeys.detail(id), via the API
        hooks/useCreateGroup.ts       # mutation → invalidate groupKeys.all; alert() on error (toast in Stage 7)
        hooks/useDeleteGroup.ts       # mutation → remove detail, invalidate groupKeys.all; alert() on error
        hooks/useUserLocation.ts      # ['userLocation']: ipapi.co, localStorage cache with 7-day TTL, never throws
        utils/savedSearch.ts          # read/save/clearSavedSearch(): last home search per tab ("" = user cleared filters)
        components/GroupList.jsx      # home page: FilterBar + server-filtered grid + Load more
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

## API (Stage 3)
- **Dev:** `npm run db:up` starts Postgres, then `npm run dev` runs web (:5173) and api (:3000) together. The browser calls `/api/*` on :5173, and Vite forwards it to :3000, so it's the same origin as production.
- **Response contract:** success is plain JSON. Errors are always `{ "error": { "code": "...", "message": "..." } }` with a matching HTTP status. Throw `HttpError` in routes; Express 5 forwards async errors to `errorHandler`.
- **Dependency injection:** `createApp(deps)` receives things like `checkDatabase`, so tests use fakes and never need a database or an open port.
- **Endpoints so far:**
  - `GET /api/health`
  - `GET /api/groups?query&topic&country&city&platform&cursor&limit`: newest first, `{ items, nextCursor }`. limit 1–50 (default 24); bad values → 400 with `details`
  - `GET /api/groups/:id`: one group; unknown or malformed id → 404
- **Pagination:** cursor = id of the last item. uuidv7 ids sort by creation time, so the next page is `where id < cursor order by id desc limit n+1` (the extra row says whether more exist).
- **Database workflow:** `npm run db:up` (container) → `npm run db:migrate` (tables) → `npm run db:seed` (demo data). `npm run db:reset` rebuilds from scratch. `npm run test:db` runs the DB tests in the separate `urconnections_test` database, so dev data is never touched.

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
| `['groups','list',filters]` (`groupKeys.list(filters)`) | `useGroups` (infinite) | pages from `GET /api/groups` | create/delete (`groupKeys.all`) |
| `['groups','user',id]` (`groupKeys.byUser`) | `useGetUserGroups` | groups where `user_id = id` (**Supabase until Stage 7**) | create/delete; removed on sign-out |
| `['groups','detail',id]` (`groupKeys.detail`) | `useGroup` | `GET /api/groups/:id` | create/delete (removed on its own delete) |
| `['userLocation']` | `useUserLocation` | ipapi.co (localStorage-cached, 7-day TTL) | never (staleTime ∞) |

`QueryClient` (`web/src/lib/queryClient.ts`) defaults: `staleTime: 60_000`, `refetchOnWindowFocus: false`, retry 3.

### v2 database (own Postgres, migration 0001)
| Table | Key columns | Notes |
|---|---|---|
| `users` | `id uuid` (uuidv7), `email citext unique`, `password_hash`, `email_verified_at`, `display_name`, `phone`, `country`, `city`, `avatar_key`, `created_at`, `updated_at` | `updated_at` maintained by a trigger; profile fields default to `''` |
| `oauth_accounts` | pk `(provider, provider_user_id)`, `user_id` → users | provider ∈ `google` |
| `sessions` | pk `id_hash` (sha256 hex, CHECKed), `user_id` → users, `expires_at`, `last_seen_at`, `user_agent`, `ip inet` | the raw token is never stored |
| `email_tokens` | pk `token_hash`, `user_id`, `purpose` ∈ verify/reset, `expires_at`, `used_at` | single use |
| `groups` | `id uuid` (uuidv7), `user_id` → users, `title`, `description`, `topic`, `platform`, `meeting_link`, `country`, `city`, `created_at` | same CHECKs as the shared zod schema; indexes on user_id, (country, city), topic, platform |

All foreign keys are `on delete cascade`: deleting a user deletes their groups, sessions, tokens and OAuth links.
Rules: **never edit a migration that has run**; add `0002_...` and register it in `migrations/index.ts`, then update `types.ts` and the DB tests.
Note: v1 groups have a `date` column; v2 uses `created_at`. The API maps this in Stage 5.

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

### Home page filter flow (`GroupList` → `useGroupFilters` + `useGroups`)
- **The URL is the only source of truth:** `?query&topic&country&city&platform`. `useGroupFilters` reads it into `filters` (for the UI) and `apiParams` (unknown values dropped), and `setFilter` / `clearFilters` write it (`replace: true`; changing country clears city).
- Every URL change is also saved as the tab's **saved search** (`utils/savedSearch.ts`, sessionStorage, no expiry). On a visit to `/` without params: a saved search is restored; a saved `""` (user cleared) stays empty; otherwise the detected location is applied once.
- `useGroups(apiParams)` = `useInfiniteQuery` keyed by the filters. The server filters and paginates; **Load more** calls `fetchNextPage`. `keepPreviousData` keeps old results visible while new filters load.
- The saved search is cleared on sign-in and sign-out.
- **Transitional (until Stage 7):** groups created on `dev` go to Supabase, so they don't show on the home page (local Postgres). Profile "my groups" cards are Supabase rows, so their "View Details" link 404s against the API.

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
