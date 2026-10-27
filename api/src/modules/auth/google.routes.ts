import type { OAuthErrorCode } from "@urconnections/shared";
import { Router, type Response } from "express";
import { config } from "../../config";
import { safeNextPath } from "../../lib/nextPath";
import { limitRequests, MINUTE } from "../../lib/rateLimit";
import { clearGoogleOAuthCookie, readGoogleOAuthCookie, setGoogleOAuthCookie } from "./cookies";
import type { GoogleOAuth } from "./google";
import type { OAuthAccountsRepository } from "./oauthAccounts.repository";
import type { SessionsRepository } from "./sessions.repository";
import { startSession } from "./startSession";
import { newSessionToken } from "./tokens";

export interface GoogleDeps {
  sessions: SessionsRepository;
  oauthAccounts: OAuthAccountsRepository;
  /** null when GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET aren't set: the routes then say so. */
  google: GoogleOAuth | null;
}

/**
 * GET /api/auth/google[?next=/create]  → redirect to Google's account chooser
 * GET /api/auth/google/callback        ← Google redirects back here; sign in, then go to the site
 *                                         (to `next` if the sign-in started with one, else home)
 *
 * Both are page navigations, not fetch() calls (the browser has to visit Google itself),
 * so every outcome is a redirect: home on success, /login?error=<code> otherwise.
 * See google.ts for the whole flow.
 */
export function googleRouter({ sessions, oauthAccounts, google }: GoogleDeps): Router {
  const router = Router();

  const site = new URL(config.APP_ORIGIN).origin;
  /** Back to the login page with a message. `next` stays, so "try again" still ends up there. */
  const toLogin = (res: Response, code: OAuthErrorCode, next?: string) =>
    res.redirect(`${site}/login?error=${code}${next ? `&next=${encodeURIComponent(next)}` : ""}`);

  // One sign-in is two requests (start + callback), so this allows about 20 per 15 minutes per IP.
  // A page navigation can't show a JSON error, so this limiter redirects instead.
  router.use(limitRequests({ limit: 40, windowMs: 15 * MINUTE, handler: (_req, res) => toLogin(res, "google_too_many") }));

  // A redirect that signs someone in must never be cached by a browser or proxy.
  router.use((_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });

  router.get("/", (req, res) => {
    const next = safeNextPath(req.query.next, site);
    if (!google) return toLogin(res, "google_unavailable", next);

    // SECURITY: two fresh random values per attempt (32 bytes each, like session tokens):
    // - state: proves the callback belongs to a sign-in *this browser* started. Without it,
    //   an attacker could send you a callback link carrying *their* code, and you'd end up
    //   signed in to the attacker's account ("login CSRF") without noticing.
    // - codeVerifier (PKCE): only its hash goes to Google now; the verifier itself goes
    //   with the code exchange later. A stolen `code` (from logs, history, a malicious app)
    //   is useless without it.
    const state = newSessionToken();
    const codeVerifier = newSessionToken();
    // `next` waits in the same cookie while the user is on Google's page.
    setGoogleOAuthCookie(res, { state, codeVerifier, next });
    res.redirect(google.authorizationUrl(state, codeVerifier).toString());
  });

  router.get("/callback", async (req, res) => {
    const saved = readGoogleOAuthCookie(req.cookies);
    clearGoogleOAuthCookie(res); // single use, whatever happens next
    const next = safeNextPath(saved?.next, site); // checked again: never trust a cookie blindly
    if (!google) return toLogin(res, "google_unavailable", next);

    // Express 5 parses the query string into plain strings (or arrays if repeated).
    const { code, state, error } = req.query;
    // The user pressed "Cancel" on Google's page (or Google refused): ?error=access_denied
    if (typeof error === "string") return toLogin(res, error === "access_denied" ? "google_cancelled" : "google_failed", next);
    // SECURITY: no cookie, or a state that doesn't match, means this browser didn't start
    // this sign-in (or it took over 10 minutes). Plain !== is fine: state isn't a secret
    // the attacker can learn by timing, it's a value only this browser's cookie holds.
    if (typeof code !== "string" || typeof state !== "string" || !saved || state !== saved.state) {
      return toLogin(res, "google_expired", next);
    }

    try {
      const profile = await google.exchangeCode(code, saved.codeVerifier);
      // SECURITY: only trust an email Google itself has verified. Otherwise anyone could
      // create a Google account claiming someone else's address and take over their account here.
      if (!profile.emailVerified) return toLogin(res, "google_unverified", next);

      const { userId, outcome } = await oauthAccounts.signInWithGoogle(profile);
      req.log.info({ userId, outcome }, "google sign-in");
      await startSession(sessions, req, res, userId);
      res.redirect(`${site}${next ?? "/"}`);
    } catch (err) {
      // A JSON error page would strand the user mid-navigation: log it, send them back.
      req.log.error({ err }, "google sign-in failed");
      toLogin(res, "google_failed", next);
    }
  });

  return router;
}
