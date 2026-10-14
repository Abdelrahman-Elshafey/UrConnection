# Code Audit — UrConnections

> First pass: commit `86180e9`. Second pass (re-audit after the bug-fix pass): added B22–B30, S5–S11, and sections O (over-engineering), P (performance, measured), and A (accessibility).
> **Paths:** since Stage 1 the frontend is under `web/`, so `src/…` here means `web/src/…`.
> Each item has an ID so plans and commits can reference it ("fixes B4").
> Status: `[ ]` open · `[~]` partly done (see note) · `[x]` done · `[—]` won't fix (owner decision). Update this file when you fix something.
> Severity: **H** = user-visible bug or security/data risk · **M** = wrong behavior in edge cases or a rule violation · **L** = cleanliness.

## B — Bugs / correctness

| ID | Sev | Status | Where | Problem | Suggested fix |
|---|---|---|---|---|---|
| B1 | L | [x] | `index.html` | `<link href="/src/style.css">` points to a file that doesn't exist (404 in dev). | Remove the tag. CSS is imported in `main.jsx`. |
| B2 | H | [x] | `MainLayout.jsx` footer | Footer is `bg-black` in light mode, but the "Explore"/"Account" `<h4>`s are `text-black`, so they're invisible. There's also a stray `sm:text-` class. | Use `text-white` for the headings, or redesign the footer per the style guide (`#f5f5f7` light / `#1d1d1f` dark). |
| B3 | H | [x] | `MainLayout.jsx` nav | "Sign In", "Profile", and "Sign Out" have `hidden sm:block`, so on mobile a logged-out user has no Sign In in the nav. The Create Group button text is `text-[8px]` on mobile. | Add a mobile menu, or keep the auth links visible at a small size. |
| B4 | H | [x] | `GroupCard.jsx` | The delete (X) button shows on **every** card for everyone, including logged-out users on the home page. Only RLS prevents deletion, and non-owners just get an `alert` error. | Render delete only when `group.user_id === session.user.id`. Better: show it only on the profile page via a prop. Replace `window.confirm`. |
| B5 | M | [x] | `lib/groupSchema.js` | The messages don't match the limits: `min(20)` says "min 50" and `max(200)` says "max 500". `min(1)` is redundant before `min(20)`. | Align the numbers and messages. Consider showing field error messages: CreateGroupForm only shows red borders and never shows `errors.*.message`. |
| B6 | M | [x] | `AuthPage.jsx` | `clearFilterCache()` is called in the render body, which is a side effect during render and runs on every keystroke re-render. | Move it into an effect, or (better) into the sign-in/sign-out success path. |
| B7 | M | [x] | `services/auth.service.js` `signOut` | `localStorage.clear()` and `sessionStorage.clear()` wipe **all** storage, including the IP location cache. The clearing also happens before the `error` check. | Remove only app keys (`uc_filter_cache`, …). Supabase already clears its own session key. Also clear the query cache (`queryClient.clear()` or remove `['session']`). |
| B8 | M | [x] | `features/auth/hooks/useUser.js` | Every component that calls `useUser()` registers its own `onAuthStateChange` listener. MainLayout, ProfilePage, and CreateGroupForm make 2–3 listeners at once. | Subscribe once at app level (an `AuthListener` component in `main.jsx` or `RootLayout`), and keep `useUser` as a pure `useQuery`. |
| B9 | M | [x] | `App.jsx` loaders | `requireAuth`/`redirectIfAuth` call `getSession()` directly, bypassing the `['session']` cache. This violates auth rule #2/#3. | `queryClient.ensureQueryData({ queryKey: ['session'], queryFn: getSession })`. Export `queryClient` from a module. |
| B10 | M | [x] | `AuthPage.jsx` signup | Always `navigate('/')` after `signUp`, even when email confirmation is required (`data.session === null`), so the user lands "logged out" with no message. | Check `data.session`. If it's null, show a "check your email" state. |
| B11 | M | [x] | `AuthPage.jsx` signup | Country/City are **free-text** inputs at signup but dropdowns from `COUNTRIES_CITIES` in Profile, so stored values may not match the lists. | Reuse the same country→city select component (see D4). |
| B12 | M | [x] | `GroupList.jsx` filtering | `group.title.toLowerCase()` and `group.description.toLowerCase()` crash if either is null. Filtering isn't memoized and runs on every render. | Use `(group.title ?? "")`. Move the logic to a pure `filterGroups(groups, filters)` util with `useMemo`, or filter server-side (see P2). |
| B13 | L | [x] | `GroupList.jsx` | The location-preset effect mutates `prev` directly inside `setSearchParams` (`prev.set(...)`). The two init effects plus `hasInitialized` ref are fragile and need `eslint-disable`. | Extract a `useGroupFilters()` hook that owns URL params, cache restore, and the geo preset in a single, well-tested flow. |
| B14 | L | [x] | `GroupList.jsx` error state | "Retry Connection" calls `window.location.reload()`. | Use `refetch()` from the query. |
| B15 | M | [x] | `useCreateGroup` / `useDeleteGroup` | They don't invalidate or remove `['group', id]`, so a deleted group's detail page can still show from cache. | `queryClient.removeQueries({ queryKey: ['group', id] })` on delete. Use a query-key factory (see D7). |
| B16 | L | [x] | `GroupCard.jsx` | `[city, country]?.join(", ")` renders ", Egypt" when city is empty (GroupDetail correctly uses `.filter(Boolean)`). `line-clamp-2` combined with `truncate` conflict. | Use `.filter(Boolean).join(", ")`. Drop `truncate`. |
| B17 | L | [x] | `RootLayout` + `MainLayout` | `<ScrollToTop/>` renders twice. | Keep it in `RootLayout` only. React Router's `<ScrollRestoration/>` is an alternative. |
| B18 | L | [x] | `FilterBar.jsx` | The sticky bar uses `top-[61px]`, a magic number coupled to the nav height. | Use a CSS variable for nav height, or wrap both in one sticky header. |
| B19 | L | [x] | `CreateGroupForm.jsx` | The `useEffect`s that reset `city`/`meeting_link` on change also fire on mount. `date: new Date().toISOString()` and `user_id` come from the client. | Reset in the `onChange` handler instead. Make `date` a DB default (`created_at default now()`) and `user_id default auth.uid()`, enforced by RLS. |
| B20 | M | [x] | `services/storage.service.js` | Deletes existing avatar files **before** uploading the new one, so if the upload fails the user loses their avatar. The comment says "≤200KB" but `maxSizeMB: 1`. The README claims WebP, but the original type is kept. | Upload first, then delete the other files. Fix the comment, or actually convert (`fileType: 'image/webp'`, ext `webp`). |
| B21 | L | [x] | `AuthPage.jsx` `handleOAuth` | Leftover `console.log("couldn't fetch")`. | Remove it. |
| B22 | M | [x] | `ProfilePage.jsx` `populateForm` effect | The edit form is **reset mid-edit** whenever the session object changes. `populateForm` depends on `user`, and the effect re-runs whenever `isEditing` is true. Repro: click Edit, type a new name, then upload an avatar. The `USER_UPDATED` event replaces the session and wipes the typed name. The hourly `TOKEN_REFRESHED` does the same. | Call `reset(...)` once in the "Edit Profile" click handler. Delete the `useCallback` and the effect. |
| B23 | M | [x] | `GroupList.jsx` cache-restore effect | The sessionStorage filter cache is **merged over explicit URL params**. Repro: filter by Egypt, then within 60s open a shared link `/?topic=Math`. Egypt gets added, and a cached topic overrides `Math`. | Restore the cache only when the URL has no filter params. Better: fold it into one initial-filters function (see O1). |
| B24 | L | [x] | `GroupCard.jsx`, `GroupDetail.jsx` platform badge | The badge has both `bg-white dark:bg-black border-gray-100` **and** `platformInfo.color` (`bg-green-100 … border-green-200`). Conflicting Tailwind utilities resolve by stylesheet order, not class order, so the badge color is effectively random per platform. | Drop the generic bg/border classes from the badge, and keep only `platformInfo.color`. |
| B25 | L | [x] | `MainLayout.jsx` nav avatar | `text-contain` isn't a Tailwind class, so the initial letter has no size set inside the 24px circle. | Use `text-[11px] font-bold`. It goes away when the shared `Avatar` (D6) lands. |
| B26 | L | [x] | `GroupDetail.jsx` | `break-all` splits normal words mid-letter. `platformInfo.label \|\| "Direct Link"` is dead code because `getPlatform` always returns a label. | Use `break-words`. Remove the fallback. |
| B27 | L | [x] | `ProfilePage.jsx` success toast | The `setTimeout` is never cleared. Saving twice within 3s hides the second toast early. | Keep the timer id in a ref and clear it. Later, replace it with a shared `Toast` (Phase 2). |
| B28 | L | [x] | sign-out | Only `['session']` is reset. User-scoped caches (`['groups','user',id]`) stay in memory for the next person on the same tab. | On `SIGNED_OUT` in `useAuthListener`, call `queryClient.removeQueries({ queryKey: ['groups','user'] })`, or `queryClient.clear()` and then set the session to null. |
| B29 | L | [x] | `GroupList.jsx` | If the user clicks "Clear all" and later returns to `/`, the geo preset re-applies, because the cache was cleared and the `hasInitialized` ref resets on remount. The user's "Global" choice is forgotten. | Part of O1: remember "user cleared filters" in the same storage entry. |
| B30 | L | [x] | `MainLayout.jsx` footer | "Categories" links to `/` (nowhere specific), "Register" opens `/login` in **sign-in** mode, and the navbar links to `/profile` twice (avatar + text). | Fix while rebuilding the navbar/footer in Stage 11 (signup gets its own route when AuthPage is split, O3). |

