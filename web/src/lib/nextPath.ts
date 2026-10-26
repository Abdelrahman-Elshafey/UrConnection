/**
 * After signing in, return to the page that needed it: /create → /login?next=%2Fcreate → /create.
 */

/** "/login?next=%2Fcreate". No `next` (or "/", where sign-in goes anyway) → just the path. */
export const withNext = (path: string, next: string | null | undefined): string =>
  next && next !== "/" ? `${path}?next=${encodeURIComponent(next)}` : path;

/**
 * The `next` value as a path on this site, or "/" for anything else.
 * SECURITY: `next` comes from the URL, so anyone can craft a login link with it. Without this
 * check, /login?next=https://evil.example would send people to a look-alike site right after
 * they signed in ("open redirect"). Parsing with URL (as the browser itself would) also catches
 * the tricky spellings: "//evil.example", "/\evil.example", tabs or newlines inside.
 */
export function safeNextPath(next: string | null): string {
  if (!next) return "/";
  try {
    const url = new URL(next, window.location.origin);
    return url.origin === window.location.origin ? url.pathname + url.search + url.hash : "/";
  } catch {
    return "/";
  }
}
