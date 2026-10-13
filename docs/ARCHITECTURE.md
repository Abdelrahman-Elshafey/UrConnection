# Architecture — UrConnections

> **Current as of Stage 8** (branch `stage-08-email-flows`). Updated at the end of every stage (see MASTER_PLAN.md §3).
> This file describes the code **as it is now**. The target layout is in MASTER_PLAN.md §2. Line numbers drift, so search by symbol name.

## 1. Folder map

```
package.json                # npm workspaces root: ["web", "api", "packages/*"]; scripts dev (web+api), test, lint, typecheck, db:up/down/logs
package-lock.json           # the only lockfile (don't delete: it pins every version)
tsconfig.base.json          # shared strict TS settings (strict, noUncheckedIndexedAccess, bundler resolution)
tsconfig.json               # solution file: `npm run typecheck` = tsc -b over web + api + packages/shared
docker-compose.yml          # dev services: postgres:18-alpine on 127.0.0.1:5433 (volume pgdata) + mailpit (SMTP :1025, inbox http://localhost:8025)
                            #   + garage v2.4.1 (S3 API :3900, website :3902; --single-node --default-bucket creates bucket + key; volume garage)
docker/garage/garage.toml   # Garage dev config (sqlite metadata, replication 1, [s3_api] + [s3_web] root domains)
vercel.json                 # {git.deploymentEnabled: false}: v2 branches never deploy to Vercel. Only v1 on `main` stays live there until Stage 16
.github/workflows/ci.yml    # on push/PR: npm ci → lint → typecheck → test → build
eslint.config.js            # one flat config for the repo: JS + typescript-eslint + react-hooks (web/src only)
.agents/rules/              # owner's standing rules: general-rules.md, auth-implmentation.md, style-guide.md
docs/                       # this file, CODE_AUDIT, MASTER_PLAN (the plan), SUPABASE (v1 security runbook), REFACTOR_ROADMAP (history)
supabase/                   # v1 only: inspect.sql + migrations (RLS, CHECKs, bucket). Removed in Stage 16
.VSCodeCounter/             # local line-count reports (gitignored)

api/                        # @urconnections/api: Express 5 + TypeScript, run by tsx (no build step yet; Stage 13)
  .env.example              # NODE_ENV, PORT, DATABASE_URL, LOG_LEVEL, APP_ORIGIN, SMTP_URL, MAIL_FROM, GOOGLE_CLIENT_ID/SECRET (copy to api/.env)
  vitest.config.ts          # unit tests (no DB): fake DATABASE_URL, excludes *.db.test.ts
  vitest.db.config.ts       # database tests: real Postgres via TEST_DATABASE_URL (default: Docker urconnections_test)
  src/index.ts              # starts the server (listen) + graceful shutdown on SIGINT/SIGTERM
  src/app.ts                # createApp(deps): helmet → pino-http (request ids) → express.json → routes → 404 → error handler
  src/app.test.ts           # Supertest: health up/down, request id, 404 JSON, bad JSON 400, security headers
  src/test/fakes.ts         # fakeDeps(overrides) + sampleGroup() + fakeMailer() + fakeGoogle()/googleProfile(): fakes for createApp()
  src/test/testDb.ts        # createTestDb(): Kysely on the *_test DB + reset() / truncate() for *.db.test.ts
  src/types/express.d.ts    # adds req.user / req.sessionIdHash to Express's Request type
  src/config.ts             # loads api/.env if present; validates env with zod; exits with a clear message if invalid; GOOGLE_REDIRECT_URI
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
  src/lib/rateLimit.ts      # limitRequests({ limit, windowMs, key, onlyFailures, handler }) + byIp / byUser / byEmail, HOUR / MINUTE; JSON 429 by default
  src/lib/mailer.ts         # Mailer interface + createSmtpMailer (nodemailer; Mailpit in dev)
  src/lib/storage.ts        # Storage interface (put/delete) + createS3Storage (AWS SDK, path style) + enableWebsiteAccess + mediaUrl(key) = /media/<key>
  src/middleware/errorHandler.ts       # notFound (JSON 404) + errorHandler (HttpError / bad JSON / 500 without details in prod)
  src/middleware/originCheck.ts        # CSRF: non-GET requests must have Origin == APP_ORIGIN, else 403 forbidden_origin
  src/modules/health/health.routes.ts  # GET /api/health → 200 {ok,db:"up"} or 503 {ok:false,db:"down"}
  src/modules/groups/groups.repository.ts  # list / getById / listByOwner / create / getOwned / updateOwned (editable fields only) / deleteOwned
  src/modules/groups/groups.routes.ts      # GET list + detail (public); POST, PATCH, DELETE (requireAuth, owner only, others → 404)
  src/modules/groups/groups.routes.test.ts # HTTP layer with a fake repository: validation, 400/404, response shape
  src/modules/groups/groups.db.test.ts     # real Postgres: every filter, search escaping, pagination, detail
  src/modules/groups/groups.write.db.test.ts  # two users: create/edit/delete ownership, fixed link/platform, my groups
  src/modules/auth/passwords.ts            # argon2id hashPassword / verifyPassword + DUMMY_HASH (timing-safe login)
  src/modules/auth/tokens.ts               # newSessionToken() (32 random bytes) + hashToken() (sha256 hex)
  src/modules/auth/cookies.ts              # session cookie: sid / __Host-sid, httpOnly, SameSite=Lax, Secure in prod; TTL 30d, renew <15d; google_oauth cookie (state.verifier, 10 min)
  src/modules/auth/startSession.ts         # startSession(): new session row + cookie, drops the old one (rotation); used by every sign-in path
  src/modules/auth/sessions.repository.ts  # create / findValid (join users, DB clock) / extend / delete / deleteExpired
  src/modules/auth/session.middleware.ts   # loadSession (cookie → req.user, sliding renewal), requireAuth (401), requireVerified (403), signedInUser(req) (typed user or 401), unauthenticated()
  src/modules/auth/emailTokens.repository.ts  # issue (cancels older) / consume (one atomic UPDATE: unused + unexpired + purpose)
  src/modules/auth/emails.ts               # verifyEmailMessage / resetPasswordMessage (text + escaped HTML)
  src/modules/auth/google.ts               # GoogleOAuth interface + createGoogleOAuth (arctic: PKCE URL, code exchange) + parseGoogleClaims (iss/aud/email_verified)
  src/modules/auth/google.routes.ts        # GET /api/auth/google (state + PKCE cookie → redirect) and /callback (checks → sign in → redirect; errors → /login?error=)
  src/modules/auth/oauthAccounts.repository.ts  # signInWithGoogle: by sub → by verified email (link) → unverified email (pre-hijack wipe) → create; one transaction
  src/modules/auth/google.test.ts          # no DB: claim checks, redirects, state/cookie checks, cancel, unverified, failed exchange
  src/modules/auth/google.db.test.ts       # real Postgres: create, reuse, email change, link, case-insensitive, pre-hijack defence, rotation
  src/modules/auth/auth.routes.ts          # register / login / logout / me + verify-email(/request), forgot-password, reset-password; rate limits
  src/modules/auth/auth.db.test.ts         # full flow with real Postgres + argon2 (cookie flags, hashing, 409/401/429, expiry)
  src/modules/auth/emailFlows.db.test.ts   # verify + reset with a fake mailer: one-time, expiry, cancel, no enumeration, sign-out
  src/modules/users/users.repository.ts    # findForLogin / create (EmailTakenError) / updateProfile / setAvatarKey (FOR UPDATE, returns the old key); USER_COLUMNS never include password_hash; avatar_url = mediaUrl(avatar_key)
  src/modules/users/users.routes.ts        # PATCH /api/users/me + GET /me/groups + PUT/DELETE /me/avatar (multer memory, 5 MB, 20/h per user; put new → set key → delete old)
  src/modules/users/avatarImage.ts         # toAvatarWebp: real format must be jpeg/png/webp (no SVG), ≤50M pixels, rotate + 512×512 cover + WebP, EXIF dropped
  src/modules/users/avatarImage.test.ts    # no DB: formats in, SVG/HTML/GIF/corrupt out, EXIF removed
  src/modules/users/avatar.db.test.ts      # real Postgres + fake storage: upload, replace (old object deleted), SVG/HTML as .png, 413, 401/403, delete

packages/shared/            # @urconnections/shared: TS source imported directly (no build step)
  src/index.ts              # public exports (import only from "@urconnections/shared")
  src/topics.ts             # TOPICS (as const) + Topic type
  src/platforms.ts          # PLATFORMS: key, label, linkPattern (RegExp), placeholder; PLATFORM_KEYS/MAP, isPlatformKey
  src/countries.ts          # COUNTRIES_CITIES (stored pre-sorted), COUNTRY_LIST, getCities(), isCountry()
  src/schemas/group.ts      # createGroupSchema (input), updateGroupSchema (strict: EDITABLE_GROUP_FIELDS only), groupSchema,
                            # groupListQuerySchema, groupListResponseSchema, myGroupsResponseSchema; matching types
  src/schemas/auth.ts       # login/register/signup/password + verifyEmail, forgotPassword(+Response), resetPassword(+Form) schemas
  src/schemas/user.ts       # userSchema (API user, never a hash) + meResponseSchema ({ user | null }); User type
  src/schemas/profile.ts    # profileFields (display_name, phone, country, city) → profileSchema (form) + profileUpdateSchema (PATCH)

web/                        # the React app (Vite)
  index.html                # Vite entry; title "UrConnections"
  vite.config.ts            # react() + tailwindcss(); dev proxy /api → http://localhost:3000, /media → Garage website :3902 (Host = <bucket>.web.garage.localhost)
  vercel.json               # SPA rewrite + security headers (CSP report-only). Vercel Root Directory must be `web` if deployed
  tsconfig.json / tsconfig.app.json / tsconfig.node.json   # Vite-template layout; allowJs during the JS→TS migration
  public/favicon.svg
  src/
    main.jsx                # QueryClientProvider (lib/queryClient) + ReactQueryDevtools + <App/>
    App.jsx                 # createBrowserRouter route tree + loaders requireAuth / redirectIfAuth
    index.css               # Inter font @import, Tailwind, base layer (border color, cursor), --nav-height, .hide-scrollbar, .animate-fade-in
    vite-env.d.ts           # Vite client types (no VITE_* variables are used)
    GenealComponents/       # (sic, typo; renamed in Stage 11) app shell
      RootLayout.jsx        # <ScrollRestoration/> (React Router: top on new pages, restored on Back) + <Outlet/>
      MainLayout.jsx        # sticky nav + <Outlet/> + footer (all inline)
    lib/
      pageTitle.ts          # pageTitle(name?) → "name · UrConnections"; pages render <title>{pageTitle(...)}</title> (React 19 hoists it into <head>)
      queryClient.ts        # shared QueryClient (staleTime 60s, no refetch on focus); also used by route loaders
      apiClient.ts          # apiGet / apiSend / apiSendNoContent: same-origin fetch (cookie sent), JSON or FormData body, ApiError, zod-validated JSON
      platforms.ts          # UI side of platforms: icon + Tailwind badge colors per PlatformKey; PLATFORMS, getPlatform(key)
    services/
      auth.service.ts       # our API: getMe, register, login, logout, updateProfile (no tokens in JS: the cookie is httpOnly)
    features/
      auth/
        components/AuthPage.jsx       # login + signup via our API; authResolver picks loginSchema/signupSchema; Google = link to /api/auth/google; shows ?error= via oauthErrorMessage
        hooks/useUser.ts              # SESSION_QUERY_KEY, sessionQueryOptions (GET /api/auth/me), useUser, useSetUser, useSignOut
        hooks/useEmailFlows.ts        # useVerifyEmail, useResendVerification, useForgotPassword, useResetPassword
        components/AuthCard.jsx       # shared centered layout + Notice + input/button classes for the small auth pages
        components/VerifyEmailPage.jsx   # /verify-email?token=: button-triggered (scanners and StrictMode can't use the token up)
        components/ForgotPasswordPage.jsx # /forgot-password
        components/ResetPasswordPage.jsx  # /reset-password?token=
        components/VerifyEmailBanner.jsx  # under the nav for signed-in, unverified users; Resend email
      groups/
        api/groupsApi.ts              # all via our API: getGroups, getGroupById, getMyGroups, createGroup, updateGroup, deleteGroup
        api/queryKeys.ts              # groupKeys factory: all / lists / list(filters) / mine / detail
        hooks/useGroups.ts            # useInfiniteQuery over getGroups: pages + fetchNextPage, keepPreviousData
        hooks/useGroupFilters.ts      # filters from/to the URL; saved search; one-time location preset
        hooks/useMyGroups.ts          # groupKeys.mine(): GET /api/users/me/groups (skipToken until signed in)
        hooks/useUpdateGroup.ts       # PATCH → storeSavedGroup
        hooks/groupCache.ts           # storeSavedGroup(queryClient, group): cache its detail + invalidate every group list
        hooks/useGroup.ts             # groupKeys.detail(id), via the API (skipToken while there's no id)
        hooks/useCreateGroup.ts       # POST → storeSavedGroup (form shows errors)
        hooks/useDeleteGroup.ts       # DELETE → remove detail, invalidate lists; alert() on error (toast in Stage 11)
        hooks/useUserLocation.ts      # ['userLocation']: ipapi.co, localStorage cache with 7-day TTL, never throws
        utils/savedSearch.ts          # read/save/clearSavedSearch(): last home search per tab ("" = user cleared filters)
        components/GroupList.jsx      # home page: FilterBar + server-filtered grid + Load more
        components/FilterBar.jsx      # hero search (uncontrolled input) + sticky selects + topic pills; props: filters, onChange(key, value), onSearch
        components/GroupCard.jsx      # card: badges, Connect / View Details; owner (user.id === group.user_id) also sees Edit + Delete
        components/GroupDetail.jsx    # /groups/:groupId; owner sees Edit Group / Delete Group
        components/GroupForm.jsx      # shared create/edit form (edit: platform + link read-only)
        components/EditGroupPage.jsx  # /groups/:groupId/edit (requireAuth); non-owners see Not Found
        components/CreateGroupForm.jsx # /create: GroupForm mode="create" → POST, then opens the new group
      profile/
        components/ProfilePage.jsx    # /profile: read/edit form (profileSchema) + the user's groups grid
        components/ProfileAvatar.jsx  # avatar display + upload/remove; quick type/size check (AVATAR_MIME_TYPES, AVATAR_MAX_BYTES) before sending
        api/avatarApi.ts              # uploadAvatar(file) = PUT multipart, removeAvatar() = DELETE; both return the updated user
        hooks/useAvatar.ts            # useUploadAvatar, useRemoveAvatar → the returned user goes into ['session'] (useSetUser)
        hooks/useUpdateProfile.ts     # PATCH /api/users/me → setQueryData(SESSION_QUERY_KEY, user)
```
**TypeScript status:** `packages/shared` and the whole web data layer (`lib`, `services`, `hooks`, `api`, `utils`) are TS. Components (`.jsx`) are converted in Stage 11.