## S — Security / privacy

| ID | Sev | Status | Problem | Action |
|---|---|---|---|---|
| S1 | M | [x] | `.env` was committed in early history (`9dd4e7f`, `47743ca`) before being untracked. It holds the Supabase URL and publishable key, which are meant to be public. If anything else was ever in it (service key?), it's leaked. | Check the old contents with `git show 9dd4e7f:.env` locally. Rotate keys if anything secret was there. |
| S2 | M | [~] | RLS policies aren't versioned. Security depends entirely on dashboard config (groups insert/delete ownership, storage folder ownership). | Add `supabase/migrations` or at least a `docs/SUPABASE.md` describing the policies. Verify that `groups` insert enforces `user_id = auth.uid()`. |
| S3 | L | [x] | Client-side IP geolocation sends every visitor's IP to a third party (ipapi.co), and the result is cached in localStorage forever. | Mention it in a privacy note, or ask for consent. Add a TTL to the cache. |
| S4 | L | [~] | `meeting_link` is rendered as `href` from user input. zod `z.url()` plus the platform regex protects the create path, but nothing protects data inserted another way. | Enforce a check constraint or validation in the DB as well. |
| S5 | H | [x] | **Avatar upload into a public bucket.** `accept="image/*"` allows SVG. The file extension comes from the user-controlled `file.name`, and the MIME check is client-side only. Anyone with the anon key can upload an SVG or HTML file with script into `Users-Pics/<their id>/`, and it's then served publicly from the Supabase storage domain (phishing or XSS on that origin). | In the Supabase bucket settings, set **allowed MIME types** to `image/jpeg, image/png, image/webp` and a **file size limit** (for example 2 MB). Client-side, always convert to WebP and save under the fixed path `<uid>/avatar.webp` (see O6). |
| S6 | M | [~] | **All validation is client-only.** Title ≤20, description 20–200, topic/platform enums, and the meeting-link domain check live only in zod. A direct REST insert with the anon key and a user JWT bypasses all of them (huge text, `http:`/`data:` links, fake platforms). | Add Postgres `CHECK` constraints (lengths, `platform in (...)`, `meeting_link ~ '^https://'`), plus an RLS `WITH CHECK (user_id = auth.uid())`. Replaces S4. |
| S7 | M | [—] | **Invite links are publicly scrapeable.** `groups` is readable by anon with `select('*')`, including `meeting_link` and the creator's `user_id`. Bots can harvest every WhatsApp/Telegram invite. There's also no rate limit, report button, or moderation on group creation (spam or scam links). | Decide product-wise. Options: require sign-in to reveal `meeting_link` (a view or RPC for anon exposing safe columns only), a per-user creation limit (an RLS check on a count, or an edge function), and a "report group" flag. |
| S8 | M | [~] | **No security headers.** `vercel.json` only has the SPA rewrite: no CSP, `frame-ancestors` (clickjacking), `Referrer-Policy`, `X-Content-Type-Options`, or `Permissions-Policy`. The Supabase session lives in localStorage, so any XSS means token theft, and a CSP is the main mitigation. | Add a `headers` block in `vercel.json`. The CSP must allow `'self'`, `*.supabase.co` (connect, img), `ipapi.co` (connect), `fonts.googleapis.com` / `fonts.gstatic.com` (or self-host the font, P7), and Vercel Analytics (`/_vercel/insights`, `va.vercel-scripts.com`). Start with `Content-Security-Policy-Report-Only`. |
| S9 | M | [x] | **`npm audit`: 13 vulnerabilities (10 high).** Runtime: `react-router` 7.14.0. Most advisories target SSR or framework mode, which this SPA doesn't use, but the version is behind. Build-time only: `vite` 8.0.4, `postcss`, `nanoid`, `source-map-js`. `ws` comes via `@supabase/realtime-js` and is Node-only, so it isn't in the browser bundle. | Run `npm audit fix` (patch/minor within the same majors), then `npm run build` and a smoke test. Move `@tailwindcss/vite` to devDependencies. |
| S10 | L | [~] | Password strength rules (8+, upper, lower, number, symbol) exist only in the zod schema. | Mirror them in Supabase **Auth → Password requirements** and enable leaked-password protection. Keep zod for UX only. |
| S11 | L | [ ] | `user_metadata` is writable by the user themselves (`updateUser`). It's fine for profile display, but must never drive authorization, and `avatar_url` can be set to any URL. The phone number is copied into every JWT. | Keep roles/permissions out of `user_metadata`. If profiles ever become visible to others, move them to a `profiles` table with RLS. |
| S12 | M | [x] | **Third-party code loaded at runtime.** `browser-image-compression` with `useWebWorker: true` downloads its worker code from `cdn.jsdelivr.net` on every avatar upload. That's an unpinned supply-chain dependency, and a CSP would block it. | `useWebWorker: false`. A 512px avatar compresses fast enough on the main thread. |

