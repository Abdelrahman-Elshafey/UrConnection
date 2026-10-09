import { PLATFORM_KEYS, TOPICS } from "@urconnections/shared";
import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { runMigrations } from "./migrator";
import type { Database, NewGroupRow } from "./types";

/**
 * Database tests: real Postgres (the *_test database), real migrations, real constraints.
 * Run with `npm run test:db` (needs `npm run db:up`). CI runs them against a Postgres service.
 */
const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
const db = new Kysely<Database>({ dialect: new PostgresDialect({ pool }) });

/** Postgres error codes (SQLSTATE) we expect constraints to raise. */
const PG = { CHECK: "23514", UNIQUE: "23505" } as const;

/** Expects `promise` to fail with Postgres error `code`. */
async function expectPgError(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toMatchObject({ code });
}

const validGroup = (userId: string): NewGroupRow => ({
  user_id: userId,
  title: "Calc club",
  description: "A friendly group to study calculus together.",
  topic: "Math",
  platform: "discord",
  meeting_link: "https://discord.gg/abc",
  country: "Egypt",
  city: "Cairo",
});

let userId: string;

beforeAll(async () => {
  // From scratch every run: undo all migrations, then apply them again.
  const { error } = await runMigrations(db, "reset");
  if (error) throw error;
});

beforeEach(async () => {
  await sql`truncate table users cascade`.execute(db);
  const user = await db.insertInto("users").values({ email: "test@example.com", password_hash: null }).returning("id").executeTakeFirstOrThrow();
  userId = user.id;
});

afterAll(async () => {
  await db.destroy();
});

describe("migrations", () => {
  it("can roll back and re-apply cleanly", async () => {
    expect((await runMigrations(db, "down")).error).toBeUndefined();
    expect((await runMigrations(db, "latest")).error).toBeUndefined();
  });
});

describe("shared lists and database CHECK constraints agree", () => {
  // If someone adds a topic/platform in @urconnections/shared without a new migration,
  // these fail: the form would accept a value the database rejects.
  it.each(TOPICS)("accepts topic %s", async (topic) => {
    await db.insertInto("groups").values({ ...validGroup(userId), topic }).execute();
  });

  it.each(PLATFORM_KEYS)("accepts platform %s", async (platform) => {
    await db.insertInto("groups").values({ ...validGroup(userId), platform }).execute();
  });
});

describe("groups constraints reject bad data", () => {
  // `as never`: deliberately bypass TypeScript to send values only the database can stop.
  const cases: [string, Partial<NewGroupRow>][] = [
    ["unknown topic", { topic: "Cooking" as never }],
    ["unknown platform", { platform: "myspace" as never }],
    ["title over 20 chars", { title: "x".repeat(21) }],
    ["empty title", { title: "" }],
    ["description under 20 chars", { description: "too short" }],
    ["description over 200 chars", { description: "x".repeat(201) }],
    ["javascript: link", { meeting_link: "javascript:alert(1)" }],
    ["link with spaces", { meeting_link: "https://discord.gg/a b" }],
    ["empty city", { city: "" }],
  ];

  it.each(cases)("rejects %s", async (_name, override) => {
    await expectPgError(db.insertInto("groups").values({ ...validGroup(userId), ...override }).execute(), PG.CHECK);
  });
});

describe("users", () => {
  it("treats emails case-insensitively (citext)", async () => {
    await expectPgError(
      db.insertInto("users").values({ email: "TEST@Example.com", password_hash: null }).execute(),
      PG.UNIQUE,
    );
  });

  it("generates time-ordered uuidv7 ids", async () => {
    const second = await db.insertInto("users").values({ email: "second@example.com", password_hash: null }).returning("id").executeTakeFirstOrThrow();
    expect(second.id > userId).toBe(true); // later id sorts after the earlier one
    expect(second.id[14]).toBe("7"); // version digit of a v7 UUID
  });

  it("updates updated_at automatically (trigger)", async () => {
    const before = await db.selectFrom("users").select("updated_at").where("id", "=", userId).executeTakeFirstOrThrow();
    await db.updateTable("users").set({ display_name: "Renamed" }).where("id", "=", userId).execute();
    const after = await db.selectFrom("users").select("updated_at").where("id", "=", userId).executeTakeFirstOrThrow();
    expect(after.updated_at.getTime()).toBeGreaterThan(before.updated_at.getTime());
  });

  it("deletes a user's groups together with the user (on delete cascade)", async () => {
    await db.insertInto("groups").values(validGroup(userId)).execute();
    await db.deleteFrom("users").where("id", "=", userId).execute();
    const left = await db.selectFrom("groups").select("id").execute();
    expect(left).toHaveLength(0);
  });
});

describe("sessions", () => {
  it("only stores 64-char hex hashes, never raw tokens", async () => {
    const expires_at = new Date(Date.now() + 60_000);
    await expectPgError(
      db.insertInto("sessions").values({ id_hash: "raw-token-oops", user_id: userId, expires_at }).execute(),
      PG.CHECK,
    );
    await db.insertInto("sessions").values({ id_hash: "a".repeat(64), user_id: userId, expires_at }).execute();
  });
});