## API (Stage 3)
- **Dev:** `npm run db:up` starts Postgres, Mailpit and Garage, then `npm run dev` runs web (:5173) and api (:3000) together. The browser calls `/api/*` on :5173, and Vite forwards it to :3000, so it's the same origin as production.
- **Response contract:** success is plain JSON. Errors are always `{ "error": { "code": "...", "message": "..." } }` with a matching HTTP status. Throw `HttpError` in routes; Express 5 forwards async errors to `errorHandler`.
- **Dependency injection:** `createApp(deps)` receives things like `checkDatabase`, so tests use fakes and never need a database or an open port.
- **Endpoints so far:**
  - `GET /api/health`
  - `GET /api/groups?query&topic&country&city&platform&cursor&limit`: newest first, `{ items, nextCursor }`. limit 1–50 (default 24); bad values → 400 with `details`
  - `GET /api/groups/:id`: one group; unknown or malformed id → 404
  - `POST /api/auth/register` → 201 `{ user }` + session cookie (409 email_taken, 400 policy) · `POST /api/auth/login` → 200 `{ user }` (401 invalid_credentials, 429) · `POST /api/auth/logout` → 204 · `GET /api/auth/me` → `{ user | null }` (no-store)
  - `PATCH /api/users/me` → `{ user }` (401 without a session) · `GET /api/users/me/groups` → `{ items }`
  - `PUT /api/users/me/avatar` (multipart field `avatar`) → `{ user }` (400 invalid_image / invalid_upload, 413 file_too_large, 429) · `DELETE /api/users/me/avatar` → `{ user }`
  - `POST /api/auth/verify-email/request` (session) → 204 · `POST /api/auth/verify-email` `{ token }` → 204 (400 invalid_token) · `POST /api/auth/forgot-password` `{ email }` → always 202 `{ message }` · `POST /api/auth/reset-password` `{ token, password }` → 204, all sessions ended
  - `POST /api/groups` → 201 group (owner = session user; a body `user_id` is ignored; **403 email_not_verified** without a verified email) · `PATCH /api/groups/:id` → group (title, description, topic, country, city; meeting_link/platform → 400) · `DELETE /api/groups/:id` → 204. Writes need a session (401). **Not your group → 404**, the same as a missing one.
