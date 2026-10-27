import { z } from "../zod";
import { TOPICS } from "../topics";
import { PLATFORM_KEYS, PLATFORM_MAP } from "../platforms";
import { isCountry } from "../countryNames";

/**
 * The fields a user fills in to create a group. Kept as a plain object
 * (no refinements) so it can be extended for the stored row below.
 * Limits match the database CHECK constraints (api/src/db/migrations/0001_initial_schema.ts).
 */
const groupFields = z.object({
  topic: z.enum(TOPICS, { error: "Interest is required" }),
  title: z.string().trim().min(1, "Title is required").max(20, "Title is too long (max 20 characters)"),
  platform: z.enum(PLATFORM_KEYS, { error: "Platform is required" }),
  // protocol: only http(s) links. z.url() alone would also accept javascript:, data:, ...
  // max(500): the database allows 500 characters; a longer link would fail there with a 500.
  meeting_link: z
    .url({ protocol: /^https?$/, error: "Please enter a valid http(s) URL" })
    .max(500, "Link is too long (max 500 characters)"),
  // Only countries the filters offer: a group in "Egyptt" could never be found.
  // (Whether the city belongs to the country is checked by the API, which has the city
  // lists at hand; the web loads them only on demand, see cities.ts.)
  country: z.string().min(1, "Country is required").refine(isCountry, "Please choose a country from the list"),
  city: z.string().min(1, "City is required").max(100, "City name is too long"),
  description: z
    .string()
    .trim()
    .min(20, "Description is too short (min 20 characters)")
    .max(200, "Description is too long (max 200 characters)"),
});

/** Validates the create/edit group form and the POST /api/groups body. */
export const createGroupSchema = groupFields.refine(
  (data) => PLATFORM_MAP[data.platform].linkPattern.test(data.meeting_link),
  { message: "Link does not match the selected platform", path: ["meeting_link"] },
);

/** Fields the owner may change after creating a group. */
export const EDITABLE_GROUP_FIELDS = ["title", "description", "topic", "country", "city"] as const;

/**
 * PATCH /api/groups/:id: send only the fields that change (any of EDITABLE_GROUP_FIELDS).
 * The meeting link is fixed once the group exists, and so is the platform, because the
 * platform is determined by the link (a WhatsApp link only fits "whatsapp").
 * `.strict()`: sending meeting_link or platform is a 400 error, not silently ignored,
 * so a client finds out immediately that it can't change them.
 */
export const updateGroupSchema = groupFields
  .pick({ title: true, description: true, topic: true, country: true, city: true })
  .partial()
  .strict();

/** A stored group, as returned by GET /api/groups and GET /api/groups/:id. */
export const groupSchema = groupFields.extend({
  // Stored rows are read back as plain text: one group saved before the country check
  // existed must not make the web reject a whole page of results.
  country: z.string(),
  city: z.string(),
  id: z.uuid(),
  user_id: z.uuid(),
  created_at: z.iso.datetime({ offset: true }), // JSON has no Date type: timestamps travel as ISO strings
});

/**
 * Query parameters of GET /api/groups. Everything is optional; omitted = no filter.
 * Query strings are always text, so `limit` is coerced from "24" to 24.
 */
export const groupListQuerySchema = z.object({
  query: z.string().trim().max(100).optional(), // searched in title and description
  topic: z.enum(TOPICS).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  platform: z.enum(PLATFORM_KEYS).optional(),
  cursor: z.uuid().optional(), // id of the last group of the previous page
  limit: z.coerce.number().int().min(1).max(50).default(24),
});

/** One page of groups. `nextCursor` is null on the last page. */
export const groupListResponseSchema = z.object({
  items: z.array(groupSchema),
  nextCursor: z.uuid().nullable(),
});

/** GET /api/users/me/groups: every group the signed-in user owns, newest first. */
export const myGroupsResponseSchema = z.object({ items: z.array(groupSchema) });

// z.infer turns a schema into a TypeScript type, so the type can never drift from the validation.
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type Group = z.infer<typeof groupSchema>;
/** Parsed query (limit always set). */
export type GroupListQuery = z.infer<typeof groupListQuerySchema>;
/**
 * Query as a client sends it: every field optional, limit a plain number.
 * (Not z.input<>: with z.coerce, zod types the input as `unknown`, since coercion accepts anything.)
 */
export type GroupListParams = Partial<Omit<GroupListQuery, "limit">> & { limit?: number };
/** Just the filters (no paging): what the home page's filter bar controls and caches by. */
export type GroupFilters = Omit<GroupListParams, "cursor" | "limit">;
export type GroupListResponse = z.infer<typeof groupListResponseSchema>;
export type MyGroupsResponse = z.infer<typeof myGroupsResponseSchema>;
