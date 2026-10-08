# CLAUDE.md — UrConnections (repo: Find_Study)

A React SPA for finding study and interest groups by topic, country/city, and platform (WhatsApp, Discord, …).
Users can sign up, create groups that link to an external chat, and manage a profile with an avatar.
Supabase handles auth, Postgres, and storage. The app is deployed on Vercel.

## Commands
```bash
npm run dev      # Vite dev server
npm run build    # production build -> dist/
npm run lint     # ESLint (flat config). Currently clean (0 problems). Keep it that way
npm run preview
```
There are no tests and no TypeScript. The code is plain JS/JSX.

## Stack
React 19 · Vite 8 · Tailwind v4 (`@tailwindcss/vite`, no tailwind.config) · React Router 7 (data router, `createBrowserRouter`) ·
TanStack Query 5 · react-hook-form + zod 4 · Supabase JS v2 · react-icons · browser-image-compression · @vercel/analytics.

## Env vars (`.env`, gitignored)
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, `VITE_AUTH_REDIRECT_URL` (OAuth redirect).
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
- Components never call `supabase.*` directly. Auth goes through `src/services/auth.service.js`, and DB access goes through `features/*/api`.
- Server state uses TanStack Query only. Don't fetch in `useEffect`. Route guards go in RR7 `loader`s, ideally through `queryClient.ensureQueryData`.
- The global session key is `['session']`. Invalidate it on auth or profile changes.
- Select explicit columns, not `*`. Assume the client is compromised: security lives in Supabase RLS.
- Style with Tailwind utilities in markup. Extract repeated UI into React components, not `@apply`.
- Design language: "Aspirational Minimalism" (Apple-like). Accent `#0071e3`, black/white with `#f5f5f7`/`#1d1d1f` bands, light and dark via `prefers-color-scheme` (Tailwind `dark:`). Typography is Inter with huge, tight headlines.

## Working conventions
- Work on the `dev` branch. `main` is production.
- Match the existing code style: double quotes in components, function components with default exports, and hooks named `useX` in `features/<feature>/hooks`.
- After changes, run `npm run lint` and `npm run build`.
- When you fix an audit item, update its status in `docs/CODE_AUDIT.md`.
