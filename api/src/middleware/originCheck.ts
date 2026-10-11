import type { RequestHandler } from "express";
import { HttpError } from "../lib/errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * SECURITY: CSRF protection (Cross-Site Request Forgery).
 *
 * The attack: you're logged in here, then visit evil.example, which secretly submits
 * a form to our API. The browser would attach your session cookie, and the request
 * would act as you. Two defences:
 *   1. The cookie is SameSite=Lax, so browsers don't send it on cross-site POSTs.
 *   2. This check: every state-changing request must carry an Origin header equal to
 *      our own site. Browsers always set Origin on POST/PATCH/DELETE, and a page on
 *      another site can't fake it.
 * Reading (GET) changes nothing, so it's allowed from anywhere.
 */
export function originCheck(allowedOrigin: string): RequestHandler {
  const allowed = new URL(allowedOrigin).origin; // normalise: no trailing slash, lower-case host
  return (req, _res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();
    if (req.get("origin") === allowed) return next();
    next(new HttpError(403, "forbidden_origin", "Cross-site request blocked"));
  };
}
