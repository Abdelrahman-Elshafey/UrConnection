import pg from "pg";
import { config } from "../config";
import { logger } from "../lib/logger";

/**
 * A pool keeps a few open connections to Postgres and lends them out per query,
 * because opening a new connection for every request would be slow.
 * db.ts wraps this pool with Kysely for typed queries.
 */
export const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: 10, // at most 10 connections at once
});

// When Postgres restarts (deploy, crash, Docker update), it closes the connections the pool
// keeps open. The pool reports that as an "error" event, and Node ends the whole process if
// an "error" event has no listener. The broken connection is already thrown away and the
// next query opens a new one, so logging is all that's needed.
pool.on("error", (err) => logger.warn({ err }, "idle database connection lost"));

/** Runs the cheapest possible query. Used by GET /api/health. */
export async function checkDatabase(): Promise<void> {
  await pool.query("select 1");
}