- **Pagination:** cursor = id of the last item. uuidv7 ids sort by creation time, so the next page is `where id < cursor order by id desc limit n+1` (the extra row says whether more exist).
- **Database workflow:** `npm run db:up` (container) → `npm run db:migrate` (tables) → `npm run db:seed` (demo data). `npm run db:reset` rebuilds from scratch. `npm run test:db` runs the DB tests in the separate `urconnections_test` database, so dev data is never touched.

## 2. Routing (`web/src/App.jsx`)

```
RootLayout (no path)
├── "/"  MainLayout
│   ├── index              GroupList
│   ├── groups/:groupId    GroupDetail
│   ├── groups/:groupId/edit  EditGroupPage  loader: requireAuth
│   ├── create             CreateGroupForm   loader: requireAuth  (redirect /login if no session)
│   └── profile            ProfilePage       loader: requireAuth
├── "login"                AuthPage          loader: redirectIfAuth (redirect / if session)
├── "verify-email"         VerifyEmailPage   (public: the link may be opened in another browser)
├── "forgot-password"      ForgotPasswordPage
└── "reset-password"       ResetPasswordPage
```
- The loaders read the session through the cache: `queryClient.ensureQueryData(sessionQueryOptions)`, with the shared `queryClient` in `web/src/lib/queryClient.ts`.
- There is no `errorElement`, no 404/catch-all route, and no `React.lazy`. Every page is bundled eagerly.
- `RootLayout` renders React Router's `<ScrollRestoration/>`. Each page sets its tab title with a React 19 `<title>` element (`lib/pageTitle.ts`).

