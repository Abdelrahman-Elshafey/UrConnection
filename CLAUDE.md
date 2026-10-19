# CLAUDE.md — UrConnections (repo: Find_Study)

A React SPA for finding study and interest groups by topic, country/city, and platform (WhatsApp, Discord, …).
Users can sign up, create groups that link to an external chat, and manage a profile with an avatar.
Supabase handles auth, Postgres, and storage. The app is deployed on Vercel.

## Commands
Monorepo (npm workspaces), so run everything from the **repo root**:
```bash
npm install         # installs all workspaces; one lockfile at the root
npm run db:up       # start Postgres (127.0.0.1:5433) + Mailpit + Garage in Docker and wait until healthy; db:down / db:logs
                    # Mailpit catches every email the API sends: inbox at http://localhost:8025
                    # Garage = S3-compatible storage for avatars (S3 API :3900, website endpoint :3902)
npm run dev         # web (Vite :5173) + api (Express :3000) together; dev:web / dev:api for one (api restarts on code or api/.env changes)
npm run stop:dev    # stop leftover dev servers on 3000/5173/4173 (node only); `-- 3000` for one port. Vite uses strictPort, the API exits on EADDRINUSE
npm run db:migrate  # apply new migrations; db:rollback (undo last) · db:reset (rebuild, dev only) · db:seed (demo data)
npm test            # unit tests of every workspace (api: Vitest + Supertest, no DB needed)
npm run test:db     # database tests in the separate urconnections_test DB (needs db:up)
npm run typecheck   # tsc -b over web + api + packages/shared (strict)
npm run lint        # ESLint for the whole repo (flat config at root). Keep it at 0 problems
npm run build       # production builds: web/dist/ (Vite) + api/dist/ (esbuild bundle, run with `node dist/index.js`)
npm run prod:env    # once: .env.prod (gitignored) with random secrets from .env.prod.example
npm run prod:up     # whole production stack in Docker at https://localhost (compose.prod.yml + Caddyfile); prod:down / prod:logs / prod:backup
```
Port 5432 on this machine is taken by a native Windows Postgres, so the Docker one uses **5433**. Docker Desktop must be running (`docker info`); it does not auto-start after a reboot. An `ECONNREFUSED ...:5433` error almost always means Docker/Postgres is down: start Docker Desktop (`C:\Users\HP\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe`), then `npm run db:up`.
Layout: `web/` = React app, all TypeScript (`allowJs` off). **Build pages from the UI kit in `web/src/components/ui`** (Button/ButtonLink, Field components with linked labels, CountryCityFields via `FormProvider`, Notice, ConfirmDialog, `useToast()`, Spinner/PageSpinner, Avatar, PlatformBadge, PageHero, BackLink, NotFound); colors are `@theme` tokens (`bg-accent`, `bg-surface`, …) in `index.css`. Layout: `components/layout` (Navbar, Footer, RouteError). Pages set `<title>{pageTitle("…")}</title>`. **New pages are lazy routes** in `App.tsx` (`lazy: page(() => import("…"))`, own chunk); only the home page is eager. Keep the home bundle (index + vendor chunk) ≤ 190 KB gzip (151 after Stage 12).
`packages/shared/` = `@urconnections/shared` (TS source imported directly, no build step): topics, platforms (no UI), country names, and **zod schemas + inferred types** (`createGroupSchema`/`Group`, `loginSchema`, `signupSchema`, `profileSchema`). Validation rules live there, not in components. Shared schemas import `z` from `packages/shared/src/zod.ts`, never from "zod" (ESLint enforces it): it turns on zod's `jitless` mode in browsers because the production CSP forbids eval. City lists are a separate entry, `@urconnections/shared/cities` (never re-export it from `index.ts`); the web reads them only through `useCities()` (`web/src/lib/cities.ts`), which loads them on demand.
`api/` = `@urconnections/api`: Express 5 + TS run by `tsx` in dev (production: esbuild bundle in `api/Dockerfile`, see `api/build.js`), `createApp(deps)` in `app.ts` (tests inject fakes), env validated in `config.ts` (`api/.env`, template `api/.env.example`), errors as `{ error: { code, message } }` via `HttpError`. DB: Kysely (`db` from `api/src/db/db.ts`), **hand-written** table types in `api/src/db/types.ts`, raw-SQL migrations in `api/src/db/migrations/` (never edit one that has run; add the next number and register it in `migrations/index.ts`). `tsx` does not type-check: always run `npm run typecheck`. React Query keys come from `features/groups/api/queryKeys.ts` (`groupKeys`) and `SESSION_QUERY_KEY`.
**Data sources right now:** group reads (home list, detail), **auth** (register/login/logout/me, Google sign-in) and **profile edits** go to **our API** via `web/src/lib/apiClient.ts` (`apiGet` / `apiSend` / `apiSendNoContent`, responses validated with shared schemas; the session is an httpOnly cookie that JS never touches). **Groups are fully on our API** (list, detail, create, edit, delete, my groups). **Avatars** too: `PUT`/`DELETE /api/users/me/avatar` (multer → sharp → 512px WebP → Garage via `lib/storage.ts`); browsers load them from `/media/<key>` (Vite proxy → Garage website endpoint). **The web app no longer uses Supabase at all** (client and deps removed in Stage 10; v1 on `main` still does). Home filters: `useGroupFilters` (URL is the source of truth) + `useGroups` (infinite query).
**Auth (api):** `loadSession` sets `req.user` from the cookie; put `requireAuth` on routes that need a user and read it with `signedInUser(req)` (no `req.user!`); never take a user id from the request body. Rate limits: `limitRequests({ limit, windowMs, key })` from `api/src/lib/rateLimit.ts`. Ownership: write queries filter `WHERE id AND user_id = req.user.id`; non-owners get 404. Group edits may change only `EDITABLE_GROUP_FIELDS` (meeting link + platform are fixed). All non-GET requests need `Origin: APP_ORIGIN` (tests: `.set("Origin", "http://localhost:5173")`). Creating groups also needs `requireVerified` (verified email). Demo logins after `npm run db:seed`: alice@ / bob@ / carol@example.com, password `Demo123!pass` (already verified). Tests that send email use `fakeMailer()` from `api/src/test/fakes.ts`, file uploads use `fakeStorage()`; Google tests use `fakeGoogle()` (never the real Google). Every sign-in path goes through `startSession()` (session rotation).
CI (`.github/workflows/ci.yml`) runs `npm ci`, lint, typecheck, test and build on every push and PR.

