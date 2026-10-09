import { sql, type Kysely } from "kysely";

/**
 * Migration 0001: the initial schema.
 *
 * A migration is a numbered, permanent step in the database's history. Once it has
 * run anywhere, NEVER edit it: write a new migration (0002, ...) instead. That way
 * every database (your laptop, CI, production) can replay the exact same steps.
 *
 * Lists like topics and platforms are written out literally here (not imported from
 * @urconnections/shared) for the same reason: a migration is a frozen snapshot.
 * The db tests check that the shared lists and these CHECK constraints still agree.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  // citext = case-insensitive text: 'Alice@Example.com' and 'alice@example.com'
  // count as the same email for the UNIQUE constraint and for lookups.
  await sql`create extension if not exists citext`.execute(db);

  // Keeps updated_at current automatically: a trigger calls this before every UPDATE.
  await sql`
    create function set_updated_at() returns trigger
    language plpgsql as $$
    begin
      new.updated_at = now();
      return new;
    end;
    $$
  `.execute(db);

  // ── users ────────────────────────────────────────────────────────────────
  // uuidv7() (new in Postgres 18): unique ids that start with a timestamp, so they
  // sort by creation time. Index-friendly, and safe to show in URLs (not guessable
  // counters like 1, 2, 3).
  await sql`
    create table users (
      id                uuid primary key default uuidv7(),
      email             citext not null unique,
      password_hash     text,                 -- null for Google-only accounts
      email_verified_at timestamptz,          -- null until the email link is clicked (Stage 8)
      display_name      text not null default '' check (char_length(display_name) <= 100),
      phone             text not null default '' check (char_length(phone) <= 30),
      country           text not null default '',
      city              text not null default '',
      avatar_key        text,                 -- storage key of the avatar (Stage 10)
      created_at        timestamptz not null default now(),
      updated_at        timestamptz not null default now(),
      check (email ~ '^[^@\\s]+@[^@\\s]+$')   -- minimal sanity check; real validation is zod
    )
  `.execute(db);
  await sql`create trigger users_set_updated_at before update on users
            for each row execute function set_updated_at()`.execute(db);

  // ── oauth_accounts: "this Google account belongs to that user" (Stage 9) ──
  await sql`
    create table oauth_accounts (
      provider         text not null check (provider in ('google')),
      provider_user_id text not null,
      user_id          uuid not null references users (id) on delete cascade,
      created_at       timestamptz not null default now(),
      primary key (provider, provider_user_id)
    )
  `.execute(db);
  await sql`create index oauth_accounts_user_id_idx on oauth_accounts (user_id)`.execute(db);

  // ── sessions (Stage 6) ───────────────────────────────────────────────────
  // SECURITY: we store sha256(token), never the token itself. The cookie holds the
  // token; if the database ever leaks, the hashes can't be used to log in.
  await sql`
    create table sessions (
      id_hash      text primary key check (id_hash ~ '^[0-9a-f]{64}$'),
      user_id      uuid not null references users (id) on delete cascade,
      expires_at   timestamptz not null,
      created_at   timestamptz not null default now(),
      last_seen_at timestamptz not null default now(),
      user_agent   text not null default '' check (char_length(user_agent) <= 500),
      ip           inet
    )
  `.execute(db);
  await sql`create index sessions_user_id_idx on sessions (user_id)`.execute(db);
  await sql`create index sessions_expires_at_idx on sessions (expires_at)`.execute(db); // cleanup job

  // ── email_tokens: one-time links for "verify email" / "reset password" (Stage 8)
  await sql`
    create table email_tokens (
      token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
      user_id    uuid not null references users (id) on delete cascade,
      purpose    text not null check (purpose in ('verify', 'reset')),
      expires_at timestamptz not null,
      used_at    timestamptz,               -- set when used: a token works only once
      created_at timestamptz not null default now()
    )
  `.execute(db);
  await sql`create index email_tokens_user_id_idx on email_tokens (user_id)`.execute(db);

  // ── groups ───────────────────────────────────────────────────────────────
  // "on delete cascade": deleting a user also deletes their groups.
  await sql`
    create table groups (
      id           uuid primary key default uuidv7(),
      user_id      uuid not null references users (id) on delete cascade,
      title        text not null check (char_length(title) between 1 and 20),
      description  text not null check (char_length(description) between 20 and 200),
      topic        text not null check (topic in (
                     'Programming', 'Language', 'Math', 'Science', 'Design', 'Business', 'Art')),
      platform     text not null check (platform in (
                     'whatsapp', 'telegram', 'discord', 'zoom', 'google_meet', 'facebook', 'messenger',
                     'instagram', 'reddit', 'slack', 'teams', 'skype', 'signal', 'linkedin', 'meetup',
                     'twitter', 'tiktok', 'youtube', 'twitch', 'snapchat', 'pinterest', 'threads')),
      meeting_link text not null check (meeting_link ~* '^https?://[^[:space:]]+$' and char_length(meeting_link) <= 500),
      country      text not null check (country <> ''),
      city         text not null check (city <> ''),
      created_at   timestamptz not null default now()
    )
  `.execute(db);
  // Indexes = lookup tables that make these filters fast once there are many rows.
  await sql`create index groups_user_id_idx on groups (user_id)`.execute(db);
  await sql`create index groups_country_city_idx on groups (country, city)`.execute(db);
  await sql`create index groups_topic_idx on groups (topic)`.execute(db);
  await sql`create index groups_platform_idx on groups (platform)`.execute(db);
}

/** Undo everything above, in reverse order (tables that reference others go first). */
export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`drop table if exists groups`.execute(db);
  await sql`drop table if exists email_tokens`.execute(db);
  await sql`drop table if exists sessions`.execute(db);
  await sql`drop table if exists oauth_accounts`.execute(db);
  await sql`drop table if exists users`.execute(db);
  await sql`drop function if exists set_updated_at`.execute(db);
  // The citext extension is left installed: other database objects might use it.
}
