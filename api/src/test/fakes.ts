import type { Group } from "@urconnections/shared";
import type { AppDeps } from "../app";
import type { MailMessage, Mailer } from "../lib/mailer";
import type { Storage } from "../lib/storage";
import type { GoogleOAuth, GoogleProfile } from "../modules/auth/google";

/** A mailer that keeps messages in memory instead of sending them. Tests read `sent`. */
export function fakeMailer(): { mailer: Mailer; sent: MailMessage[] } {
  const sent: MailMessage[] = [];
  return { sent, mailer: { send: async (message) => void sent.push(message) } };
}

/**
 * A pretend Google. `profiles` maps an authorization code to the profile Google would
 * return for it; unknown codes fail like a real invalid code. `exchanges` records each
 * code exchange so tests can check the PKCE verifier was passed along.
 */
export function fakeGoogle(profiles: Record<string, GoogleProfile> = {}) {
  const exchanges: { code: string; codeVerifier: string }[] = [];
  const google: GoogleOAuth = {
    authorizationUrl: (state, codeVerifier) => {
      const url = new URL("https://accounts.google.test/auth");
      url.searchParams.set("state", state);
      url.searchParams.set("code_challenge", `challenge-of-${codeVerifier}`);
      return url;
    },
    exchangeCode: async (code, codeVerifier) => {
      exchanges.push({ code, codeVerifier });
      const profile = profiles[code];
      if (!profile) throw new Error("invalid_grant");
      return profile;
    },
  };
  return { google, exchanges };
}

/** A Google profile for tests; override any field. */
export const googleProfile = (overrides: Partial<GoogleProfile> = {}): GoogleProfile => ({
  sub: "109876543210987654321",
  email: "ana@gmail.com",
  emailVerified: true,
  name: "Ana Google",
  ...overrides,
});

/** Storage in a Map instead of S3. Tests read `objects` to see what was stored or deleted. */
export function fakeStorage(): { storage: Storage; objects: Map<string, { body: Buffer; contentType: string; cacheControl: string }> } {
  const objects = new Map<string, { body: Buffer; contentType: string; cacheControl: string }>();
  return {
    objects,
    storage: {
      put: async (key, body, options) => void objects.set(key, { body, ...options }),
      delete: async (key) => void objects.delete(key),
    },
  };
}

/** A valid group for tests; override any field. */
export const sampleGroup = (overrides: Partial<Group> = {}): Group => ({
  id: "01a1216e-ee83-7d76-bab2-04817f13685a",
  user_id: "01a1216e-ee83-7d76-bab2-04817f136800",
  title: "Calc club",
  description: "A friendly group to study calculus together.",
  topic: "Math",
  platform: "discord",
  meeting_link: "https://discord.gg/abc",
  country: "Egypt",
  city: "Cairo",
  created_at: "2026-10-09T12:00:00.000Z",
  ...overrides,
});

/**
 * A full set of working fake dependencies for createApp(). Each test overrides only
 * what it cares about, e.g. fakeDeps({ checkDatabase: async () => { throw ... } }).
 * When AppDeps grows, TypeScript points here, so tests never silently miss a dependency.
 */
export function fakeDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    checkDatabase: async () => {},
    groups: {
      list: async () => ({ items: [sampleGroup()], nextCursor: null }),
      getById: async (id) => (id === sampleGroup().id ? sampleGroup() : undefined),
      // Writes need a signed-in owner; they're tested against Postgres (groups.write.db.test.ts).
      listByOwner: async () => [],
      create: async () => {
        throw new Error("fake groups.create not implemented");
      },
      getOwned: async () => undefined,
      updateOwned: async () => undefined,
      deleteOwned: async () => false,
    },
    // Nobody is signed in: auth flows are tested against real Postgres (auth.db.test.ts).
    users: {
      findForLogin: async () => undefined,
      create: async () => {
        throw new Error("fake users.create not implemented");
      },
      updateProfile: async () => undefined,
      findByEmail: async () => undefined,
      markEmailVerified: async () => undefined,
      setPasswordHash: async () => {},
      setAvatarKey: async () => undefined,
    },
    sessions: {
      create: async () => {},
      findValid: async () => undefined,
      extend: async () => {},
      delete: async () => {},
      deleteAllForUser: async () => {},
      deleteExpired: async () => 0,
    },
    emailTokens: {
      issue: async () => "fake-token",
      consume: async () => undefined,
    },
    mailer: fakeMailer().mailer,
    // Google sign-in is off unless a test passes a fake Google (google.db.test.ts).
    oauthAccounts: {
      signInWithGoogle: async () => {
        throw new Error("fake oauthAccounts.signInWithGoogle not implemented");
      },
    },
    google: null,
    storage: fakeStorage().storage,
    ...overrides,
  };
}
