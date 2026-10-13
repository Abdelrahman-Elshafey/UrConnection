import sharp from "sharp";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app";
import { fakeDeps, fakeStorage } from "../../test/fakes";
import { createTestDb } from "../../test/testDb";
import { createSessionsRepository } from "../auth/sessions.repository";
import { createUsersRepository } from "./users.repository";

/**
 * Avatar upload / replace / delete with real Postgres and real sharp; the S3 bucket is
 * an in-memory fake, so we can see exactly which objects exist after each step.
 */
const { db, reset, truncate } = createTestDb();
const ORIGIN = "http://localhost:5173";

let objects: ReturnType<typeof fakeStorage>["objects"];

function makeApp() {
  const fake = fakeStorage();
  objects = fake.objects;
  return createApp(fakeDeps({ users: createUsersRepository(db), sessions: createSessionsRepository(db), storage: fake.storage }));
}

type Agent = ReturnType<typeof request.agent>;

/** A signed-in browser. */
async function signedIn(): Promise<Agent> {
  const agent = request.agent(makeApp());
  await agent.post("/api/auth/register").set("Origin", ORIGIN).send({ email: "ana@example.com", password: "Str0ng!pass" });
  return agent;
}

const png = () => sharp({ create: { width: 900, height: 600, channels: 3, background: "#0071e3" } }).png().toBuffer();

/** A multipart upload, like a browser's <input type="file"> + FormData. */
const upload = async (agent: Agent, file: Buffer, filename = "me.png") =>
  agent.put("/api/users/me/avatar").set("Origin", ORIGIN).attach("avatar", file, filename);

const avatarKeyInDb = async () => (await db.selectFrom("users").select("avatar_key").executeTakeFirstOrThrow()).avatar_key;

beforeAll(reset);
beforeEach(truncate);
afterAll(() => db.destroy());

describe("PUT /api/users/me/avatar", () => {
  it("stores a 512×512 WebP with long cache headers and returns its URL", async () => {
    const agent = await signedIn();
    const res = await upload(agent, await png());

    expect(res.status).toBe(200);
    const key = await avatarKeyInDb();
    expect(key).toMatch(new RegExp(`^avatars/${res.body.user.id}/[0-9a-f-]{36}\\.webp$`));
    expect(res.body.user.avatar_url).toBe(`/media/${key}`);

    const stored = objects.get(key!)!;
    expect(stored).toMatchObject({ contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" });
    expect(await sharp(stored.body).metadata()).toMatchObject({ format: "webp", width: 512, height: 512 });
  });

  it("replacing the picture gives a new URL and deletes the old object", async () => {
    const agent = await signedIn();
    const first = (await upload(agent, await png())).body.user.avatar_url;
    const second = (await upload(agent, await png())).body.user.avatar_url;

    expect(second).not.toBe(first);
    expect([...objects.keys()]).toEqual([second.replace("/media/", "")]); // only the new one is left
  });

  it("refuses an SVG renamed to .png, and stores nothing", async () => {
    const agent = await signedIn();
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const res = await upload(agent, svg, "innocent.png");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_image");
    expect(objects.size).toBe(0);
    expect(await avatarKeyInDb()).toBeNull();
  });

  it("refuses an HTML page renamed to .png", async () => {
    const res = await upload(await signedIn(), Buffer.from("<!doctype html><script>alert(1)</script>"), "cat.png");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_image");
  });

  it("refuses files over 5 MB (413) before processing them", async () => {
    const res = await upload(await signedIn(), Buffer.alloc(5 * 1024 * 1024 + 1), "big.png");
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("file_too_large");
  });

  it("asks for a file when none is sent", async () => {
    const agent = await signedIn();
    const res = await agent.put("/api/users/me/avatar").set("Origin", ORIGIN).field("note", "no file");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_upload");
  });

  it("needs a signed-in user (401) and our own Origin (403)", async () => {
    const anonymous = request(makeApp()).put("/api/users/me/avatar").set("Origin", ORIGIN).attach("avatar", await png(), "a.png");
    expect((await anonymous).status).toBe(401);

    const agent = await signedIn();
    const crossSite = await agent.put("/api/users/me/avatar").set("Origin", "https://evil.example").attach("avatar", await png(), "a.png");
    expect(crossSite.status).toBe(403);
    expect(objects.size).toBe(0);
  });
});

describe("DELETE /api/users/me/avatar", () => {
  it("removes the picture and its object", async () => {
    const agent = await signedIn();
    await upload(agent, await png());

    const res = await agent.delete("/api/users/me/avatar").set("Origin", ORIGIN);
    expect(res.status).toBe(200);
    expect(res.body.user.avatar_url).toBeNull();
    expect(objects.size).toBe(0);
    expect(await avatarKeyInDb()).toBeNull();
  });

  it("is harmless without a picture", async () => {
    const res = await (await signedIn()).delete("/api/users/me/avatar").set("Origin", ORIGIN);
    expect(res.status).toBe(200);
    expect(res.body.user.avatar_url).toBeNull();
  });
});
