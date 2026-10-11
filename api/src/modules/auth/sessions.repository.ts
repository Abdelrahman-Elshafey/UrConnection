import type { User } from "@urconnections/shared";
import { sql, type Kysely } from "kysely";
import type { Database } from "../../db/types";
import { QUALIFIED_USER_COLUMNS, toUser } from "../users/users.repository";

export interface NewSession {
  idHash: string; // sha256 of the cookie token, never the token itself
  userId: string;
  expiresAt: Date;
  userAgent: string;
  ip: string | null;
}

export interface SessionsRepository {
  create(session: NewSession): Promise<void>;
  /** The session's user and expiry, if the session exists and hasn't expired. */
  findValid(idHash: string): Promise<{ user: User; expiresAt: Date } | undefined>;
  /** Sliding expiry: push expires_at forward and record activity. */
  extend(idHash: string, expiresAt: Date): Promise<void>;
  delete(idHash: string): Promise<void>;
  /** Housekeeping: remove sessions that have expired. Returns how many were removed. */
  deleteExpired(): Promise<number>;
}

export function createSessionsRepository(db: Kysely<Database>): SessionsRepository {
  return {
    async create({ idHash, userId, expiresAt, userAgent, ip }) {
      await db
        .insertInto("sessions")
        .values({
          id_hash: idHash,
          user_id: userId,
          expires_at: expiresAt,
          user_agent: userAgent.slice(0, 500), // matches the column's CHECK
          ip,
        })
        .execute();
    },

    async findValid(idHash) {
      // One query: the session joined with its user. "expires_at > now()" is checked
      // by the database clock, so a wrong clock on the API server can't extend sessions.
      const row = await db
        .selectFrom("sessions")
        .innerJoin("users", "users.id", "sessions.user_id")
        .select([...QUALIFIED_USER_COLUMNS, "sessions.expires_at"])
        .where("sessions.id_hash", "=", idHash)
        .where("sessions.expires_at", ">", sql<Date>`now()`)
        .executeTakeFirst();
      if (!row) return undefined;
      const { expires_at, ...user } = row;
      return { user: toUser(user), expiresAt: expires_at };
    },

    async extend(idHash, expiresAt) {
      await db
        .updateTable("sessions")
        .set({ expires_at: expiresAt, last_seen_at: new Date() })
        .where("id_hash", "=", idHash)
        .execute();
    },

    async delete(idHash) {
      await db.deleteFrom("sessions").where("id_hash", "=", idHash).execute();
    },

    async deleteExpired() {
      const result = await db.deleteFrom("sessions").where("expires_at", "<=", sql<Date>`now()`).executeTakeFirst();
      return Number(result.numDeletedRows);
    },
  };
}
