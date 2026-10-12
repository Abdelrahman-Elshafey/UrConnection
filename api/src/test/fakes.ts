import type { Group } from "@urconnections/shared";
import type { AppDeps } from "../app";
import type { MailMessage, Mailer } from "../lib/mailer";

/** A mailer that keeps messages in memory instead of sending them. Tests read `sent`. */
export function fakeMailer(): { mailer: Mailer; sent: MailMessage[] } {
  const sent: MailMessage[] = [];
  return { sent, mailer: { send: async (message) => void sent.push(message) } };
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
    ...overrides,
  };
}
