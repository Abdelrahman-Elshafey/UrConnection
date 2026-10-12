import type { RequestHandler } from "express";
import { HttpError } from "../../lib/errors";
import { clearSessionCookie, SESSION_COOKIE, SESSION_RENEW_BELOW_MS, SESSION_TTL_MS, setSessionCookie } from "./cookies";
import type { SessionsRepository } from "./sessions.repository";
import { hashToken } from "./tokens";

/**
 * Runs on every request: if a session cookie is present and valid, puts the user on
 * `req.user`. No cookie or an invalid one isn't an error here (public pages work for
 * everyone); routes that need a user add `requireAuth`.
 */
export function loadSession({ sessions }: { sessions: SessionsRepository }): RequestHandler {
  return async (req, res, next) => {
    const token: unknown = req.cookies?.[SESSION_COOKIE];
    // Real tokens are 43 characters; refuse oddities before touching the database.
    if (typeof token !== "string" || token.length === 0 || token.length > 100) return next();

    const idHash = hashToken(token);
    const found = await sessions.findValid(idHash);
    if (!found) {
      clearSessionCookie(res); // expired or logged out elsewhere: tidy up the browser too
      return next();
    }

    req.user = found.user;
    req.sessionIdHash = idHash;

    // Sliding expiry: an active user stays signed in, an inactive one is logged out after
    // 30 days. Renew only when less than half is left, not on every single request.
    if (found.expiresAt.getTime() - Date.now() < SESSION_RENEW_BELOW_MS) {
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
      await sessions.extend(idHash, expiresAt);
      setSessionCookie(res, token, expiresAt);
    }
    next();
  };
}

/** Put before any route that needs a signed-in user: 401 otherwise. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(new HttpError(401, "unauthenticated", "Please sign in"));
  next();
};

/** Put after requireAuth on actions that need a confirmed email address: 403 otherwise. */
export const requireVerified: RequestHandler = (req, _res, next) => {
  if (!req.user?.email_verified) {
    return next(new HttpError(403, "email_not_verified", "Please confirm your email address first."));
  }
  next();
};
