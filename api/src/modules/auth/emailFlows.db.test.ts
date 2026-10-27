import { meResponseSchema } from "@urconnections/shared";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app";
import type { MailMessage } from "../../lib/mailer";
import { fakeDeps, fakeMailer } from "../../test/fakes";
import { createTestDb } from "../../test/testDb";
import { createUsersRepository } from "../users/users.repository";
import { createEmailTokensRepository } from "./emailTokens.repository";
import { createSessionsRepository } from "./sessions.repository";

/**
 * Email verification and password reset against real Postgres. A fake mailer collects
 * the emails; the tests take the link out of them, like a user clicking it.
 */
const { db, reset, truncate } = createTestDb();
const ORIGIN = "http://localhost:5173";
const PASSWORD = "Str0ng!pass";
const NEW_PASSWORD = "N3w!password";

type Agent = ReturnType<typeof request.agent>;
let app: ReturnType<typeof createApp>;
let sent: MailMessage[];

beforeAll(reset);
beforeEach(async () => {
  await truncate();
  const mail = fakeMailer();
  sent = mail.sent;
  app = createApp(
    fakeDeps({
      users: createUsersRepository(db),
      sessions: createSessionsRepository(db),
      emailTokens: createEmailTokensRepository(db),
      mailer: mail.mailer,
    }),
  );
});
afterAll(() => db.destroy());

/** The token from the link in an email's text, e.g. ".../verify-email?token=abc". */
function tokenFrom(message: MailMessage | undefined, path: string): string {
  const match = message?.text.match(new RegExp(`${ORIGIN}${path}\\?token=([A-Za-z0-9_-]{43})`));
  if (!match) throw new Error(`no ${path} link in email: ${message?.text}`);
  return match[1]!;
}

const post = (agent: Agent | ReturnType<typeof request>, path: string, body: object = {}) =>
  (agent as Agent).post(`/api/auth${path}`).set("Origin", ORIGIN).send(body);

async function registerAna(): Promise<Agent> {
  const agent = request.agent(app);
  const res = await post(agent, "/register", { email: "ana@example.com", password: PASSWORD });
  expect(res.status).toBe(201);
  return agent;
}

const me = async (agent: Agent) => meResponseSchema.parse((await agent.get("/api/auth/me")).body).user;

/** Waits until the fake mailer has `count` messages (forgot-password sends after replying). */
async function waitForMail(count: number) {
  for (let i = 0; i < 50 && sent.length < count; i++) await new Promise((r) => setTimeout(r, 20));
}

describe("email verification", () => {
  it("sign-up sends a verification link; using it verifies the email", async () => {
    const agent = await registerAna();
    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toBe("ana@example.com");
    expect((await me(agent))?.email_verified).toBe(false);

    const token = tokenFrom(sent[0], "/verify-email");
    expect((await post(request(app), "/verify-email", { token })).status).toBe(204);
    expect((await me(agent))?.email_verified).toBe(true);
  });

  it("stores only a hash of the token", async () => {
    await registerAna();
    const token = tokenFrom(sent[0], "/verify-email");
    const row = await db.selectFrom("email_tokens").select("token_hash").executeTakeFirstOrThrow();
    expect(row.token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(row.token_hash).not.toBe(token);
  });

  it("a link works only once", async () => {
    await registerAna();
    const token = tokenFrom(sent[0], "/verify-email");
    expect((await post(request(app), "/verify-email", { token })).status).toBe(204);
    const again = await post(request(app), "/verify-email", { token });
    expect(again.status).toBe(400);
    expect(again.body.error.code).toBe("invalid_token");
  });

  it("an expired link is refused", async () => {
    await registerAna();
    await db.updateTable("email_tokens").set({ expires_at: new Date(Date.now() - 1000) }).execute();
    expect((await post(request(app), "/verify-email", { token: tokenFrom(sent[0], "/verify-email") })).status).toBe(400);
  });

  it("requesting a new link cancels the old one", async () => {
    const agent = await registerAna();
    const first = tokenFrom(sent[0], "/verify-email");
    expect((await post(agent, "/verify-email/request")).status).toBe(204);
    const second = tokenFrom(sent[1], "/verify-email");

    expect((await post(request(app), "/verify-email", { token: first })).status).toBe(400);
    expect((await post(request(app), "/verify-email", { token: second })).status).toBe(204);
  });

  it("resending requires a session (401) and sends nothing once verified", async () => {
    expect((await post(request(app), "/verify-email/request")).status).toBe(401);
    const agent = await registerAna();
    await post(request(app), "/verify-email", { token: tokenFrom(sent[0], "/verify-email") });
    await post(agent, "/verify-email/request");
    expect(sent).toHaveLength(1); // no second email for an already verified address
  });

  it("rejects a malformed token before touching the database (400)", async () => {
    expect((await post(request(app), "/verify-email", { token: "nope" })).status).toBe(400);
  });
});

describe("forgot / reset password", () => {
  it("answers the same for unknown and known emails, and only emails the real account", async () => {
    await registerAna();
    const unknown = await post(request(app), "/forgot-password", { email: "nobody@example.com" });
    const known = await post(request(app), "/forgot-password", { email: "ana@example.com" });

    expect(unknown.status).toBe(202);
    expect(known.status).toBe(202);
    expect(unknown.body).toEqual(known.body); // nothing to tell them apart
    await waitForMail(2);
    expect(sent.map((m) => m.subject)).toEqual(["Confirm your email address", "Reset your password"]);
  });

  it("resetting sets the new password, signs out everywhere, and verifies the email", async () => {
    const agent = await registerAna(); // signed in in this browser
    await post(request(app), "/forgot-password", { email: "ana@example.com" });
    await waitForMail(2);
    const token = tokenFrom(sent[1], "/reset-password");

    expect((await post(request(app), "/reset-password", { token, password: NEW_PASSWORD })).status).toBe(204);

    expect(await me(agent)).toBeNull(); // the old session no longer works
    expect((await post(request(app), "/login", { email: "ana@example.com", password: PASSWORD })).status).toBe(401);
    const login = await post(request.agent(app), "/login", { email: "ana@example.com", password: NEW_PASSWORD });
    expect(login.status).toBe(200);
    expect(login.body.user.email_verified).toBe(true);
  });

  it("a reset link works once, and enforces the password policy", async () => {
    await registerAna();
    await post(request(app), "/forgot-password", { email: "ana@example.com" });
    await waitForMail(2);
    const token = tokenFrom(sent[1], "/reset-password");

    expect((await post(request(app), "/reset-password", { token, password: "weak" })).status).toBe(400);
    expect((await post(request(app), "/reset-password", { token, password: NEW_PASSWORD })).status).toBe(204);
    expect((await post(request(app), "/reset-password", { token, password: NEW_PASSWORD })).status).toBe(400);
  });

  it("a verify link can't be used as a reset link", async () => {
    await registerAna();
    const verifyToken = tokenFrom(sent[0], "/verify-email");
    const res = await post(request(app), "/reset-password", { token: verifyToken, password: NEW_PASSWORD });
    expect(res.status).toBe(400);
  });
});
