import { decodeIdToken, Google } from "arctic";
import { z } from "zod";

/**
 * Google sign-in, OAuth 2.0 "authorization code" flow with PKCE (Stage 9).
 *
 *   1. Browser → GET /api/auth/google. We make two random values, `state` and a PKCE
 *      `codeVerifier`, keep them in a short-lived httpOnly cookie, and redirect to Google.
 *   2. The user picks an account on accounts.google.com. Google redirects the browser back
 *      to /api/auth/google/callback?code=...&state=...
 *   3. We check `state` against the cookie, then send `code` + `codeVerifier` + our client
 *      secret straight to Google's token endpoint (server to server). Google answers with
 *      an ID token: a signed statement "this is user <sub>, email <email>, verified: yes".
 *
 * arctic only builds the URLs and does the token request; the decisions (who is this user,
 * link or create) are ours, in google.routes.ts. This file is the only one that knows about
 * arctic, and the routes only see the `GoogleOAuth` interface, so tests can use a fake Google.
 */

/** What we keep from Google's answer. */
export interface GoogleProfile {
  /** Google's permanent id for the account ("subject"). Emails can change; `sub` never does. */
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
}

export interface GoogleOAuth {
  /** The accounts.google.com URL to send the browser to. */
  authorizationUrl(state: string, codeVerifier: string): URL;
  /** Trades the one-time `code` from the callback for the user's profile. */
  exchangeCode(code: string, codeVerifier: string): Promise<GoogleProfile>;
}

/**
 * openid: give us an ID token. email: include the address and whether Google verified it.
 * profile: include the name. Nothing else: we never touch the user's Google data.
 */
const SCOPES = ["openid", "email", "profile"];

/** The ID token claims we rely on. Anything else in the token is ignored. */
const idTokenClaimsSchema = z.object({
  iss: z.enum(["https://accounts.google.com", "accounts.google.com"]),
  aud: z.string(),
  sub: z.string().min(1).max(255),
  email: z.email(),
  email_verified: z.boolean(),
  name: z.string().optional(),
});

/**
 * SECURITY: checks the claims really are meant for us. `aud` (audience) must be our own
 * client id, so an ID token Google issued to some other website can't be replayed here.
 * Exported for unit tests.
 */
export function parseGoogleClaims(claims: unknown, clientId: string): GoogleProfile {
  const parsed = idTokenClaimsSchema.parse(claims);
  if (parsed.aud !== clientId) throw new Error("ID token was issued for another client");
  return {
    sub: parsed.sub,
    email: parsed.email,
    emailVerified: parsed.email_verified,
    name: (parsed.name ?? "").trim().slice(0, 100), // users.display_name allows 100 characters
  };
}

export function createGoogleOAuth(clientId: string, clientSecret: string, redirectUri: string): GoogleOAuth {
  const google = new Google(clientId, clientSecret, redirectUri);
  return {
    authorizationUrl(state, codeVerifier) {
      const url = google.createAuthorizationURL(state, codeVerifier, SCOPES);
      // Always show Google's account chooser, so someone with several Google accounts
      // (or on a shared computer) consciously picks one.
      url.searchParams.set("prompt", "select_account");
      return url;
    },

    async exchangeCode(code, codeVerifier) {
      const tokens = await google.validateAuthorizationCode(code, codeVerifier);
      // SECURITY: decodeIdToken reads the token without checking its signature. That is
      // allowed here (OpenID Connect Core §3.1.3.7): we received it directly from Google's
      // token endpoint over HTTPS, in exchange for our client secret, so nobody could have
      // swapped it on the way. A token that came from the *browser* would need full
      // signature verification against Google's public keys.
      return parseGoogleClaims(decodeIdToken(tokens.idToken()), clientId);
    },
  };
}
