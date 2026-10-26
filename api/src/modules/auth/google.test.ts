import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app";
import { fakeDeps, fakeGoogle, googleProfile } from "../../test/fakes";
import type { GoogleProfile } from "./google";
import { parseGoogleClaims } from "./google";

/**
 * The Google flow's HTTP layer with a fake Google and a fake repository: redirects,
 * the state/PKCE cookie, and every way the callback refuses. How a profile becomes a
 * user (create / link) is tested against Postgres in google.db.test.ts.
 */
const SITE = "http://localhost:5173";
const CLIENT_ID = "client-123.apps.googleusercontent.com";

function makeApp(profiles: Record<string, GoogleProfile> = { "good-code": googleProfile() }) {
  const { google, exchanges } = fakeGoogle(profiles);
  const signIns: GoogleProfile[] = [];
  const base = fakeDeps();
  const app = createApp({
    ...base,
    google,
    oauthAccounts: {
      signInWithGoogle: async (profile) => {
        signIns.push(profile);
        return { userId: "01a1216e-ee83-7d76-bab2-04817f136800", outcome: "created" };
      },
    },
  });
  return { agent: request.agent(app), exchanges, signIns };
}

/** Starts a sign-in like a browser would: the agent keeps the cookie, we keep `state`. */
async function start(agent: ReturnType<typeof request.agent>, next?: string) {
  const res = await agent.get("/api/auth/google").query(next === undefined ? {} : { next });
  return { res, state: new URL(res.headers.location!).searchParams.get("state")! };
}

describe("parseGoogleClaims", () => {
  const claims = {
    iss: "https://accounts.google.com",
    aud: CLIENT_ID,
    sub: "1098",
    email: "ana@gmail.com",
    email_verified: true,
    name: "  Ana  ",
  };

  it("keeps what we need and tidies the name", () => {
    expect(parseGoogleClaims(claims, CLIENT_ID)).toEqual({ sub: "1098", email: "ana@gmail.com", emailVerified: true, name: "Ana" });
  });

  it("refuses a token issued for another website (aud)", () => {
    expect(() => parseGoogleClaims({ ...claims, aud: "someone-else" }, CLIENT_ID)).toThrow(/another client/);
  });

  it("refuses a token from another issuer", () => {
    expect(() => parseGoogleClaims({ ...claims, iss: "https://evil.example" }, CLIENT_ID)).toThrow();
  });

  it("refuses a token without an email", () => {
    const { email: _email, ...noEmail } = claims;
    expect(() => parseGoogleClaims(noEmail, CLIENT_ID)).toThrow();
  });
});

describe("GET /api/auth/google", () => {
  it("redirects to Google with a fresh state, and keeps state + verifier in an httpOnly cookie", async () => {
    const { agent } = makeApp();
    const { res, state } = await start(agent);

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/^https:\/\/accounts\.google\.test\/auth\?/);
    expect(state).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const cookie = res.headers["set-cookie"]![0]!;
    expect(cookie).toMatch(new RegExp(`^google_oauth=${state}\\.[A-Za-z0-9_-]{43};`));
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(res.headers["cache-control"]).toBe("no-store");
  });

  it("uses a different state every time", async () => {
    const { agent } = makeApp();
    expect((await start(agent)).state).not.toBe((await start(agent)).state);
  });

  it("explains when Google sign-in isn't configured", async () => {
    const res = await request(createApp(fakeDeps({ google: null }))).get("/api/auth/google");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(`${SITE}/login?error=google_unavailable`);
  });
});