## D — Duplication / missing abstractions

| ID | Status | What is duplicated | Proposed abstraction |
|---|---|---|---|
| D1 | [x] | The spinner (`w-12 h-12 border-[3px] border-[#0071e3]/20 border-t-[#0071e3] rounded-full animate-spin`) appears ~8 times. | `components/ui/Spinner.jsx` (size prop) + `FullPageLoader`. |
| D2 | [x] | The back button with chevron SVG ("Return to Explore", "Back to Explore", "Cancel and Return") appears 3 times. | `components/ui/BackLink.jsx`. |
| D3 | [x] | Input/select/textarea class strings, about 20 copies across AuthPage, CreateGroupForm, and ProfilePage, plus label classes and error `<p>`s. | `components/ui/form/{TextField,SelectField,TextAreaField,FieldLabel,FieldError}.jsx` that work with `register`. |
| D4 | [x] | The country→city linked selects (CreateGroupForm, ProfilePage, FilterBar) and the "reset city when country changes" logic. | `LocationSelects` component + `getCitiesFor(country)` helper. |
| D5 | [x] | `TOPICS` is defined in both `CreateGroupForm` and `FilterBar` (with "All"). | `lib/topics.js` exporting `TOPICS`. FilterBar prepends "All". |
| D6 | [x] | Avatar/initials logic exists in both `MainLayout` and `ProfileAvatar`. `user?.user_metadata?.x` is repeated everywhere. | `components/ui/Avatar.jsx` + `lib/user.js` `getProfile(user)` → `{displayName, initials, avatarUrl, phone, country, city}`. |
| D7 | [x] | Query keys are string literals scattered across hooks. | `features/groups/api/queryKeys.js` (`groupKeys.all`, `.list(filters)`, `.byUser(id)`, `.detail(id)`) and `authKeys.session`. |
| D8 | [x] | Platform badges (`React.createElement(platformInfo.icon …)`) appear in both GroupCard and GroupDetail. | `PlatformBadge` component (`const Icon = info.icon; <Icon/>`). |
| D9 | [x] | The sign-out handler is duplicated in MainLayout and ProfilePage. | `useSignOut()` mutation hook: signs out, clears the cache, navigates. |
| D10 | [x] | Primary CTA pill (`bg-[#0071e3] text-white rounded-full font-bold hover:brightness-110 active:scale-95 …`) appears 6+ times. | `components/ui/Button.jsx` with `variant` (primary / dark / ghost / danger) and `size`. |
| D11 | [x] | Hard-coded palette hex values everywhere. | Tailwind v4 `@theme` tokens in `index.css` (`--color-accent`, `--color-surface`, `--color-surface-dark`, …). |
| D12 | [x] | The page hero headline pattern ("Your **Profile.**", "Launch your **Community.**", "Find your **Connections.**"). | `PageHero` component (`title`, `accent`, `subtitle`). |
| D13 | [x] | `[city, country].filter(Boolean).join(", ")` (3×) and the owner check `user.id === group.user_id` (3×). | `formatLocation(place)` and `isOwner(user, group)` helpers (Stage 11). |
| D14 | [x] | Hand-written SVG paths (chevron, pencil, arrow, ✕, map pin) ~12×, although `react-icons` is already a dependency. | Use icons from `react-icons` (Stage 11). |
| D15 | [x] | `useCreateGroup` / `useUpdateGroup` had identical `onSuccess` (cache detail + invalidate lists). | `hooks/groupCache.ts` → `storeSavedGroup()`. |
| D16 | [x] | `Omit<GroupListParams, "cursor" \| "limit">` written 3×; `isTopic` defined in a web hook while `isCountry`/`isPlatformKey` live in shared. | Shared `GroupFilters` type and `isTopic()`. |
| D17 | [x] | API rate-limiter setup (headers, IP key, JSON 429) copied in auth, Google and users routes. | `api/src/lib/rateLimit.ts`: `limitRequests({ limit, windowMs, key })`, `byIp` / `byUser` / `byEmail`. |
| D18 | [x] | `req.user!` 9× and the "account deleted meanwhile → 401" error 4× in API routes. | `signedInUser(req)` (typed, throws 401) and `unauthenticated()` in `session.middleware.ts`. |

