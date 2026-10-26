/**
 * `next` (where to go after signing in, e.g. "/create") as a path on our own site, or
 * undefined for anything else.
 *
 * SECURITY: `next` comes from a URL anyone can craft. Redirecting to it unchecked would be an
 * "open redirect": /api/auth/google?next=https://evil.example would sign you in and then hand
 * you to a look-alike site. Parsing with URL, as the browser will, also catches the tricky
 * spellings ("//evil.example", "/\evil.example", tabs or newlines inside).
 * The web has the same check for its own redirects (web/src/lib/nextPath.ts).
 */
export function safeNextPath(value: unknown, siteOrigin: string): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/") || value.length > 500) return undefined;
  try {
    const site = new URL(siteOrigin).origin;
    const url = new URL(value, site);
    if (url.origin !== site) return undefined;
    const path = url.pathname + url.search + url.hash;
    return path === "/" ? undefined : path;
  } catch {
    return undefined;
  }
}
