import pg from "pg";
import { config } from "../config";

/**
 * A pool keeps a few open connections to Postgres and lends them out per query,
 * because opening a new connection for every request would be slow.
 * Stage 4 wraps this pool with Kysely for typed queries.
 */
export const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: 10, // at most 10 connections at once
});

/** Runs the cheapest possible query. Used by GET /api/health. */
export async function checkDatabase(): Promise<void> {
  await pool.query("select 1");
}