describe("GET /api/auth/google/callback", () => {
  it("signs in and goes home, passing the PKCE verifier from the cookie to the code exchange", async () => {
    const { agent, exchanges, signIns } = makeApp();
    const { res: startRes, state } = await start(agent);
    const verifier = startRes.headers["set-cookie"]![0]!.match(/^google_oauth=[^.]+\.([^;]+)/)![1];

    const res = await agent.get("/api/auth/google/callback").query({ code: "good-code", state });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(`${SITE}/`);
    expect(exchanges).toEqual([{ code: "good-code", codeVerifier: verifier }]);
    expect(signIns).toEqual([googleProfile()]);
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies.some((c) => /^sid=[A-Za-z0-9_-]{43};/.test(c))).toBe(true); // session started
    expect(cookies.some((c) => /^google_oauth=;/.test(c))).toBe(true); // one-use cookie cleared
  });

  it("refuses a state that doesn't match the cookie (login CSRF)", async () => {
    const { agent, exchanges } = makeApp();
    await start(agent);
    const res = await agent.get("/api/auth/google/callback").query({ code: "good-code", state: "attacker-state" });
    expect(res.headers.location).toBe(`${SITE}/login?error=google_expired`);
    expect(exchanges).toEqual([]); // never even talked to Google
  });

  it("refuses a callback this browser didn't start (no cookie)", async () => {
    const { agent, exchanges } = makeApp();
    const res = await agent.get("/api/auth/google/callback").query({ code: "good-code", state: "x" });
    expect(res.headers.location).toBe(`${SITE}/login?error=google_expired`);
    expect(exchanges).toEqual([]);
  });

  it("can't be replayed: the cookie is single use", async () => {
    const { agent, signIns } = makeApp();
    const { state } = await start(agent);
    await agent.get("/api/auth/google/callback").query({ code: "good-code", state });
    const again = await agent.get("/api/auth/google/callback").query({ code: "good-code", state });
    expect(again.headers.location).toBe(`${SITE}/login?error=google_expired`);
    expect(signIns).toHaveLength(1);
  });

  it("reports a cancel on Google's page", async () => {
    const { agent } = makeApp();
    await start(agent);
    const res = await agent.get("/api/auth/google/callback").query({ error: "access_denied" });
    expect(res.headers.location).toBe(`${SITE}/login?error=google_cancelled`);
  });

  it("refuses a Google account whose email Google hasn't verified", async () => {
    const { agent, signIns } = makeApp({ "unverified-code": googleProfile({ emailVerified: false }) });
    const { state } = await start(agent);
    const res = await agent.get("/api/auth/google/callback").query({ code: "unverified-code", state });
    expect(res.headers.location).toBe(`${SITE}/login?error=google_unverified`);
    expect(signIns).toEqual([]);
  });

  it("returns to the page the sign-in started from (?next=)", async () => {
    const { agent } = makeApp();
    const { state } = await start(agent, "/groups/abc?x=1");
    const res = await agent.get("/api/auth/google/callback").query({ code: "good-code", state });
    expect(res.headers.location).toBe(`${SITE}/groups/abc?x=1`);
  });

  it.each(["https://evil.example/", "//evil.example", "/\\evil.example", "/\t/evil.example"])(
    "never redirects to another site (next=%s): it goes home instead",
    async (next) => {
      const { agent } = makeApp();
      const { res: startRes, state } = await start(agent, next);
      expect(startRes.headers["set-cookie"]![0]).toMatch(/^google_oauth=[^.;]+\.[^.;]+;/); // no next kept
      const res = await agent.get("/api/auth/google/callback").query({ code: "good-code", state });
      expect(res.headers.location).toBe(`${SITE}/`);
    },
  );

  it("keeps next when sending the user back to /login, so trying again still ends up there", async () => {
    const { agent } = makeApp();
    await start(agent, "/create");
    const res = await agent.get("/api/auth/google/callback").query({ error: "access_denied" });
    expect(res.headers.location).toBe(`${SITE}/login?error=google_cancelled&next=%2Fcreate`);
  });

  it("sends the user back to /login when the code exchange fails", async () => {
    const { agent } = makeApp();
    const { state } = await start(agent);
    const res = await agent.get("/api/auth/google/callback").query({ code: "bad-code", state });
    expect(res.headers.location).toBe(`${SITE}/login?error=google_failed`);
    expect((res.headers["set-cookie"] as unknown as string[]).some((c) => c.startsWith("sid="))).toBe(false);
  });
});
