import { groupListResponseSchema, type GroupListParams } from "@urconnections/shared";
import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app";
import { runMigrations } from "../../db/migrator";
import type { Database, NewGroupRow } from "../../db/types";
import { fakeDeps } from "../../test/fakes";
import { createGroupsRepository } from "./groups.repository";

/**
 * Real HTTP request → real router → real repository → real Postgres.
 * Proves the filters, search and pagination SQL, which the fake-based tests can't.
 */
const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
const db = new Kysely<Database>({ dialect: new PostgresDialect({ pool }) });
const app = createApp(fakeDeps({ groups: createGroupsRepository(db) }));

/** Calls the API and checks the response really matches the shared contract. */
async function list(params: GroupListParams = {}) {
  const res = await request(app).get("/api/groups").query(params);
  expect(res.status).toBe(200);
  return groupListResponseSchema.parse(res.body);
}

const base: Omit<NewGroupRow, "user_id"> = {
  title: "Study group",
  description: "A friendly group to learn together every week.",
  topic: "Math",
  platform: "discord",
  meeting_link: "https://discord.gg/abc",
  country: "Egypt",
  city: "Cairo",
};

beforeAll(async () => {
  const { error } = await runMigrations(db, "reset");
  if (error) throw error;
  await sql`truncate table users cascade`.execute(db);
  const { id: user_id } = await db.insertInto("users").values({ email: "owner@example.com", password_hash: null }).returning("id").executeTakeFirstOrThrow();

  // 12 groups inserted one by one, so their uuidv7 ids (and created_at) are in insertion order.
  const rows: Omit<NewGroupRow, "user_id">[] = [
    { ...base, title: "Calculus I", topic: "Math" },
    { ...base, title: "Linear algebra", topic: "Math", city: "Alexandria" },
    { ...base, title: "Rust learners", topic: "Programming", platform: "telegram", meeting_link: "https://t.me/rust" },
    { ...base, title: "Spanish chat", topic: "Language", country: "Germany", city: "Berlin" },
    { ...base, title: "50% off club", topic: "Business", description: "We study discounts: 50% off is our motto here." },
    { ...base, title: "Under_score", topic: "Art", description: "Snake_case lovers meet here to draw and paint." },
    ...Array.from({ length: 6 }, (_, i) => ({ ...base, title: `Physics ${i}`, topic: "Science" as const })),
  ];
  for (const row of rows) await db.insertInto("groups").values({ ...row, user_id }).execute();
});

afterAll(async () => {
  await db.destroy();
});

describe("filters", () => {
  it("returns everything, newest first", async () => {
    const { items } = await list();
    expect(items).toHaveLength(12);
    expect(items[0]!.title).toBe("Physics 5"); // inserted last
    expect(items.at(-1)!.title).toBe("Calculus I"); // inserted first
  });

  it.each<[string, GroupListParams, string[]]>([
    ["topic", { topic: "Math" }, ["Linear algebra", "Calculus I"]],
    ["platform", { platform: "telegram" }, ["Rust learners"]],
    ["country", { country: "Germany" }, ["Spanish chat"]],
    ["country + city", { country: "Egypt", city: "Alexandria" }, ["Linear algebra"]],
    ["topic + city (no match)", { topic: "Art", city: "Berlin" }, []],
  ])("by %s", async (_name, params, expectedTitles) => {
    const { items } = await list(params);
    expect(items.map((g) => g.title)).toEqual(expectedTitles);
  });
});

describe("search", () => {
  it("matches title or description, case-insensitively", async () => {
    expect((await list({ query: "rust" })).items.map((g) => g.title)).toEqual(["Rust learners"]);
    expect((await list({ query: "MOTTO" })).items.map((g) => g.title)).toEqual(["50% off club"]);
  });

  it("treats % and _ as normal characters, not wildcards", async () => {
    // Unescaped, "%" would match every row and "_" any single character.
    expect((await list({ query: "%" })).items.map((g) => g.title)).toEqual(["50% off club"]);
    expect((await list({ query: "_" })).items.map((g) => g.title)).toEqual(["Under_score"]);
  });
});

describe("cursor pagination", () => {
  it("walks through every group exactly once", async () => {
    const seen: string[] = [];
    let cursor: string | undefined;
    let pages = 0;
    do {
      const page = await list({ limit: 5, ...(cursor ? { cursor } : {}) });
      seen.push(...page.items.map((g) => g.id));
      cursor = page.nextCursor ?? undefined;
      pages++;
    } while (cursor);

    expect(pages).toBe(3); // 5 + 5 + 2
    expect(seen).toHaveLength(12);
    expect(new Set(seen).size).toBe(12); // no duplicates
  });

  it("returns nextCursor: null when the page is the last one", async () => {
    const page = await list({ topic: "Math", limit: 2 });
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBeNull(); // exactly 2 Math groups: no third page
  });

  it("combines filters with the cursor", async () => {
    const first = await list({ topic: "Science", limit: 4 });
    const second = await list({ topic: "Science", limit: 4, cursor: first.nextCursor! });
    expect([...first.items, ...second.items].map((g) => g.title)).toEqual([
      "Physics 5", "Physics 4", "Physics 3", "Physics 2", "Physics 1", "Physics 0",
    ]);
    expect(second.nextCursor).toBeNull();
  });
});

describe("GET /api/groups/:id", () => {
  it("returns one group with an ISO timestamp", async () => {
    const [first] = (await list({ limit: 1 })).items;
    const res = await request(app).get(`/api/groups/${first!.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(first!.id);
    expect(res.body.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns 404 for a well-formed id that doesn't exist", async () => {
    const res = await request(app).get("/api/groups/01a1216e-ee83-7d76-bab2-000000000000");
    expect(res.status).toBe(404);
  });
});
