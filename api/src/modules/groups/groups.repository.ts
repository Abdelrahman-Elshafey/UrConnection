import type { CreateGroupInput, Group, GroupListQuery, GroupListResponse, UpdateGroupInput } from "@urconnections/shared";
import type { Kysely, Selectable } from "kysely";
import type { Database, GroupsTable } from "../../db/types";

/**
 * Everything the API can ask about groups. Routes depend on this interface, not on
 * Kysely, so unit tests can pass a fake and only the db tests need Postgres.
 */
export interface GroupsRepository {
  list(query: GroupListQuery): Promise<GroupListResponse>;
  getById(id: string): Promise<Group | undefined>;
  /** All groups owned by `userId`, newest first. */
  listByOwner(userId: string): Promise<Group[]>;
  create(userId: string, input: CreateGroupInput): Promise<Group>;
  /**
   * Ownership is part of every write query (`WHERE id = $1 AND user_id = $2`):
   * for someone else's group these find nothing and return undefined / false.
   */
  getOwned(id: string, userId: string): Promise<Group | undefined>;
  /** Only the editable fields: this method can't change meeting_link or platform at all. */
  updateOwned(id: string, userId: string, values: Required<UpdateGroupInput>): Promise<Group | undefined>;
  deleteOwned(id: string, userId: string): Promise<boolean>;
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

    async listByOwner(userId) {
      const rows = await db.selectFrom("groups").select(COLUMNS).where("user_id", "=", userId).orderBy("id", "desc").execute();
      return rows.map(toGroup);
    },

    async create(userId, input) {
      // SECURITY: list the columns explicitly; user_id comes from the session (the
      // caller), never from the request body.
      const row = await db
        .insertInto("groups")
        .values({
          user_id: userId,
          title: input.title,
          description: input.description,
          topic: input.topic,
          platform: input.platform,
          meeting_link: input.meeting_link,
          country: input.country,
          city: input.city,
        })
        .returning(COLUMNS)
        .executeTakeFirstOrThrow();
      return toGroup(row);
    },

    async getOwned(id, userId) {
      const row = await db
        .selectFrom("groups")
        .select(COLUMNS)
        .where("id", "=", id)
        .where("user_id", "=", userId)
        .executeTakeFirst();
      return row ? toGroup(row) : undefined;
    },

    async updateOwned(id, userId, values) {
      const row = await db
        .updateTable("groups")
        // SECURITY / rule: meeting_link and platform are deliberately absent. They're fixed
        // after creation, enforced here as well as in updateGroupSchema.
        .set({
          title: values.title,
          description: values.description,
          topic: values.topic,
          country: values.country,
          city: values.city,
        })
        .where("id", "=", id)
        .where("user_id", "=", userId) // SECURITY: only the owner's row can match
        .returning(COLUMNS)
        .executeTakeFirst();
      return row ? toGroup(row) : undefined;
    },

    async deleteOwned(id, userId) {
      const result = await db
        .deleteFrom("groups")
        .where("id", "=", id)
        .where("user_id", "=", userId) // SECURITY: only the owner's row can match
        .executeTakeFirst();
      return result.numDeletedRows > 0n; // bigint: Postgres row counts can be huge
    },
  };
}
