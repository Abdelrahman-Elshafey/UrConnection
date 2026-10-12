import { meResponseSchema } from "@urconnections/shared";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app";
import { fakeDeps, fakeGoogle, googleProfile } from "../../test/fakes";
import { createTestDb } from "../../test/testDb";
import { createUsersRepository } from "../users/users.repository";
import type { GoogleProfile } from "./google";
import { createOAuthAccountsRepository } from "./oauthAccounts.repository";
import { createSessionsRepository } from "./sessions.repository";

/**
 * Google sign-in with real Postgres and a fake Google: which user a Google account
 * becomes (new / already linked / linked by verified email / pre-hijack defence).
 */
const { db, reset, truncate } = createTestDb();
const ORIGIN = "http://localhost:5173";
const PASSWORD = "Str0ng!pass";

/** Every test signs in with the code "code"; `profile` decides who Google says it is. */
function makeApp(profile: GoogleProfile = googleProfile()) {
  return createApp(
    fakeDeps({
      users: createUsersRepository(db),
      sessions: createSessionsRepository(db),
      oauthAccounts: createOAuthAccountsRepository(db),
      google: fakeGoogle({ code: profile }).google,
    }),
  );
}

type Agent = ReturnType<typeof request.agent>;

/** The full browser round trip: start → (Google) → callback. Returns the callback response. */
async function signInWithGoogle(agent: Agent) {
  const start = await agent.get("/api/auth/google");
  const state = new URL(start.headers.location!).searchParams.get("state");
  return agent.get("/api/auth/google/callback").query({ code: "code", state });
}

const me = async (agent: Agent) => meResponseSchema.parse((await agent.get("/api/auth/me")).body).user;

/** A password account, created through the API like a real sign-up. */
async function registerWithPassword(email: string) {
  const agent = request.agent(makeApp());
  const res = await agent.post("/api/auth/register").set("Origin", ORIGIN).send({ email, password: PASSWORD });
  expect(res.status).toBe(201);
  return { agent, userId: res.body.user.id as string };
}

const passwordLogin = (email: string) =>
  request(makeApp()).post("/api/auth/login").set("Origin", ORIGIN).send({ email, password: PASSWORD });

const countUsers = async () => Number((await db.selectFrom("users").select(db.fn.countAll().as("n")).executeTakeFirstOrThrow()).n);

beforeAll(reset);
beforeEach(truncate);
afterAll(() => db.destroy());

describe("Google sign-in", () => {
  it("creates a verified account without a password for a new Google user", async () => {
    const agent = request.agent(makeApp());
    const res = await signInWithGoogle(agent);

    expect(res.headers.location).toBe(`${ORIGIN}/`);
    expect(await me(agent)).toMatchObject({ email: "ana@gmail.com", display_name: "Ana Google", email_verified: true });

    const user = await db.selectFrom("users").select(["password_hash", "email_verified_at"]).executeTakeFirstOrThrow();
    expect(user.password_hash).toBeNull(); // Google-only: no password to guess
    expect(user.email_verified_at).not.toBeNull();
    const link = await db.selectFrom("oauth_accounts").selectAll().executeTakeFirstOrThrow();
    expect(link).toMatchObject({ provider: "google", provider_user_id: googleProfile().sub });
  });

  it("signs the same Google account into the same user next time (no duplicate)", async () => {
    const first = request.agent(makeApp());
    await signInWithGoogle(first);
    const second = request.agent(makeApp());
    await signInWithGoogle(second);

    expect((await me(second))?.id).toBe((await me(first))?.id);
    expect(await countUsers()).toBe(1);
  });

  it("finds the user by Google's id even after the Gmail address changed", async () => {
    const before = request.agent(makeApp());
    await signInWithGoogle(before);
    const after = request.agent(makeApp(googleProfile({ email: "ana.new@gmail.com" })));
    await signInWithGoogle(after);
    expect((await me(after))?.id).toBe((await me(before))?.id);
  });

  it("links to an existing verified password account and keeps its password", async () => {
    const { userId } = await registerWithPassword("ana@gmail.com");
    await db.updateTable("users").set({ email_verified_at: new Date() }).execute();

    const agent = request.agent(makeApp());
    await signInWithGoogle(agent);

    expect((await me(agent))?.id).toBe(userId);
    expect(await countUsers()).toBe(1);
    expect((await passwordLogin("ana@gmail.com")).status).toBe(200); // both ways work now
  });

  it("matches the email ignoring upper/lower case", async () => {
    const { userId } = await registerWithPassword("Ana@Gmail.com");
    await db.updateTable("users").set({ email_verified_at: new Date() }).execute();
    const agent = request.agent(makeApp());
    await signInWithGoogle(agent);
    expect((await me(agent))?.id).toBe(userId);
  });

  it("pre-hijack defence: an unverified account with that email loses its password and sessions", async () => {
    // An attacker registered the victim's address with a password and stays signed in...
    const attacker = await registerWithPassword("ana@gmail.com");
    expect(await me(attacker.agent)).not.toBeNull();

    // ...then the real owner arrives with Google, which proves they own the address.
    const owner = request.agent(makeApp());
    await signInWithGoogle(owner);

    expect((await me(owner))?.id).toBe(attacker.userId);
    expect((await me(owner))?.email_verified).toBe(true);
    expect(await me(attacker.agent)).toBeNull(); // the attacker's session is gone
    expect((await passwordLogin("ana@gmail.com")).status).toBe(401); // and so is their password
  });

  it("rotates the session: a session cookie from before sign-in stops working", async () => {
    const agent = request.agent(makeApp());
    await signInWithGoogle(agent);
    const before = await db.selectFrom("sessions").select("id_hash").execute();
    await signInWithGoogle(agent);
    const after = await db.selectFrom("sessions").select("id_hash").execute();
    expect(after).toHaveLength(1);
    expect(after[0]!.id_hash).not.toBe(before[0]!.id_hash);
  });

  it("a Google-only account can't be signed into with an empty or guessed password", async () => {
    await signInWithGoogle(request.agent(makeApp()));
    const res = await passwordLogin("ana@gmail.com");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("invalid_credentials");
  });
});
