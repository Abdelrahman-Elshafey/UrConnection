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