## R — Violations of `.agents/rules`

| ID | Status | Rule | Current state |
|---|---|---|---|
| R1 | [x] | No direct supabase calls outside services/api | `useUser` now goes through `auth.service`. `useGroup.js` still calls `supabase` directly. |
| R2 | [x] | Select only needed columns | `groupsApi.getGroups`, `getUserGroups`, and `useGroup` use `select('*')`. |
| R3 | [x] | Loaders + `ensureQueryData` | Auth loaders now use `ensureQueryData` (B9). There's still no data prefetch for `/groups/:id`. |
| R4 | [x] | `errorElement` on routes | None. There's also no 404 route. |
| R5 | [x] | Lazy loading / code-splitting | None. `countries.js` (large) and every page ship in the main chunk. |
| R6 | [ ] | Supabase TS types | The project is JS. The rules mention `auth.service.ts` / `createClient<Database>`. Decide: migrate to TS, or use JSDoc + generated types. |
| R7 | [ ] | Theme toggle (style guide §5) | Only system preference, no manual override. |
| R8 | [ ] | Social proof, member count on cards (style guide §5–6) | Not implemented. There's no members concept in the data model. |

## O — Over-engineering / simplification

Code that is more complex than the problem needs. Simplifying these removes whole classes of bugs (B13, B22, B23, B29 all come from O1/O4).

| ID | Status | Where | What's over-built | Simpler version |
|---|---|---|---|---|
| O1 | [x] | `GroupList.jsx` + `useFilterCache.js` + `useUserLocation` | Filter state has **three sources of truth**: URL params, a sessionStorage cache with a 60-second TTL, and an async geo preset. Two `useEffect`s, a `hasInitialized` ref, two `eslint-disable`s, and a cache write on every change tie them together. | Keep the **URL as the only source of truth**. One `useGroupFilters()` hook: `filters = parse(searchParams)`, and `setFilter(key, value)`. To keep filters when the user clicks the logo, store the last search string in sessionStorage (no TTL) and have the nav/logo `Link` go to `/` + that string. Apply the geo preset only when there's no URL search **and** no stored search. |
| O2 | [x] | `useUserLocation.js` | Double caching: localStorage **plus** React Query with `staleTime: Infinity`, `refetchOnMount: false`, and `refetchOnWindowFocus: false`. With `staleTime: Infinity` the last two flags do nothing. | Keep React Query and use `staleTime: Infinity, retry: 1` only. Keep localStorage as the cross-visit cache, and give it a TTL (S3). |
| O3 | [x] | `AuthPage.jsx` | One form and one schema serve two modes. An `isLogin` boolean lives **both** in React state and inside the form values, and a `superRefine` if/else chain branches on it. The page is 340+ lines. | `LoginForm` + `SignupForm`, each with its own small schema (`loginSchema`, and `signupSchema` with `.refine` for the password match). The page only toggles between them. Use zod 4's `z.email()`; `z.string().email` and `z.ZodIssueCode` are deprecated in v4. |
| O4 | [x] | `ProfilePage.jsx` | `populateForm` in a `useCallback`, an effect that populates on edit, and an effect that resets the city using `watch()`. This causes B22 and the L4 warning. | `startEditing = () => { reset(fromUser(user)); setIsEditing(true) }`. Reset the city in the country select's `onChange` (same pattern as CreateGroupForm). Both effects go away. |
| O5 | [x] | small wrappers | `getRedirectUrl()` wraps a single env read. `mutationFn: (x) => updateProfile(x)` and `({userId, file}) => uploadAvatar(userId, file)` are pass-through arrows. The `image/` type check is duplicated in `ProfileAvatar` and `compressImage`. | Use `const REDIRECT_URL = import.meta.env…` and `mutationFn: updateProfile`. Do validation in one place. |
| O6 | [x] | `storage.service.js` | The extension varies with the uploaded file name, so both upload and remove need a `list()` + filter + `remove()` round-trip (3–4 network calls). | Always convert to WebP and save to the fixed path `<uid>/avatar.webp` with `upsert: true`. Upload is then 1 call and remove is 1 call. This also fixes S5's extension issue and makes the README's WebP claim true. |
| O7 | [x] | `lib/countries.js` | 118 `.sort()` calls at module load, and the data is re-sorted again for `COUNTRY_LIST`. | Store the data pre-sorted (a one-off script), or as JSON. No runtime work. |
| O8 | [x] | `FilterBar.jsx` props | Ten props (5 values + 5 callbacks), plus a local `search` copy synced by an effect (L3). | `<FilterBar filters={filters} onChange={setFilter} />`. Make the search input uncontrolled with `defaultValue` and `key={filters.query}`. |
| O9 | [x] | `GroupCard.jsx` | Every card calls `useDeleteGroup()`, creating one mutation observer per card even when `canDelete` is false (always on the home page). | Pass `onDelete` from the parent (ProfilePage owns the mutation), or render a tiny `<DeleteGroupButton id>` only when `canDelete`. |
| O10 | [x] | `GroupCard` / `GroupDetail` | `React.createElement(platformInfo.icon, {...})` plus `import React` just for it. `platforms.js` also has an unused `import React`. | Use `const Icon = platformInfo.icon; <Icon className=… />`, and drop the React imports (D8). |

## M — Modernization (newer React / React Router / TanStack / TypeScript features)

Found in the 2026-10-13 review: places where the libraries we already use now offer a simpler built-in way.

| ID | Status | Where | Before | Now |
|---|---|---|---|---|
| M1 | [x] | `ScrollToTop.jsx` | Effect calling `window.scrollTo(0, 0)` on every path change. | React Router's `<ScrollRestoration />` in `RootLayout` (also restores the position on Back). File deleted. |
| M2 | [x] | 17 imports | `react-router-dom`, which in v7 only re-exports `react-router`. | Import from `react-router`; one dependency fewer. |
| M3 | [x] | `useGroup`, `useMyGroups` | `enabled: !!id` plus `getGroupById(id!)`. | TanStack Query `skipToken`: no `!`, no separate flag to keep in sync. |
| M4 | [x] | every page | One tab title ("UrConnections") for all pages. | React 19 `<title>` inside each page (`lib/pageTitle.ts`); React hoists it into `<head>`. |
| M5 | [x] | `GroupDetail` ×2, `ProfilePage` | `<button onClick={() => navigate(...)}>` for plain navigation. | `<Link>`: real links (new tab, middle-click, announced as links). |
| M6 | [x] | `App.jsx` | `@vercel/analytics` `<Analytics/>`. | Removed: v2 is self-hosted, the Vercel endpoint doesn't exist there. |
| M7 | [x] | UI kit (Stage 11) | `forwardRef` would be needed for inputs used with react-hook-form's `register`. | React 19 passes `ref` as a normal prop: plain function components. |