## Stack
React 19 · Vite 8 · Tailwind v4 (`@tailwindcss/vite`, no tailwind.config) · React Router 7 (`react-router` package, data router, `createBrowserRouter`) ·
TanStack Query 5 · react-hook-form + zod 4 · react-icons.
API: Express 5 · Kysely + pg · argon2 · arctic (Google OAuth) · nodemailer · multer + sharp + @aws-sdk/client-s3 (avatars) · pino.

## Env vars (gitignored `.env` files; templates committed as `.env.example`)
- `web/.env`: none needed any more (no `VITE_*` variables are used; every setting lives in the API).
- `api/.env`: `NODE_ENV`, `PORT`, `DATABASE_URL`, `LOG_LEVEL`, `APP_ORIGIN` (the site's origin for the CSRF check and for links in emails; default http://localhost:5173), `SMTP_URL` (default smtp://localhost:1025 = Mailpit), `MAIL_FROM`, `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (optional, both or neither; empty = Google sign-in off; redirect URI = `APP_ORIGIN/api/auth/google/callback`), `S3_ENDPOINT` / `S3_REGION` / `S3_BUCKET` (defaults = Garage in Docker) + `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` (required; dev values in `.env.example`). Dev values match docker-compose.yml.
Never print or commit `.env` or `recovery-codes.txt`.

## Direction (decided 2026-10-08)
The project is being rebuilt as a **TypeScript monorepo**: Express + Node API, its own auth, Postgres, Docker, and self-hosted on a VPS.
**[docs/MASTER_PLAN.md](docs/MASTER_PLAN.md) is the plan to follow**, stage by stage (one branch and PR per stage; check its progress table for the current stage).
The owner's goal is **learning**: explain the *why* of each new concept while implementing it. The v1 site stays on Supabase until Stage 16. **No data migration**: v1 has only test data, so v2 starts fresh.

## Where to look
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**: file map, routing, data flow, query keys, the Supabase data model, and the conventions the code follows today.
- **[docs/CODE_AUDIT.md](docs/CODE_AUDIT.md)**: numbered list of bugs (B), security (S), duplication (D), over-engineering (O), performance with measured bundle sizes (P), and accessibility (A), with IDs like `B22`, `P3`. Start here before refactoring.
- **[docs/SUPABASE.md](docs/SUPABASE.md)**: database security runbook (RLS, constraints, storage, dashboard settings, CSP rollout). SQL lives in `supabase/` (`inspect.sql` + `migrations/`). The DB schema isn't otherwise in the repo.
- **[docs/REFACTOR_ROADMAP.md](docs/REFACTOR_ROADMAP.md)**: the earlier frontend-only plan. Phases 0–1 are done. Phases 2–6 are **superseded by MASTER_PLAN.md**, but their audit IDs are folded into its stages.
- **[.agents/rules/](.agents/rules/)**: the owner's standing rules (general, auth, style guide). They are the intended standards, and the code doesn't fully meet them yet.

## Key rules (from .agents/rules, summarized)
- Components never call `supabase.*` or `fetch` directly. Auth goes through `web/src/services/auth.service.ts`, and data access goes through `features/*/api` (both use `lib/apiClient.ts`).
- Server state uses TanStack Query only. Don't fetch in `useEffect`. Route guards go in RR7 `loader`s, ideally through `queryClient.ensureQueryData`.
- The global session key is `['session']` (value: `User | null`). Update it with `useSetUser` after login/register/profile changes; `useSignOut` sets it to null.
- Select explicit columns, not `*`. Assume the client is compromised: security lives in Supabase RLS.
- Style with Tailwind utilities in markup. Extract repeated UI into React components (in `components/ui`), not `@apply`.
- Design language: "Aspirational Minimalism" (Apple-like). Accent `#0071e3`, black/white with `#f5f5f7`/`#1d1d1f` bands, light and dark via `prefers-color-scheme` (Tailwind `dark:`). Typography is Inter with huge, tight headlines.

## Working conventions
- Work on the `dev` branch. `main` is production.
- Match the existing code style: double quotes, pages/feature components as default exports, UI-kit components as named exports, hooks named `useX` in `features/<feature>/hooks`. A `.tsx` file exports only components (React fast refresh): helpers go in `.ts` files.
- After changes, run `npm run lint` and `npm run build`.
- When you fix an audit item, update its status in `docs/CODE_AUDIT.md`.
