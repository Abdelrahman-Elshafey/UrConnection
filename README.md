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
| Backend | Supabase (Postgres, Auth, Storage) | Node.js + Express 5 API, Postgres (Kysely), own session auth (argon2id), MinIO |
| Hosting | Vercel | Docker Compose on a VPS behind Caddy (HTTPS) |

## Getting started
Requirements: **Node.js 24** (LTS) and npm.

```bash
npm install                      # installs every workspace (one lockfile at the root)
cp web/.env.example web/.env     # then fill in your Supabase URL, key and redirect URL
npm run dev                      # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | start the Vite dev server for `web/` |
| `npm run build` | production build into `web/dist/` |
| `npm run preview` | serve the production build locally |
| `npm run typecheck` | strict TypeScript check of every package |
| `npm run lint` | ESLint for the whole repo |

## Project structure
```
web/              React app (Vite)
packages/shared/  @urconnections/shared: zod schemas, types, topics, platforms, countries
docs/             architecture, code audit, master plan, security runbook
supabase/         v1 database security SQL (RLS, constraints, storage policies)
```
More detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
