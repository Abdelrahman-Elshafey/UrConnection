---
trigger: always_on
---

1. Service Layer Abstraction (SOLID: Single Responsibility)

Rule: Never call the auth API (or fetch) directly inside a React component.

Implementation: All authentication calls must reside in web/src/services/auth.service.ts (through lib/apiClient.ts). This service exports clean, typed functions like login(), register(), logout() and GOOGLE_SIGN_IN_URL. The session is an httpOnly cookie set by our API: frontend code never reads or stores a token.

2. Route Protection via Loaders (Performance & UX)

Rule: Use React Router v7 loader functions to handle authentication checks.

Goal: Prevent "Flash of Unauthenticated Content" (FOUC). The loader must check the session before the route renders. If the user is unauthenticated, the loader triggers a redirect('/login').

3. Session Synchronization (TanStack Query v5)

Rule: Use a global TanStack Query key (e.g., ['session']) to manage the current user state.

Implementation: Use a useUser hook that wraps useQuery. When a user logs in or out, use queryClient.invalidateQueries({ queryKey: ['session'] }) to ensure the entire UI stays in sync without page reloads.

4. Social Auth Handling (Clean Code)

Rule: Standardize the OAuth redirect flow. The API owns it: the redirect URI comes from its APP_ORIGIN setting, so the same code works in development and production.

Logic: the Google button is a plain link to /api/auth/google (with ?next= to return to the current page). The API runs the authorization-code flow with state + PKCE and redirects back to the site.