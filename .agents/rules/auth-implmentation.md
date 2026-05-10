---
trigger: always_on
---

1. Service Layer Abstraction (SOLID: Single Responsibility)

Rule: Never call supabase.auth directly inside a React component.

Implementation: All authentication logic must reside in src/services/auth.service.ts. This service should export clean, typed functions like signInWithGoogle(), signInWithApple(), and signOut().

2. Route Protection via Loaders (Performance & UX)

Rule: Use React Router v7 loader functions to handle authentication checks.

Goal: Prevent "Flash of Unauthenticated Content" (FOUC). The loader must check the session before the route renders. If the user is unauthenticated, the loader triggers a redirect('/login').

3. Session Synchronization (TanStack Query v5)

Rule: Use a global TanStack Query key (e.g., ['session']) to manage the current user state.

Implementation: Use a useUser hook that wraps useQuery. When a user logs in or out, use queryClient.invalidateQueries({ queryKey: ['session'] }) to ensure the entire UI stays in sync without page reloads.

4. Social Auth Handling (Clean Code)

Rule: Standardize the OAuth redirect flow. Use environment variables for redirect URLs to ensure the flow works across Local, Staging, and Production environments.

Logic: supabase.auth.signInWithOAuth({ provider, options: { redirectTo: import.meta.env.VITE_AUTH_REDIRECT_URL } }).