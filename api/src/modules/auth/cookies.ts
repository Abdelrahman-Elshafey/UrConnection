import type { CookieOptions, Response } from "express";
import { isProduction } from "../../config";

/** How long a session lasts without activity, and when to extend it ("sliding" expiry). */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const SESSION_RENEW_BELOW_MS = 15 * 24 * 60 * 60 * 1000; // extend once less than 15 days are left

/**
 * The "__Host-" prefix makes browsers refuse the cookie unless it is Secure, has
 * Path=/ and no Domain, so no other subdomain can set or overwrite it. It requires
 * HTTPS, so plain-HTTP development uses a plain name.
 */
export const SESSION_COOKIE = isProduction ? "__Host-sid" : "sid";

// SECURITY: every flag matters.
const baseOptions: CookieOptions = {
  httpOnly: true, // JavaScript can't read it, so an XSS bug can't steal the session
  secure: isProduction, // only sent over HTTPS (in production)
  sameSite: "lax", // not sent on cross-site POSTs: first line of defence against CSRF
  path: "/",
};

export function setSessionCookie(res: Response, token: string, expires: Date): void {
  res.cookie(SESSION_COOKIE, token, { ...baseOptions, expires });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, baseOptions);
}

// ── Google sign-in (Stage 9) ────────────────────────────────────────────────

/**
 * Holds `state` and the PKCE code verifier while the user is away on Google's page.
 * SameSite=Lax is what makes this work: Google sends the browser back with a top-level
 * GET navigation, and Lax cookies are sent on those (Strict ones would not be).
 */
export const GOOGLE_OAUTH_COOKIE = isProduction ? "__Host-google_oauth" : "google_oauth";
export const GOOGLE_OAUTH_TTL_MS = 10 * 60 * 1000; // 10 minutes to pick an account

export interface GoogleOAuthCookie {
  state: string;
  codeVerifier: string;
  /** Where to go after signing in (a path on this site, already checked), if not home. */
  next?: string;
}

export function setGoogleOAuthCookie(res: Response, { state, codeVerifier, next }: GoogleOAuthCookie): void {
  // Every part is base64url (no "."), so one cookie carries all of them: "state.verifier[.next]".
  const parts = [state, codeVerifier, ...(next ? [Buffer.from(next).toString("base64url")] : [])];
  res.cookie(GOOGLE_OAUTH_COOKIE, parts.join("."), { ...baseOptions, maxAge: GOOGLE_OAUTH_TTL_MS });
}

/** Reads and validates the cookie. undefined if it's missing or malformed. */
export function readGoogleOAuthCookie(cookies: Record<string, unknown> | undefined): GoogleOAuthCookie | undefined {
  const value = cookies?.[GOOGLE_OAUTH_COOKIE];
  if (typeof value !== "string" || value.length > 1000) return undefined;
  const [state, codeVerifier, next, extra] = value.split(".");
  if (!state || !codeVerifier || next === "" || extra !== undefined) return undefined;
  return { state, codeVerifier, ...(next && { next: Buffer.from(next, "base64url").toString() }) };
}

export function clearGoogleOAuthCookie(res: Response): void {
  res.clearCookie(GOOGLE_OAUTH_COOKIE, baseOptions);
}