## 3. Data layer

### TanStack Query keys
| Key | Defined in | Fetches | Invalidated by |
|---|---|---|---|
| `['session']` (`SESSION_QUERY_KEY`) | `useUser` (`sessionQueryOptions`) | `GET /api/auth/me` → `User \| null`, `staleTime: Infinity` | set directly by login/register (`useSetUser`), profile update, and sign-out (`null`) |
| `['groups','list',filters]` (`groupKeys.list(filters)`) | `useGroups` (infinite) | pages from `GET /api/groups` | create/edit/delete (`groupKeys.all`) |
| `['groups','mine']` (`groupKeys.mine()`) | `useMyGroups` | `GET /api/users/me/groups` | create/edit/delete (`groupKeys.all`); removed on sign-out |
| `['groups','detail',id]` (`groupKeys.detail`) | `useGroup` | `GET /api/groups/:id` | set by create/edit; removed on its own delete |
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

### Auth flow (own API, Stage 6)
1. **Sign up / sign in:** `AuthPage` → `register()` / `login()` → API validates (shared schemas), hashes or verifies the password with argon2id, creates a `sessions` row holding only `sha256(token)`, and sets the token in an **httpOnly, SameSite=Lax** cookie (`sid`; `__Host-sid` + Secure in production). The response's `user` goes into `['session']` via `useSetUser`.
2. **Every request:** `loadSession` hashes the cookie token, looks up a non-expired session joined with its user (DB clock), and sets `req.user`. Under 15 days left → extended to 30 days and the cookie re-sent (sliding expiry). `requireAuth` → 401 without a user.
3. **CSRF:** SameSite=Lax cookie + `originCheck`: every non-GET request needs `Origin === APP_ORIGIN` (403 otherwise). The Vite proxy and Caddy keep it same-origin.
4. **Abuse limits:** login 30 / 15 min per IP (IPv6 /56) and 10 failed attempts / 15 min per email; register 10 / hour per IP → 429. One generic 401 message plus a dummy argon2 check for unknown emails, so neither text nor timing reveals which emails exist. Register does reveal it (409, a documented trade-off until Stage 8).
5. **Login rotates the session** (the old token is deleted). **Logout** deletes the row, so a copied cookie stops working. Expired sessions are cleaned at API start and every 6 h.
6. **Route guards** (`requireAuth` / `redirectIfAuth` in `App.jsx`) read `['session']` through `ensureQueryData`, so `/me` is called once.
7. **Email flows (Stage 8):** links carry a 32-byte token; only `sha256(token)` is stored in `email_tokens` (verify 24 h, reset 1 h). `consume` is one atomic `UPDATE … WHERE unused AND unexpired AND purpose … RETURNING user_id`, so a link works once even under races, and issuing a new one deletes the older ones. Sign-up sends a verify email (a mail failure doesn't fail sign-up). Forgot-password replies 202 *before* looking anything up (same text and timing for every email). Reset sets the hash, deletes **all** the user's sessions and marks the email verified. Creating groups requires `email_verified` (`requireVerified`).
8. **Google sign-in (Stage 9):** the Google button is a plain link to `GET /api/auth/google`. The API makes `state` and a PKCE verifier (32 random bytes each), keeps them in the 10-minute httpOnly `google_oauth` cookie (SameSite=Lax, so it survives Google's top-level redirect back), and redirects to Google (`openid email profile`, `prompt=select_account`). `/callback` clears the cookie, checks `state`, exchanges `code` + verifier for an ID token (arctic, server to server), checks `iss`/`aud`/`email_verified`, then `signInWithGoogle` picks the user: linked `sub` → same **verified** email (link) → same **unverified** email (Google proves ownership: password removed, sessions ended, email verified; pre-hijack defence) → new user without password. Then `startSession` and a redirect to `/`. Any failure redirects to `/login?error=<code>`; the codes and messages are `OAUTH_ERROR_MESSAGES` in packages/shared.
9. **Avatars (Stage 10):** `PUT /api/users/me/avatar` → multer (memory, 5 MB) → `toAvatarWebp` (real format must be JPEG/PNG/WebP, ≤ 50 M pixels, 512×512 WebP, EXIF dropped) → `storage.put("avatars/<uid>/<uuid>.webp", Cache-Control: immutable)` → `setAvatarKey` (row lock, returns the old key) → delete the old object. A new key per upload = a new URL, so browsers may cache forever. Browsers read `/media/<key>`: Vite (later Caddy) proxies to Garage's read-only website endpoint, which the API enables at startup (`PutBucketWebsite`).

### Home page filter flow (`GroupList` → `useGroupFilters` + `useGroups`)
- **The URL is the only source of truth:** `?query&topic&country&city&platform`. `useGroupFilters` reads it into `filters` (for the UI) and `apiParams` (unknown values dropped), and `setFilter` / `clearFilters` write it (`replace: true`; changing country clears city).
- Every URL change is also saved as the tab's **saved search** (`utils/savedSearch.ts`, sessionStorage, no expiry). On a visit to `/` without params: a saved search is restored; a saved `""` (user cleared) stays empty; otherwise the detected location is applied once.
- `useGroups(apiParams)` = `useInfiniteQuery` keyed by the filters. The server filters and paginates; **Load more** calls `fetchNextPage`. `keepPreviousData` keeps old results visible while new filters load.
- The saved search is cleared on sign-in and sign-out.
- **Ownership (Stage 7):** every group has exactly one owner (`groups.user_id`, NOT NULL, FK to users). Create/edit/delete go through the API, which takes the owner from the session and checks it inside the SQL. The UI only *shows* Edit/Delete to the owner.

## 4. UI conventions (current reality)
- All styling is inline Tailwind class strings, and many are long and duplicated: inputs, labels, spinners, back buttons, CTA pills. Only `ProfilePage` extracts `INPUT_CLS`/`SELECT_CLS` constants.
- Colors are hard-coded hex values: `#0071e3` (accent), `#f5f5f7`, `#111111`, `#1d1d1f`, `#0a0a0a`, `#333336`. There are no theme tokens (Tailwind v4 `@theme` is unused).
- Dark mode uses the `dark:` variant, driven by the system preference. There's no manual toggle, although the style guide asks for one.
- Icons are inline `<svg>` paths (chevron, X, pin, camera, check, pencil) plus `react-icons` for platforms and Google.
- Feedback is a mix of `alert()`, `window.confirm()`, inline error boxes, and one hand-rolled toast in ProfilePage.

## 5. External services
- Garage (self-hosted, Docker): avatar storage. (v1 on `main` still uses Supabase until Stage 16.)
- ipapi.co (client-side IP geolocation, 5s timeout, fails silently)
- Google Fonts (Inter, `@import` in CSS)
