import { meResponseSchema } from "@urconnections/shared";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app";
import { fakeDeps } from "../../test/fakes";
import { createTestDb } from "../../test/testDb";
import { createUsersRepository } from "../users/users.repository";
import { createSessionsRepository } from "./sessions.repository";
import { hashToken } from "./tokens";

/**
 * The whole auth flow with real Postgres and real argon2:
 * register → me → logout → login, plus every way it should refuse.
 */
const { db, reset, truncate } = createTestDb();
const ORIGIN = "http://localhost:5173";
const PASSWORD = "Str0ng!pass";

/** A fresh app per test: fresh rate-limit counters. */
const makeApp = () =>
  createApp(fakeDeps({ users: createUsersRepository(db), sessions: createSessionsRepository(db) }));

/** request.agent keeps cookies between requests, like a browser. */
const browser = () => request.agent(makeApp());

const register = (agent: ReturnType<typeof browser>, body: object = {}) =>
  agent.post("/api/auth/register").set("Origin", ORIGIN).send({ email: "ana@example.com", password: PASSWORD, ...body });

const login = (agent: ReturnType<typeof browser>, email: string, password: string) =>
  agent.post("/api/auth/login").set("Origin", ORIGIN).send({ email, password });

const me = async (agent: ReturnType<typeof browser>) => meResponseSchema.parse((await agent.get("/api/auth/me")).body);

beforeAll(reset);
beforeEach(truncate);
afterAll(() => db.destroy());

describe("register", () => {
  it("creates the account, signs in, and never returns the password hash", async () => {
    const agent = browser();
    const res = await register(agent, { display_name: "Ana", country: "Egypt" });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: "ana@example.com", display_name: "Ana", country: "Egypt", email_verified: false });
    expect(JSON.stringify(res.body)).not.toContain("argon2"); // no hash anywhere in the response
    expect((await me(agent)).user?.email).toBe("ana@example.com");
  });

  it("sets a secure-by-default session cookie", async () => {
    const res = await register(browser());
    const cookie = res.headers["set-cookie"]![0]!;
    expect(cookie).toMatch(/^sid=[A-Za-z0-9_-]{43};/); // 32 random bytes, base64url
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
  });

  it("stores the password as argon2id and the session as a sha256 hash, never in plain text", async () => {
    const res = await register(browser());
    const token = res.headers["set-cookie"]![0]!.match(/^sid=([^;]+)/)![1]!;

    const user = await db.selectFrom("users").select("password_hash").executeTakeFirstOrThrow();
    expect(user.password_hash).toMatch(/^\$argon2id\$/);
    expect(user.password_hash).not.toContain(PASSWORD);

    const session = await db.selectFrom("sessions").select("id_hash").executeTakeFirstOrThrow();
    expect(session.id_hash).toBe(hashToken(token));
    expect(session.id_hash).not.toBe(token);
  });

  it("refuses an email that is already used, ignoring upper/lower case (409)", async () => {
    await register(browser());
    const res = await register(browser(), { email: "ANA@Example.COM" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("email_taken");
  });

  it("enforces the password policy on the server too (400)", async () => {
    const res = await register(browser(), { password: "weakpass" });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe("password");
  });
});

describe("login", () => {
  beforeEach(async () => {
    await register(browser()); // ana@example.com / PASSWORD exists
  });

  it("signs in with the right password, email in any case", async () => {
    const agent = browser();
    const res = await login(agent, "Ana@Example.com", PASSWORD);
    expect(res.status).toBe(200);
    expect((await me(agent)).user?.email).toBe("ana@example.com");
  });

  it("gives the same 401 for a wrong password and an unknown email", async () => {
    const wrongPassword = await login(browser(), "ana@example.com", "Wr0ng!pass");
    const unknownEmail = await login(browser(), "nobody@example.com", PASSWORD);
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body); // nothing to tell them apart
  });

  it("issues a new session on every login (rotation) and drops the old one", async () => {
    const agent = browser();
    await login(agent, "ana@example.com", PASSWORD);
    await login(agent, "ana@example.com", PASSWORD);
    // register's session + this browser's latest one; the first login session was replaced
    const { count } = await db.selectFrom("sessions").select((eb) => eb.fn.countAll<string>().as("count")).executeTakeFirstOrThrow();
    expect(count).toBe("2");
  });

  it("rate-limits repeated failures for one email (429)", async () => {
    const app = makeApp(); // one app = one set of counters
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      const res = await request(app).post("/api/auth/login").set("Origin", ORIGIN).send({ email: "ana@example.com", password: "Wr0ng!pass" });
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});

describe("logout and expiry", () => {
  it("logout ends the session on the server, not just in the browser", async () => {
    const agent = browser();
    const res = await register(agent);
    const cookie = res.headers["set-cookie"]![0]!.split(";")[0]!; // "sid=<token>"

    expect((await agent.post("/api/auth/logout").set("Origin", ORIGIN)).status).toBe(204);
    expect((await me(agent)).user).toBeNull();

    // Even someone who copied the old cookie is now signed out.
    const replay = await request(makeApp()).get("/api/auth/me").set("Cookie", cookie);
    expect(replay.body.user).toBeNull();
  });

  it("an expired session no longer signs you in", async () => {
    const agent = browser();
    await register(agent);
    await db.updateTable("sessions").set({ expires_at: new Date(Date.now() - 1000) }).execute();
    expect((await me(agent)).user).toBeNull();
  });

  it("extends a session that is past half its lifetime (sliding expiry)", async () => {
    const agent = browser();
    await register(agent);
    const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days left
    await db.updateTable("sessions").set({ expires_at: soon }).execute();

    const res = await agent.get("/api/auth/me");
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^sid=/); // cookie re-sent with a new expiry
    const { expires_at } = await db.selectFrom("sessions").select("expires_at").executeTakeFirstOrThrow();
    expect(expires_at.getTime()).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60 * 1000);
  });
});

describe("PATCH /api/users/me", () => {
  it("updates only your own profile and ignores unknown fields", async () => {
    const agent = browser();
    await register(agent);
    const res = await agent
      .patch("/api/users/me")
      .set("Origin", ORIGIN)
      .send({ display_name: "  Ana B.  ", city: "Cairo", email: "hacker@evil.example", id: "someone-else" });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ display_name: "Ana B.", city: "Cairo", email: "ana@example.com" });
  });

  it("rejects values that break the rules (400)", async () => {
    const agent = browser();
    await register(agent);
    const res = await agent.patch("/api/users/me").set("Origin", ORIGIN).send({ display_name: "x".repeat(101) });
    expect(res.status).toBe(400);
  });
});
