import type { ColumnType, Generated, Insertable, Selectable, Updateable } from "kysely";
import type { PlatformKey, Topic } from "@urconnections/shared";

/**
 * TypeScript description of the database, hand-written to match the migrations.
 * Kysely uses it to type-check every query: a misspelled column or a wrong value
 * type is a compile error. The db tests insert and read every table, so drift
 * between this file and the SQL shows up as a failing test.
 *
 * Helper types:
 *   Generated<T>         the database fills it in (default / trigger); optional on insert
 *   ColumnType<S, I, U>  different types for Select / Insert / Update
 *   Timestamp            read as Date; written as Date or ISO string; DB default if omitted
 *                        (the `undefined` in its insert type already makes it optional, so
 *                        never wrap it in Generated<>: Kysely doesn't unwrap nested ColumnTypes)
 */
type Timestamp = ColumnType<Date, Date | string | undefined, Date | string>;
type TimestampNullable = ColumnType<Date | null, Date | string | null | undefined, Date | string | null>;

export interface UsersTable {
  id: Generated<string>;
  email: string;
  password_hash: string | null;
  email_verified_at: TimestampNullable;
  display_name: Generated<string>;
  phone: Generated<string>;
  country: Generated<string>;
  city: Generated<string>;
  avatar_key: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface OauthAccountsTable {
  provider: "google";
  provider_user_id: string;
  user_id: string;
  created_at: Timestamp;
}

export interface SessionsTable {
  id_hash: string;
  user_id: string;
  expires_at: ColumnType<Date, Date | string, Date | string>;
  created_at: Timestamp;
  last_seen_at: Timestamp;
  user_agent: Generated<string>;
  ip: string | null;
}

export interface EmailTokensTable {
  token_hash: string;
  user_id: string;
  purpose: "verify" | "reset";
  expires_at: ColumnType<Date, Date | string, Date | string>;
  used_at: TimestampNullable;
  created_at: Timestamp;
}

export interface GroupsTable {
  id: Generated<string>;
  user_id: string;
  title: string;
  description: string;
  topic: Topic; // the CHECK constraint guarantees one of TOPICS
  platform: PlatformKey; // the CHECK constraint guarantees one of PLATFORM_KEYS
  meeting_link: string;
  country: string;
  city: string;
  created_at: Timestamp;
}

/** Table name → table type. `new Kysely<Database>()` reads this. */
export interface Database {
  users: UsersTable;
  oauth_accounts: OauthAccountsTable;
  sessions: SessionsTable;
  email_tokens: EmailTokensTable;
  groups: GroupsTable;
}

// Row shapes for each operation, e.g. NewGroup = what you pass to insertInto("groups").
export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;
export type GroupRow = Selectable<GroupsTable>;
export type NewGroupRow = Insertable<GroupsTable>;
