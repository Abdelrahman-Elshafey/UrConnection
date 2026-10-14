/**
 * CLI: npm run db:seed   (development only)
 * Wipes the tables and fills them with predictable demo data: 3 users and 60 groups
 * spread over every topic, many platforms and several countries. Same data every run.
 */
import {
  PLATFORMS,
  TOPICS,
  createGroupSchema,
  isCountry,
  type CreateGroupInput,
} from "@urconnections/shared";
import { getCities } from "@urconnections/shared/cities";
import { sql } from "kysely";
import { isProduction } from "../config";
import { exitWithDatabaseError } from "./connectionHelp";
import { db } from "./db";
import { hashPassword } from "../modules/auth/passwords";
import type { NewGroupRow, NewUser } from "./types";

// SECURITY / safety: the seed deletes everything first.
if (isProduction) {
  console.error("Refusing to seed a production database.");
  process.exit(1);
}

const USERS: NewUser[] = [
  // All demo users share DEMO_PASSWORD (hashed below). Development data only.
  {
    email: "alice@example.com",
    password_hash: "", // set below
    display_name: "Alice",
    country: "Egypt",
    city: "Cairo",
  },
  {
    email: "bob@example.com",
    password_hash: "", // set below
    display_name: "Bob",
    country: "Germany",
    city: "Berlin",
  },
  {
    email: "carol@example.com",
    password_hash: "", // set below
    display_name: "Carol",
    country: "Brazil",
    city: "São Paulo",
  },
];

/** Development-only password for every demo user (meets the password policy). */
const DEMO_PASSWORD = "Demo123!pass";
const demoHash = await hashPassword(DEMO_PASSWORD);
// Demo users are verified, so they can create groups straight away.
for (const user of USERS) {
  user.password_hash = demoHash;
  user.email_verified_at = new Date();
}

const COUNTRIES = [
  "Egypt",
  "Germany",
  "Brazil",
  "United States",
  "India",
  "Japan",
  "Morocco",
  "United Kingdom",
];
const TITLES = [
  "Study Squad",
  "Night Owls",
  "Weekend Crew",
  "Practice Club",
  "Deep Dive",
  "Beginners Hub",
  "Peer Review",
];
const GROUP_COUNT = 200;

/** Builds group number `i`. Uses modulo so every topic and platform shows up, in a fixed order. */
function makeGroup(i: number): CreateGroupInput {
  const topic = TOPICS[i % TOPICS.length]!; // `!`: i % length is always a valid index
  const platform = PLATFORMS[i % PLATFORMS.length]!;
  const country = COUNTRIES[i % COUNTRIES.length]!;
  if (!isCountry(country))
    throw new Error(
      `Seed country "${country}" is not in the shared country list`,
    );
  const cities = getCities(country);
  const city = cities[i % Math.min(3, cities.length)]!; // the first 3 cities of each country

  return {
    topic,
    platform: platform.key,
    title: TITLES[i % TITLES.length]!,
    // Placeholders look like "https://t.me/...": swap "..." for a fake invite code.
    meeting_link: platform.placeholder.replace("...", `seed-${i}`),
    country,
    city,
    description: `A friendly ${topic.toLowerCase()} group in ${city}. We meet every week on ${platform.label} to learn together and help each other.`,
  };
}

// Validate every group with the SAME schema the web form and (later) the API use.
// If shared rules and database rules ever disagree, seeding fails loudly here.
const groups = Array.from({ length: GROUP_COUNT }, (_, i) =>
  createGroupSchema.parse(makeGroup(i)),
);

try {
  // A transaction: either everything below happens, or nothing does.
  await db.transaction().execute(async (trx) => {
    // Removes all rows; "cascade" also empties tables that reference users (groups, sessions, ...).
    await sql`truncate table users cascade`.execute(trx);

    const users = await trx
      .insertInto("users")
      .values(USERS)
      .returning(["id", "email"])
      .execute();

    const rows: NewGroupRow[] = groups.map((g, i) => ({
      ...g,
      user_id: users[i % users.length]!.id,
    }));
    await trx.insertInto("groups").values(rows).execute();
  });

  // count(*) comes back as a string: Postgres bigint can exceed JavaScript's safe number range.
  const countRows = (table: "users" | "groups") =>
    db
      .selectFrom(table)
      .select((eb) => eb.fn.countAll<string>().as("count"))
      .executeTakeFirstOrThrow();

  const [users, groupsInDb] = await Promise.all([
    countRows("users"),
    countRows("groups"),
  ]);
  console.log(`✔ Seeded ${users.count} users and ${groupsInDb.count} groups.`);
  console.log(`  Sign in as ${USERS.map((u) => u.email).join(", ")} with password: ${DEMO_PASSWORD}`);

} catch (err) {
  // Unreachable database, wrong password, missing tables: explain in plain words.
  await db.destroy();
  exitWithDatabaseError("Seeding failed.", err);
}

await db.destroy();
