import type { ProfileUpdate, User } from "@urconnections/shared";
import { sql, type Kysely, type Selectable } from "kysely";
import type { Database, UsersTable } from "../../db/types";
import { mediaUrl } from "../../lib/storage";

/** Postgres SQLSTATE for "unique constraint violated" (here: email already used). */
const UNIQUE_VIOLATION = "23505";

export class EmailTakenError extends Error {
  constructor() {
    super("email taken");
    this.name = "EmailTakenError";
  }
}

export interface NewUserInput {
  email: string;
  password_hash: string;
  display_name: string;
  phone: string;
  country: string;
  city: string;
}

export interface UsersRepository {
  /** Includes password_hash: only for the login check, never send this to a client. */
  findForLogin(email: string): Promise<(User & { password_hash: string | null }) | undefined>;
  /** Throws EmailTakenError if the email exists (case-insensitive, thanks to citext). */
  create(input: NewUserInput): Promise<User>;
  updateProfile(id: string, patch: ProfileUpdate): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  /** Sets email_verified_at (once; later calls keep the first timestamp). */
  markEmailVerified(id: string): Promise<User | undefined>;
  setPasswordHash(id: string, passwordHash: string): Promise<void>;
  /**
   * Points the user at a new avatar object (or none: null) and returns the key it replaced,
   * so the caller can delete that object. undefined if the user doesn't exist.
   */
  setAvatarKey(id: string, key: string | null): Promise<{ user: User; previousKey: string | null } | undefined>;
}

// SECURITY: password_hash is deliberately not in this list, so it can't end up in a response.
export const USER_COLUMNS = [
  "id",
  "email",
  "display_name",
  "phone",
  "country",
  "city",
  "avatar_key",
  "email_verified_at",
  "created_at",
] as const;

/** The same columns as "users.id", ... for queries that join users with another table. */
export const QUALIFIED_USER_COLUMNS = USER_COLUMNS.map((c) => `users.${c}` as const);

export type UserRow = Pick<Selectable<UsersTable>, (typeof USER_COLUMNS)[number]>;

/** Database row → API shape (the shared User type). */
export function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    phone: row.phone,
    country: row.country,
    city: row.city,
    avatar_url: row.avatar_key ? mediaUrl(row.avatar_key) : null, // the DB stores the key; clients get a URL
    email_verified: row.email_verified_at !== null,
    created_at: row.created_at.toISOString(),
  };
}

export function createUsersRepository(db: Kysely<Database>): UsersRepository {
  return {
    async findForLogin(email) {
      const row = await db
        .selectFrom("users")
        .select([...USER_COLUMNS, "password_hash"])
        .where("email", "=", email) // citext column: case-insensitive comparison
        .executeTakeFirst();
      return row ? { ...toUser(row), password_hash: row.password_hash } : undefined;
    },

    async create(input) {
      try {
        const row = await db.insertInto("users").values(input).returning(USER_COLUMNS).executeTakeFirstOrThrow();
        return toUser(row);
      } catch (err) {
        if ((err as { code?: string }).code === UNIQUE_VIOLATION) throw new EmailTakenError();
        throw err;
      }
    },

    async findByEmail(email) {
      const row = await db.selectFrom("users").select(USER_COLUMNS).where("email", "=", email).executeTakeFirst();
      return row ? toUser(row) : undefined;
    },

    async markEmailVerified(id) {
      const row = await db
        .updateTable("users")
        // coalesce: keep the original verification time if it was already set
        .set((eb) => ({ email_verified_at: eb.fn.coalesce("email_verified_at", sql<Date>`now()`) }))
        .where("id", "=", id)
        .returning(USER_COLUMNS)
        .executeTakeFirst();
      return row ? toUser(row) : undefined;
    },

    async setPasswordHash(id, passwordHash) {
      await db.updateTable("users").set({ password_hash: passwordHash }).where("id", "=", id).execute();
    },

    async setAvatarKey(id, key) {
      return db.transaction().execute(async (trx) => {
        // FOR UPDATE locks this user's row until the transaction ends, so two uploads at the
        // same moment queue up: each sees the key the other wrote, and no object is forgotten.
        const current = await trx.selectFrom("users").select("avatar_key").where("id", "=", id).forUpdate().executeTakeFirst();
        if (!current) return undefined;
        const row = await trx
          .updateTable("users")
          .set({ avatar_key: key })
          .where("id", "=", id)
          .returning(USER_COLUMNS)
          .executeTakeFirstOrThrow();
        return { user: toUser(row), previousKey: current.avatar_key };
      });
    },

    async updateProfile(id, patch) {
      // Nothing to change: just return the current row (an UPDATE with no columns is invalid SQL).
      const row =
        Object.keys(patch).length === 0
          ? await db.selectFrom("users").select(USER_COLUMNS).where("id", "=", id).executeTakeFirst()
          : await db.updateTable("users").set(patch).where("id", "=", id).returning(USER_COLUMNS).executeTakeFirst();
      return row ? toUser(row) : undefined;
    },
  };
}
