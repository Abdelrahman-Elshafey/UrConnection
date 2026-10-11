import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import { runMigrations } from "../db/migrator";
import type { Database } from "../db/types";

/**
 * For *.db.test.ts files: a Kysely instance on the *_test database (TEST_DATABASE_URL,
 * set by vitest.db.config.ts), rebuilt from scratch by `reset()`.
 * Remember `await db.destroy()` in afterAll, or the test process won't exit.
 */
export function createTestDb() {
  const db = new Kysely<Database>({
    dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL }) }),
  });

  return {
    db,
    /** Undo every migration, re-apply them: an empty, up-to-date schema. */
    async reset() {
      const { error } = await runMigrations(db, "reset");
      if (error) throw error;
    },
    /** Empty all tables (fast), keeping the schema. */
    async truncate() {
      await sql`truncate table users cascade`.execute(db);
    },
  };
}