## P — Performance (measured)

Production build: **one 766 KB JS chunk (237 KB gzip)**, plus 50 KB CSS (9.4 KB gzip). Every route ships on first load.
Per-package breakdown (gzip), measured with a temporary chunk-split build:

| Package | gzip | Needed on home (`/`)? |
|---|---|---|
| react-dom | 58.7 KB | yes |
| @supabase/* | 47.3 KB | yes |
| react-router | 30.5 KB | yes |
| app code | 13.9 KB | partly |
| **zod** | **15.8 KB** | **no**: only the forms (create, auth, profile) |
| **browser-image-compression** | **19.7 KB** | **no**: only the avatar upload |
| countries data | 13.9 KB | yes (FilterBar), could be deferred |
| @tanstack/react-query | 10.5 KB | yes (devtools are correctly excluded) |
| react-icons (used icons only) | 11.0 KB | yes |
| **react-hook-form + resolvers** | **10.4 KB** | **no** |

| ID | Status | Issue | Fix | Expected gain |
|---|---|---|---|---|
| P1 | [x] | No code splitting (R5). | `React.lazy` (or RR7 `lazy:` route property) for `/create`, `/profile`, `/login`, `/groups/:id`. | About **46 KB gzip (~20%) off the home page** (zod + RHF + image compression). Smaller first parse on mobile. |
| P2 | [x] | `browser-image-compression` is imported statically by `storage.service`. | `const { default: imageCompression } = await import("browser-image-compression")` inside `uploadAvatar`. | 19.7 KB gzip leaves even the profile chunk until someone actually uploads. |
| P3 | [x] | React Query defaults: `staleTime: 0` + `refetchOnWindowFocus: true`. **The entire `groups` table is re-downloaded on every tab focus and every return to `/`.** | Set `staleTime: 60_000` (and `refetchOnWindowFocus: false`) as defaults in `lib/queryClient.js`. Mutations already invalidate. | Removes most redundant Supabase requests. |
| P4 | [x] | `getGroups()` fetches **all rows, all columns**, and filters on the client (R2, B12). This scales linearly with the table, both in payload and in render time. | Short term: explicit column list. Medium term: server-side filters (`.eq` / `.ilike`) + `.range()` pagination, keyed by `groupKeys.list(filters)` with `placeholderData: keepPreviousData`. Add DB indexes on `(country, city)`, `topic`, `platform`. | Constant payload per page instead of the whole table. |
| P5 | [x] | `index.css`: `* { transition-colors duration-300 }` puts a transition on **every element**. That's extra style work on every hover and re-render, and colors visibly "fade in" on first paint. | Delete the global rule. Elements that need it already have `transition-*` classes. | Cheaper style recalc, no flash on load. |
| P6 | [x] | `transition-all` on cards and buttons (GroupCard has `hover:scale-105 transition-all` + shadow change), and `backdrop-blur-2xl` on **two** stacked sticky bars. | Use `transition-transform` / `transition-colors` explicitly, and `blur-md` or a single blurred header. | Smoother scrolling on low-end phones. |
| P7 | [x] | Inter is loaded via a CSS `@import` from Google Fonts. That's a render-blocking chain (CSS → font CSS → font files) and a third-party request (privacy, plus CSP S8). | Self-host it with `@fontsource-variable/inter` (one variable woff2 file, `font-display: swap`), or at minimum `<link rel="preconnect">` + `<link>` in `index.html`. | Faster first text paint, no third-party font request. |
| P8 | [x] | `GroupList` recomputes the filter and lowercases every field on every render (including while the location is being detected). | Pure `filterGroups()` + `useMemo([groups, filters])`. This disappears if P4 moves filtering to the server. | Minor now, matters as the table grows. |
| P9 | [x] | Avatar `<img>`s have no `width`/`height`/`loading`/`decoding` attributes. | Add `width height loading="lazy" decoding="async"`, which matters in the group grids. | No layout shift. |

## A — Accessibility

| ID | Status | Issue | Fix |
|---|---|---|---|
| A1 | [x] | No `<label>` in any form is linked to its input (no `htmlFor`/`id`). Screen readers don't announce field names, and clicking a label doesn't focus the field. | The shared form components (D3) should generate the `id` with `useId()` and wire `htmlFor`, `aria-invalid`, and `aria-describedby` to the error text. |
| A2 | [x] | FilterBar's search input and its 3 selects have no labels at all. The password show/hide buttons have no `aria-label`. | Add `aria-label`s ("Search groups", "Country", "City", "Platform", "Show password"). |
| A3 | [x] | Text at `text-[8px]` / `text-[10px]` on mobile (GroupCard description and location, footer links) is below readable size. | Use a 12px minimum for body text and 11px for uppercase micro-labels. |
| A4 | [x] | Topic pills don't expose the selected state. | Add `aria-pressed={currentTopic === topic}`. |

## L — Lint (`npm run lint`: 0 problems after Phase 0)

| ID | Status | Where | Issue |
|---|---|---|---|
| L1 | [x] | `CreateGroupForm.jsx` | `selectedTitle`, `selectedDescription` unused. |
| L2 | [x] | `GroupCard.jsx` | `date` destructured but unused. |
| L3 | [x] | `FilterBar.jsx` | `setState` inside an effect (`setSearch(currentSearch)`). Use `key={currentSearch}` on the input wrapper, or make it uncontrolled with `defaultValue`. |
| L4 | [x] | `ProfilePage.jsx` (CreateGroupForm done) | React Compiler skips them because of RHF `watch()`. Use `useWatch({ control, name })` instead. |

## H — Hygiene

| ID | Status | Item |
|---|---|---|
| H1 | [x] | Unused deps: `react-country-state-city`, `autoprefixer`, `postcss` (Tailwind v4 Vite plugin doesn't need them). |
| H2 | [x] | Unused assets: `src/assets/hero.png`, `react.svg`, `vite.svg`, `public/icons.svg`. |
| H3 | [x] | `.VSCodeCounter/` is tracked in git. Untrack it and add it to `.gitignore`. |
| H4 | [ ] | Folder typo `src/GenealComponents` → `src/app/layouts` (or `src/components/layout`). |
| H5 | [x] | `useFilterCache.js` isn't a hook but lives in `hooks/` with a `use` prefix. Rename to `lib/filterCache.js` or `features/groups/utils/filterCache.js`. |
| H6 | [ ] | README is inaccurate: says "MERN stack" and "Lucide React", and the WebP claim is false. Rewrite it with setup steps and env vars. |
| H7 | [x] | `.gitignore` has duplicated `.env` lines. |
| H8 | [ ] | `.agents/rules/style-guide.md` contains leftover e-commerce/hardware-brand text that contradicts the app's domain. Trim it to what applies. |
| H9 | [~] | No tests. Vitest + React Testing Library would be the natural fit with Vite. The best first targets are the pure utils: `filterGroups`, `findMatchingCountry`, `groupSchema`. |
| H10 | [x] | `useUserLocation.js` has a redundant alias `'Czechia': 'Czechia'` and misplaced comments on `refetchOnMount`/`retry`. |

### Notes on partly-done items (bug-fix pass, after `86180e9`)
- **B4**: Delete now shows only with `canDelete` (passed by ProfilePage only). It still uses `window.confirm`; replace it with a `ConfirmDialog` in Phase 2.
- **B13**: The `prev` mutation is fixed. Extracting `useGroupFilters()` is still open (Phase 3).
- **B19**: Field resets moved to `onChange`, and validation messages are now shown. Still open: make `date`/`user_id` DB defaults (needs a Supabase change).
- **B7/B8/B9**: There's now a single `useAuthListener()` in `RootLayout`. Loaders use `queryClient.ensureQueryData(sessionQueryOptions)` (`src/lib/queryClient.js`), and AuthPage primes `['session']` after password login.

### Notes on Phase 0 (quick wins + remaining bugs)
- **B22/O4/L4**: The form is populated only in the `startEditing` click handler. The city resets in the country select's `onChange`. Both effects and the `useCallback` are gone.
- **B27**: The toast state is the timestamp of the last save. An effect owns the 3s timer, so it restarts on every save and is cleared on unmount. A ref-based timer was rejected because the React Compiler lint (`react-hooks/refs`) flags refs reached via `handleSubmit(...)`.
- **B23**: The filter cache restore is skipped when the URL already has params. The full O1 rewrite is still Phase 4.
- **B28**: `useAuthListener` removes `['groups','user']` queries on `SIGNED_OUT`.
- **S9**: `npm audit fix` brought react-router to 7.18.4, vite to 8.3.4, and tailwind to 4.3.3, with 0 vulnerabilities. `@tailwindcss/vite` moved to devDependencies.
- **O5**: The image-type check now lives only in `storage.service` (`compressImage` throws), and ProfileAvatar shows the error. `getRedirectUrl()` became a constant. Mutation hooks pass the service functions directly (except `uploadAvatar`, which takes two args).
- **O2 (partial)**: The redundant `refetchOnMount`/`refetchOnWindowFocus`/`retry` options were removed (`fetchLocation` never throws). Still open: a TTL on the localStorage entry (with S3).
- **P5 side effect**: Hover color changes on elements that had no `transition-*` class of their own now switch instantly instead of fading over 300ms. Add `transition-colors` where the fade is wanted.

### Notes on Phase 1 (security). Runbook: [SUPABASE.md](SUPABASE.md)
- **S1**: Checked without printing values. The old commits only ever held the Supabase URL, the publishable key, and the redirect URL, all public by design. No rotation needed.
- **S2/S6 `[~]`**: `supabase/migrations/20261008000100_groups_rls_and_checks.sql` is written: RLS (public read, owner-only writes), `user_id`/`date` defaults, and `NOT VALID` CHECK constraints. **Pending: the owner runs it.** Then validate the constraints, and drop `date`/`user_id` from the client insert (finishes B19).
- **S5 `[~]`**: Client side done. The picker and the service accept only JPEG/PNG/WebP, and the extension comes from the MIME type, not the file name. Bucket MIME/size limits and owner-folder storage policies are in `20261008000200_avatar_bucket_hardening.sql`, **pending run**. The fixed-path WebP simplification (O6) is still Phase 2.
- **S7 `[—]`**: Owner decision: invite links stay public, and there are no creation limits for now.
- **S3**: Owner decision: keep IP geolocation, with a 7-day TTL on the cached location (old entries without a timestamp count as expired).
- **S8 `[~]`**: `vercel.json` enforces X-Frame-Options, nosniff, Referrer-Policy, and Permissions-Policy. The CSP ships **Report-Only**. Switch it to enforcing after a clean production check (SUPABASE.md §6).
- **S10 `[~]`**: Dashboard checklist in SUPABASE.md §5. **Pending: the owner applies it.**

### Notes on Stage 2 (typed data layer, see MASTER_PLAN.md)
- **R1/R2**: `useGroup` now goes through `groupsApi.getGroupById`. Every query selects an explicit column list (`GROUP_COLUMNS`).
- **D7**: `features/groups/api/queryKeys.ts` (`groupKeys.all / list / byUser / byUserRoot / detail`). The detail key moved under `['groups', …]`.
- **O7**: Countries are stored pre-sorted (since Stage 12 split into `countryNames.ts` + `cities.ts`), with `getCities()` / `isCountry()` helpers.
- **H5**: `hooks/useFilterCache.js` became `features/groups/utils/filterCache.ts`.
- **O3 `[~]`**: Separate shared `loginSchema` / `signupSchema` (AuthPage picks one per submit via `authResolver`). Splitting AuthPage into LoginForm/SignupForm components is Stage 11.
- New: shared schemas tightened validation (`topic`/`platform` are enums, `meeting_link` must be http(s), title/description trimmed), matching the DB CHECK constraints.

### Notes on Stage 3 (Docker + API skeleton)
- **H9 `[~]`**: Vitest + Supertest are set up for the API (6 tests), and `npm test` runs every workspace's tests. CI runs them on every push and PR. There are no web tests yet.
- **Bundle**: 244 KB gzip (was 236.7). Adding the API made npm move every workspace to zod 4.6.5, one shared copy. Stage 12's route splitting removes zod from the home page.

### Notes on Stage 4 (v2 database schema)
- **S6 (v2)**: The v2 schema enforces the group rules in Postgres from day one (lengths, topic/platform lists, http(s)-only links, non-empty location). DB tests prove each CHECK rejects bad data, and that the shared lists match the DB lists.
- **S2 (v2)**: The schema is versioned in `api/src/db/migrations/`. Ownership rules (who may change which row) move into the API in Stages 6–7 instead of RLS.
- **Tooling**: `kysely-codegen` was dropped (it pulls in vulnerable `braces`/`micromatch`). Types are hand-written and covered by the DB tests. `npm audit`: 0 vulnerabilities.

### Notes on Stage 5 (groups read API)
- **O1 / B13 / B29**: `useGroupFilters` makes the URL the single source of truth. The 60s filter cache is replaced by a saved-search bookmark, where `""` means "cleared", so the location preset doesn't return.
- **P4 / P8**: Filtering, search and pagination run in Postgres (indexes from migration 0001). The client no longer downloads the whole table or filters it on every render.
- **Security**: Search input is passed as a SQL parameter, with LIKE wildcards escaped. Every query param is zod-validated (400 with details). Malformed ids → 404 (never a 500 from a failed uuid cast). The API selects explicit columns only.

### Notes on Stage 6 (own authentication)
- **D9**: One `useSignOut()` mutation (logout → clear the user cache → go home) is used by MainLayout and ProfilePage.
- **S10 (v2)**: The password policy is enforced by the API with the same `passwordSchema` the form uses, so it can't be bypassed.
- **S8 (v2)**: The API adds CSRF protection itself (Origin check + SameSite cookie). helmet sets the API's security headers.
- **Bug caught by a test**: `register` spread the whole validated body, including the plain-text `password`, into the users insert (TypeScript doesn't flag extra fields in spread objects). Postgres rejected it only because no `password` column exists. Fixed by taking `password` out explicitly; tests check that the stored hash never contains the password.
- **Known trade-off**: Register answers 409 `email_taken`, revealing that an account exists. Stage 8 (email verification) can change this to a uniform "check your email" response.

### Notes on Stage 7 (group writes + ownership)
- **B4**: Edit/Delete only render for the owner (`user.id === group.user_id`, checked by the card and the detail page). The API enforces ownership in SQL and answers 404 to everyone else. Still open: `window.confirm` → ConfirmDialog (Stage 11).
- **B19 (v2)**: The client no longer sends `user_id` or `date`. The owner comes from the session, and `created_at`/`id` are database defaults.
- **Rule (owner decision)**: After creation only title, description, topic, country and city can change. `meeting_link` and `platform` are fixed: `updateGroupSchema` is strict (400 if sent), `updateOwned` can't write those columns, and the edit form shows them read-only.
- **IDOR protection**: Writes use `WHERE id = $1 AND user_id = $me`, and a non-owner gets 404 (never 403), so group ids can't be probed. Tested with two real users.

### Notes on Stage 8 (email verification + password reset)
- **Account enumeration**: Forgot-password responds identically, and *before* doing any work, so neither text nor timing reveals whether an email exists. Login already did the same. Register keeps its 409 `email_taken` as a deliberate UX trade-off.
- **One-time links**: Tokens are stored hashed, expire (24 h / 1 h), are purpose-bound (a verify link can't reset a password), and are consumed atomically. A new link cancels older ones.
- **Reset hygiene**: A password reset ends every session of the account.
- **Link scanners**: The verify page needs a click (POST) rather than verifying on page load, so mail security scanners can't use the token up.
- **Production TODO (Stage 14)**: Set `SMTP_URL` / `MAIL_FROM` to a real provider and add SPF/DKIM for the domain.

### Notes on Stage 9 (Google sign-in)
- **Own OAuth flow**: The Supabase redirect (`VITE_AUTH_REDIRECT_URL`) is gone. The API runs the authorization-code flow with `state` (login CSRF) and PKCE (stolen codes are useless) via `arctic`, and only the API holds the client secret.
- **ID token trust**: It comes straight from Google's token endpoint over TLS, so the signature isn't re-checked (allowed by OIDC Core §3.1.3.7). `aud` must equal our client id, `iss` must be Google, and `email_verified` must be true.
- **Account linking**: Lookup is by Google `sub`, never by email alone. A verified local account with the same email is linked. An *unverified* one is treated as a possible pre-hijack: its password is removed and its sessions ended, and Google's proof of ownership wins. Tested in `google.db.test.ts`.
- **Production TODO (Stage 14/16)**: Add `https://<domain>/api/auth/google/callback` as an authorized redirect URI in the Google Cloud console, and publish the OAuth consent screen.

### Notes on Stage 10 (avatars on our API + Garage)
- **S5 (closed)**: The API decides what an image is by decoding it (sharp). Only JPEG, PNG and WebP are allowed, so SVG is rejected even though sharp can read it. The upload is re-encoded to a 512×512 WebP, so the stored bytes are always ours (no polyglots, no EXIF/GPS). The input is capped at 5 MB (multer) and 50 M pixels (decompression bombs). Tested with an SVG and an HTML page renamed to `.png`.
- **O6 (closed)**: Always WebP, one object per upload (`avatars/<uid>/<uuid>.webp`). Replace = put new, swap the key in one locked transaction, delete old. Remove = 1 call.
- **P2 (closed)**: `browser-image-compression` is gone (the server converts). The `@supabase/supabase-js` client and `web/.env` variables went too, since nothing in the web app uses them now. Home bundle: **248 → 180 KB gzip**, already under Stage 12's 190 KB target.
- **Storage choice**: MinIO's community repo was archived in April 2026 and no longer publishes images. Garage (free, AGPL, self-hosted) was chosen for the S3 API. It runs behind a `Storage` interface, so plain files or a hosted S3 (R2/B2) would be one new implementation.
- **Production TODO (Stage 13/14)**: Generate a real Garage `rpc_secret` and access key (never the dev values), and add a Caddy route `/media/*` → Garage `:3902` with `Host: <bucket>.web.<root_domain>`. Include the Garage volume in backups.

### Notes on the 2026-10-13 review (start of Stage 11)
- **Verdict**: The API and shared package are lean. Its interfaces (`Storage`, `Mailer`, `GoogleOAuth`) each exist so tests run without real services, so none were cut. Nearly all the repetition is in the React components (D1–D14), which is what the Stage 11 UI kit is for.
- **Done before the UI kit**: M1–M6, O8 (FilterBar takes `filters` / `onChange` / `onSearch` instead of 10 props), D15–D18. Home bundle 179.6 → 179.3 KB gzip.
- **Stage 11 then closed**: D1–D4, D6, D8, D10–D14, M7, O3, O9, B4, B30, A1–A4 (see the Stage 11 notes).

### Notes on Stage 11 (TypeScript frontend + UI kit)
- **All TypeScript**: Every `.jsx` file is now `.tsx`, `allowJs` is off, and there's no `any`. `GenealComponents/` became `components/layout/` (Navbar and Footer split out of MainLayout).
- **UI kit** (`web/src/components/ui`): Button/ButtonLink (D10), Spinner/PageSpinner (D1), BackLink (D2), Field components (D3, A1), CountryCityFields via `useFormContext` (D4), Avatar (D6), PlatformBadge (D8), PageHero (D12), Notice, NotFound, ConfirmDialog on the native `<dialog>` and a Toast system (B4: no more `alert`/`confirm`). Icons come from `react-icons` (D14). `lib/format.ts` holds the shared helpers (D13). Colors are `@theme` tokens (D11).
- **React 19**: `ref` is a plain prop, so the fields take react-hook-form's `register` ref without `forwardRef` (M7). `use(Context)` in `useToast`. `<title>` per page.
- **O3**: `AuthPage` (one form, two schemas, a hidden `isLogin` field, manual loading state) became `LoginPage` + `SignupPage` on `/login` and `/signup`, using `useLogin` / `useRegister` mutations like every other form.
- **O9**: Cards take `onDelete`. The page owns one `DeleteGroupDialog` (confirm + mutation + toast).
- **Create vs edit**: These are separate forms now (each `useForm` typed from its own schema), sharing `GroupFormFields` + `GroupFormFrame`. The old shared component needed a mode switch across two schemas. `formResolver` types the create form's empty selects (`""`) without loosening the schema.
- **Found while testing in a real browser** (headless Chrome over the DevTools protocol): unknown groups showed a spinner for seconds, because TanStack Query retried the 404 three times. `queryClient` now never retries 4xx. React Router also warned about a missing `HydrateFallback`; the root route now has `hydrateFallbackElement`.
- **Small visual changes** from consolidating: auth pages use the shared left-aligned layout; buttons, inputs and spinners share one size scale; footer and card text is at least 12px (A3).
- **Not done**: A mobile nav menu. On small screens the navbar shows the avatar (→ profile, which has Sign Out) and Create Group, and the footer has every account link.

### Notes on Stage 12 (frontend performance)
- **P1/R5 code splitting**: every page except the home page is an RR7 `lazy` route (its own chunk, 0.3–2.7 KB gzip each). Home now loads `index` + one shared vendor chunk = **166.3 KB gzip** (was 179.0; target ≤ 190). The audit's 46 KB estimate assumed zod would leave the home page, but `apiClient` validates every response with zod, so it stays (23.9 KB). What left: react-hook-form + resolvers (≈ 10.6 KB) and all non-home pages. Per-package gzip on home, measured with a temporary one-chunk-per-package build: react-dom 59.4 · react-router 31.9 · zod 23.9 · countries 13.7 · react-icons 11.1 · TanStack Query 10.8 · app ≈ 14.
- **R4 errors**: `RouteError` as `errorElement` on the root route (full page) and on a pathless route inside `MainLayout` (navbar stays). A lazy chunk that fails to download (a deploy while the tab was open) shows "A new version is available" with a Reload button (`isChunkLoadError`).
- **R3 prefetch**: `/groups/:groupId` has a loader that starts `GET /api/groups/:id` in parallel with the GroupDetail chunk (`groupDetailQuery` shared with `useGroup`).
- **P7**: Inter is self-hosted with `@fontsource-variable/inter` (one variable woff2 per alphabet, `unicode-range`, `font-display: swap`). No request to Google any more. This was the biggest single win.
- **P6**: `transition-all` → `transition` (colors, opacity, shadow, transform; no layout properties) everywhere; both sticky bars `backdrop-blur-2xl` → `backdrop-blur-md` with 80% instead of 70% background.
- **P9**: avatar `<img>` has `width`/`height`, `loading="lazy"`, `decoding="async"`.
- **Also**: a thin page-loading bar (`useNavigation`, shown after 150 ms), because a lazy page keeps the old page on screen while its chunk downloads.
- **Lighthouse (mobile, production build via `vite preview` + local API, 3 runs each)**: home 81–88 → **96** (FCP 2.9 → 2.1 s, LCP 3.2–3.8 → 2.3 s, CLS 0.002, TBT ≤ 20 ms); group detail 89 → **95** (FCP 2.9 → 2.2 s, LCP 3.0 → 2.4–2.5 s).
- **Checked in headless Chrome**: home, detail via card click (loads only its chunk), /login, /signup, /profile redirect when signed out, sign-in then profile / create / edit, unknown URL and unknown group → Not Found, a 404 on the CreateGroupPage chunk → "new version" page with the navbar still shown. No console errors. Remaining third-party request: ipapi.co (location).
- **City lists on demand** (follow-up in the same stage): `packages/shared` now has `countryNames.ts` (the 118 names, in `index.ts`) and `cities.ts` (all city lists, its own entry `@urconnections/shared/cities`, *not* re-exported from `index.ts`, because a static import anywhere would pull it back into the main bundle). The web loads it with `import()` through `useCities` (`lib/cities.ts`) only once a country is set; while it loads, a select offers just its current city, so deep links and the edit form never show a blank city. Location detection imports it only when ipapi returned a country. Home JS: **166.3 → 151.3 KB gzip**; the cities chunk is 13.8 KB. Lighthouse home is unchanged (96, LCP 2.4 s): a first visit still fetches the chunk in the background after location detection, but it's off the critical path.
- **Not done / option for later**: zod/mini or skipping response validation (−≈ 20 KB). Not needed for the target.
