import { Kysely, PostgresDialect } from "kysely";
import { pool } from "./pool";
import type { Database } from "./types";

/**
 * The typed query builder used by all API code. It reuses the same connection pool
 * as the health check. Example:
 *   await db.selectFrom("groups").select(["id", "title"]).where("topic", "=", "Math").execute()
 */
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
});
