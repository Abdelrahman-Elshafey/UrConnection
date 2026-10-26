import { groupSchema, myGroupsResponseSchema } from "@urconnections/shared";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app";
import { fakeDeps } from "../../test/fakes";
import { createTestDb } from "../../test/testDb";
import { createSessionsRepository } from "../auth/sessions.repository";
import { createUsersRepository } from "../users/users.repository";
import { createGroupsRepository } from "./groups.repository";

/**
 * Ownership with two real users against real Postgres:
 * A creates groups; B (a different signed-in user) must not be able to change them.
 */
const { db, reset, truncate } = createTestDb();
const ORIGIN = "http://localhost:5173";
// A fresh app per test (see beforeEach): each app has its own rate-limit counters.
// Sharing one would trip the register limit (10/hour per IP) after a few tests.
const makeApp = () =>
  createApp(
    fakeDeps({
      groups: createGroupsRepository(db),
      users: createUsersRepository(db),
      sessions: createSessionsRepository(db),
    }),
  );
let app: ReturnType<typeof makeApp>;

type Agent = ReturnType<typeof request.agent>;
let alice: Agent;
let bob: Agent;
let aliceId: string;

const newGroup = {
  title: "Calc club",
  description: "A friendly group to study calculus together.",
  topic: "Math",
  platform: "discord",
  meeting_link: "https://discord.gg/calc",
  country: "Egypt",
  city: "Cairo",
};

/** A signed-in browser for a fresh account with a verified email (needed to create groups). */
async function signUp(email: string, verified = true): Promise<[Agent, string]> {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/register").set("Origin", ORIGIN).send({ email, password: "Str0ng!pass" });
  const id: string = res.body.user.id;
  if (verified) await db.updateTable("users").set({ email_verified_at: new Date() }).where("id", "=", id).execute();
  return [agent, id];
}

const create = (agent: Agent, body: object = newGroup) => agent.post("/api/groups").set("Origin", ORIGIN).send(body);
const patch = (agent: Agent, id: string, body: object) => agent.patch(`/api/groups/${id}`).set("Origin", ORIGIN).send(body);
const remove = (agent: Agent, id: string) => agent.delete(`/api/groups/${id}`).set("Origin", ORIGIN);
const fetchGroup = async (id: string) => (await request(app).get(`/api/groups/${id}`)).body;

beforeAll(reset);
beforeEach(async () => {
  await truncate();
  app = makeApp();
  [alice, aliceId] = await signUp("alice@example.com");
  [bob] = await signUp("bob@example.com");
});
afterAll(() => db.destroy());

describe("POST /api/groups", () => {
  it("creates a group owned by the signed-in user", async () => {
    const res = await create(alice);
    expect(res.status).toBe(201);
    const group = groupSchema.parse(res.body);
    expect(group.user_id).toBe(aliceId);
    expect(await fetchGroup(group.id)).toEqual(group); // visible publicly
  });

  it("ignores a user_id in the body: you can't create groups in someone else's name", async () => {
    const res = await create(alice, { ...newGroup, user_id: "01a1216e-ee83-7d76-bab2-000000000000" });
    expect(res.status).toBe(201);
    expect(res.body.user_id).toBe(aliceId);
  });

  it("requires a session (401)", async () => {
    const res = await request(app).post("/api/groups").set("Origin", ORIGIN).send(newGroup);
    expect(res.status).toBe(401);
  });

  it("requires a verified email (403)", async () => {
    const [unverified] = await signUp("new@example.com", false);
    const res = await create(unverified);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("email_not_verified");
  });

  it("validates with the shared rules (400), e.g. a link that doesn't match the platform", async () => {
    const res = await create(alice, { ...newGroup, meeting_link: "https://t.me/calc" });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe("meeting_link");
  });

  // Each of these used to get past validation: a too-long link then failed the database CHECK
  // (500 instead of 400), and any country or city was stored, unreachable by the filters.
  it.each([
    ["a link longer than the database allows", { meeting_link: `https://discord.gg/${"x".repeat(500)}` }, "meeting_link"],
    ["a country that isn't in the list", { country: "Atlantis" }, "country"],
    ["a city that isn't in the country", { city: "Berlin" }, "city"],
  ])("rejects %s with 400", async (_name, change, field) => {
    const res = await create(alice, { ...newGroup, ...change });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d: { path: string }) => d.path)).toContain(field);
  });
});

describe("PATCH /api/groups/:id", () => {
  let groupId: string;
  beforeEach(async () => {
    groupId = (await create(alice)).body.id;
  });

  it("lets the owner change title, description, topic, country and city", async () => {
    const res = await patch(alice, groupId, {
      title: "  Linear algebra ",
      description: "Vectors, matrices and coffee, every Sunday.",
      topic: "Science",
      country: "Germany",
      city: "Berlin",
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: "Linear algebra", topic: "Science", city: "Berlin" });
    expect(res.body.meeting_link).toBe(newGroup.meeting_link); // untouched
  });

  it.each([
    ["the meeting link", { meeting_link: "https://discord.gg/other" }],
    ["the platform", { platform: "telegram" }],
  ])("refuses to change %s (400) and keeps the group as it was", async (_name, body) => {
    const res = await patch(alice, groupId, body);
    expect(res.status).toBe(400);
    const group = await fetchGroup(groupId);
    expect(group.meeting_link).toBe(newGroup.meeting_link);
    expect(group.platform).toBe(newGroup.platform);
  });

  it("validates the changed values (400)", async () => {
    expect((await patch(alice, groupId, { title: "x".repeat(21) })).status).toBe(400);
    expect((await patch(alice, groupId, { topic: "Cooking" })).status).toBe(400);
    // The city is checked against the group's country after merging: Cairo isn't in Germany.
    expect((await patch(alice, groupId, { country: "Germany" })).status).toBe(400);
  });

  it("gives another user 404 (not 403) and changes nothing", async () => {
    const res = await patch(bob, groupId, { title: "Hijacked" });
    expect(res.status).toBe(404); // indistinguishable from a group that doesn't exist
    expect((await fetchGroup(groupId)).title).toBe(newGroup.title);
  });

  it("requires a session (401)", async () => {
    const res = await request(app).patch(`/api/groups/${groupId}`).set("Origin", ORIGIN).send({ title: "X" });
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/groups/:id", () => {
  let groupId: string;
  beforeEach(async () => {
    groupId = (await create(alice)).body.id;
  });

  it("gives another user 404 and the group survives", async () => {
    expect((await remove(bob, groupId)).status).toBe(404);
    expect((await request(app).get(`/api/groups/${groupId}`)).status).toBe(200);
  });

  it("lets the owner delete it; afterwards it's gone", async () => {
    expect((await remove(alice, groupId)).status).toBe(204);
    expect((await request(app).get(`/api/groups/${groupId}`)).status).toBe(404);
    expect((await remove(alice, groupId)).status).toBe(404); // deleting twice: nothing left
  });
});

describe("GET /api/users/me/groups", () => {
  it("lists only your own groups, newest first", async () => {
    await create(alice, { ...newGroup, title: "First" });
    await create(alice, { ...newGroup, title: "Second" });
    await create(bob, { ...newGroup, title: "Bob's" });

    const mine = myGroupsResponseSchema.parse((await alice.get("/api/users/me/groups")).body);
    expect(mine.items.map((g) => g.title)).toEqual(["Second", "First"]);
    expect(mine.items.every((g) => g.user_id === aliceId)).toBe(true);
  });

  it("requires a session (401)", async () => {
    expect((await request(app).get("/api/users/me/groups")).status).toBe(401);
  });
});
