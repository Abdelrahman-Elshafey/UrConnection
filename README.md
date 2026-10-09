# UrConnections

Find study and interest groups near you, or online. Browse groups by topic, country/city, and platform (WhatsApp, Discord, Telegram, …), create your own group with a link to its chat, and manage your profile.

> **Status: rebuilding (v2).** The live version (tag [`v1-supabase`](../../tree/v1-supabase)) is React + Supabase.
> v2 is being built stage by stage as a TypeScript monorepo with its own Express API, authentication, Postgres, and Docker deployment.
> Plan and progress: [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md).

## Features
- **Discover groups**: search, filter by topic / country / city / platform, with your country and city pre-selected from your location
- **Create groups**: validated form; the meeting link must match the chosen platform
- **Accounts**: email + password sign-up and login, Google sign-in
- **Profile**: edit your details and upload an avatar (compressed in the browser; JPEG/PNG/WebP only)
- Light and dark mode (follows the system), responsive layout

## Tech stack
| Part | Now | v2 (in progress) |
|---|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router 7, TanStack Query, react-hook-form | same, fully in TypeScript |
| Validation | zod schemas shared between packages (`packages/shared`) | the same schemas, also used by the API |
| Backend | Supabase (Postgres, Auth, Storage) | Node.js + Express 5 API, Postgres (Kysely), own session auth (argon2id), S3-compatible file storage (chosen in Stage 10) |
| Hosting | Vercel | Docker Compose on a VPS behind Caddy (HTTPS) |

## Getting started
Requirements: **Node.js 24** (LTS), npm, and **Docker Desktop** (running).

```bash
npm install                      # installs every workspace (one lockfile at the root)
cp web/.env.example web/.env     # then fill in your Supabase URL, key and redirect URL
cp api/.env.example api/.env     # dev defaults work as-is with docker-compose.yml
npm run db:up                    # start Postgres in Docker (127.0.0.1:5433)
npm run db:migrate               # create the tables
npm run db:seed                  # optional: 3 demo users and 60 demo groups
npm run dev                      # web on http://localhost:5173, API on http://localhost:3000
```
Check the API: http://localhost:5173/api/health → `{"ok":true,"db":"up"}`

| Command | What it does |
|---|---|
| `npm run dev` | start web (Vite) and api (Express) together |
| `npm run db:up` / `db:down` / `db:logs` | start / stop / follow the Postgres container |
| `npm run db:migrate` / `db:rollback` / `db:reset` | apply / undo the last / rebuild all migrations |
| `npm run db:seed` | fill the database with demo data (development only) |
| `npm test` | unit tests (API: Vitest + Supertest; no database needed) |
| `npm run test:db` | database tests against a separate test database |
| `npm run build` | production build into `web/dist/` |
| `npm run preview` | serve the production build locally |
| `npm run typecheck` | strict TypeScript check of every package |
| `npm run lint` | ESLint for the whole repo |

## Project structure
```
web/              React app (Vite)
api/              Express 5 API (TypeScript): config, logging, errors, /api/health, Postgres schema (Kysely migrations)
packages/shared/  @urconnections/shared: zod schemas, types, topics, platforms, countries
docker-compose.yml  development services (Postgres)
docs/             architecture, code audit, master plan, security runbook
supabase/         v1 database security SQL (RLS, constraints, storage policies)
```
More detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
