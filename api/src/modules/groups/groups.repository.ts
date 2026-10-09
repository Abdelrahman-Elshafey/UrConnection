import type { Group, GroupListQuery, GroupListResponse } from "@urconnections/shared";
import type { Kysely, Selectable } from "kysely";
import type { Database, GroupsTable } from "../../db/types";

/**
 * Everything the API can ask about groups. Routes depend on this interface, not on
 * Kysely, so unit tests can pass a fake and only the db tests need Postgres.
 */
export interface GroupsRepository {
  list(query: GroupListQuery): Promise<GroupListResponse>;
  getById(id: string): Promise<Group | undefined>;
}

// Explicit column list (never `select *`): adding a private column later
// (e.g. moderation notes) can't leak into API responses by accident.
const COLUMNS = [
  "id",
  "user_id",
  "title",
  "description",
  "topic",
  "platform",
  "meeting_link",
  "country",
  "city",
  "created_at",
] as const;

type GroupRow = Pick<Selectable<GroupsTable>, (typeof COLUMNS)[number]>;

/** Database row → API shape. JSON has no Date type, so timestamps become ISO strings. */
const toGroup = (row: GroupRow): Group => ({ ...row, created_at: row.created_at.toISOString() });

/** In LIKE patterns, % and _ are wildcards: escape them so a search for "50%" means "50%". */
const escapeLike = (text: string) => text.replace(/[\\%_]/g, "\\$&");

export function createGroupsRepository(db: Kysely<Database>): GroupsRepository {
  return {
    async list({ query, topic, country, city, platform, cursor, limit }) {
      // Newest first. uuidv7 ids sort by creation time, so ordering by id is ordering by date.
      let q = db
        .selectFrom("groups")
        .select(COLUMNS)
        .orderBy("id", "desc")
        // One extra row tells us whether another page exists, without a separate count query.
        .limit(limit + 1);

      // Each filter is optional. Kysely turns values into SQL parameters ($1, $2, ...),
      // never into SQL text, so user input can't inject SQL.
      if (topic) q = q.where("topic", "=", topic);
      if (platform) q = q.where("platform", "=", platform);
      if (country) q = q.where("country", "=", country);
      if (city) q = q.where("city", "=", city);
      if (query) {
        const pattern = `%${escapeLike(query)}%`;
        q = q.where((eb) => eb.or([eb("title", "ilike", pattern), eb("description", "ilike", pattern)]));
      }
      // Cursor pagination: "the groups that come after the last one you've seen".
      // Unlike OFFSET, it stays fast on deep pages and never skips or repeats a row
      // when new groups are added between two requests.
      if (cursor) q = q.where("id", "<", cursor);

      const rows = await q.execute();
      const hasMore = rows.length > limit;
      const page = hasMore ? rows.slice(0, limit) : rows;

      return {
        items: page.map(toGroup),
        nextCursor: hasMore ? page[page.length - 1]!.id : null,
      };
    },

    async getById(id) {
      const row = await db.selectFrom("groups").select(COLUMNS).where("id", "=", id).executeTakeFirst();
      return row ? toGroup(row) : undefined;
    },
  };
}
