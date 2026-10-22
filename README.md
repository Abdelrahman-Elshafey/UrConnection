# UrConnections

Find study and interest groups near you, or online. Browse groups by topic, country/city, and platform (WhatsApp, Discord, Telegram, …), create your own group with a link to its chat, and manage your profile.

> **Status: rebuilding (v2).** The live version (tag [`v1-supabase`](../../tree/v1-supabase)) is React + Supabase.
> v2 is being built stage by stage as a TypeScript monorepo with its own Express API, authentication, Postgres, and Docker deployment.
> Plan and progress: [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md).

## Features
- **Discover groups**: search, filter by topic / country / city / platform, with your country and city pre-selected from your location
- **Create groups**: validated form; the meeting link must match the chosen platform
- **Manage your groups**: only the creator can edit (title, description, topic, location) or delete a group; the link and platform stay fixed
- **Accounts**: email + password sign-up and login on our own API (argon2id passwords, secure session cookies), email verification, forgot/reset password, and "Continue with Google" (OAuth 2.0 with PKCE, handled by our API)
- **Profile**: edit your details and upload an avatar (JPEG/PNG/WebP up to 5 MB; the API checks the real image, converts it to a 512px WebP and stores it in S3-compatible storage)
- Light and dark mode (follows the system), responsive layout

## Tech stack
| Part | Now | v2 (in progress) |
|---|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router 7, TanStack Query, react-hook-form | same, fully in TypeScript |
| Validation | zod schemas shared between packages (`packages/shared`) | the same schemas, also used by the API |
| Backend | Supabase (Postgres, Auth, Storage) | Node.js + Express 5 API, Postgres (Kysely), own session auth (argon2id), S3-compatible file storage (Garage in Docker) |
| Hosting | Vercel | Docker Compose on a VPS behind Caddy (HTTPS) |

## Getting started
Requirements: **Node.js 24** (LTS), npm, and **Docker Desktop** (running).

```bash
npm install                      # installs every workspace (one lockfile at the root)
cp api/.env.example api/.env     # dev defaults work as-is with docker-compose.yml (add Google keys for Google sign-in)
npm run db:up                    # start Postgres (127.0.0.1:5433), Mailpit and Garage (avatar storage) in Docker
npm run db:migrate               # create the tables
npm run db:seed                  # optional: demo users and groups (log in as alice@example.com / Demo123!pass)
npm run dev                      # web on http://localhost:5173, API on http://localhost:3000
```
Check the API: http://localhost:5173/api/health → `{"ok":true,"db":"up"}`

**Emails in development** (verification, password reset) are caught by Mailpit and never really sent: read them at http://localhost:8025.

**Troubleshooting:** `Can't reach Postgres at localhost:5433` (or `ECONNREFUSED`) means the database container isn't running, usually because Docker Desktop isn't started (it doesn't start by itself after a reboot unless you enable *Settings → General → Start Docker Desktop when you sign in*). Start Docker Desktop, then run `npm run db:up`.

**`Port 3000 is already in use`** (API) or **`Port 5173 is already in use`** (Vite) means a dev server from an earlier run is still running in the background, often after a terminal was closed. Run `npm run stop:dev`, then start again. Both servers refuse to start on a taken port on purpose: Vite would otherwise move to 5174, where the API's CSRF check rejects every sign-in and save.

| Command | What it does |
|---|---|
| `npm run dev` | start web (Vite) and api (Express) together |
| `npm run stop:dev` | stop dev servers left running in the background (ports 3000, 5173, 4173; only `node` processes). One port: `npm run stop:dev -- 3000` |
| `npm run db:up` / `db:down` / `db:logs` | start / stop the dev containers (Postgres, Mailpit, Garage) / follow the Postgres log |
| `npm run db:migrate` / `db:rollback` / `db:reset` | apply / undo the last / rebuild all migrations |
| `npm run db:seed` | fill the database with demo data (development only) |
| `npm test` | unit tests (API: Vitest + Supertest; no database needed) |
| `npm run test:db` | database tests against a separate test database |
| `npm run build` | production builds: `web/dist/` (Vite) and `api/dist/` (esbuild) |
| `npm run prod:env` / `prod:up` / `prod:down` / `prod:logs` / `prod:backup` | production stack in Docker (see below) |
| `npm run preview` | serve the production build locally |
| `npm run typecheck` | strict TypeScript check of every package |
| `npm run lint` | ESLint for the whole repo |

## Production stack on your computer
The same containers that will run on the server (Stage 13). Needs Docker Desktop and free ports 80 and 443.

```bash
npm run prod:env     # once: creates .env.prod with random secrets (gitignored, never commit it)
npm run db:up        # optional: the dev Mailpit catches the production stack's email (http://localhost:8025)
npm run prod:up      # builds the images, starts everything, waits until healthy → https://localhost
npm run prod:logs    # follow the logs        npm run prod:down   stop (data stays in Docker volumes)
npm run prod:backup  # a database backup right now (one also runs at start and every 24 h)
```
- **Certificate warning:** for `localhost` Caddy signs its own certificate, so browsers warn. Either accept the warning, or trust Caddy's local root certificate once (Windows, current user):
  `docker compose -f compose.prod.yml --env-file .env.prod cp caddy:/data/caddy/pki/authorities/local/root.crt caddy-root.crt` then `certutil -addstore -user Root caddy-root.crt`.
- The production database starts empty (no seed data). Sign up; the verification email lands in Mailpit.
- Only Caddy is reachable from outside. It serves HTTPS, sends `/api` to the API and `/media` to Garage, and adds the security headers (Content Security Policy enforced).

## Project structure
```
web/              React app (Vite)
api/              Express 5 API (TypeScript): auth (sessions, argon2id), /api/groups (filters, search, pagination), Postgres schema (Kysely migrations)
packages/shared/  @urconnections/shared: zod schemas, types, topics, platforms, countries (+ `/cities` entry, loaded on demand)
docker-compose.yml  development services (Postgres, Mailpit, Garage)
compose.prod.yml    production stack (Caddy, web, api, migrate, Postgres, Garage, backup, offsite) + Caddyfile
docker/           Garage config, nginx config (web image), backup + off-site copy scripts
docs/             architecture, code audit, master plan, security runbook
supabase/         v1 database security SQL (RLS, constraints, storage policies)
```
More detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
