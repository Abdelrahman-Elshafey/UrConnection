import { z } from "zod";
import { TOPICS } from "../topics";
import { PLATFORM_KEYS, PLATFORM_MAP } from "../platforms";

/**
 * The fields a user fills in to create a group. Kept as a plain object
 * (no refinements) so it can be extended for the stored row below.
 * Limits match the database CHECK constraints (supabase/migrations, later api/ migrations).
 */
const groupFields = z.object({
  topic: z.enum(TOPICS, { error: "Interest is required" }),
  title: z.string().trim().min(1, "Title is required").max(20, "Title is too long (max 20 characters)"),
  platform: z.enum(PLATFORM_KEYS, { error: "Platform is required" }),
  // protocol: only http(s) links. z.url() alone would also accept javascript:, data:, ...
  meeting_link: z.url({ protocol: /^https?$/, error: "Please enter a valid http(s) URL" }),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  description: z
    .string()
    .trim()
    .min(20, "Description is too short (min 20 characters)")
    .max(200, "Description is too long (max 200 characters)"),
});

/** Validates the create-group form (and, from Stage 7, the POST /api/groups body). */
export const createGroupSchema = groupFields.refine(
  (data) => PLATFORM_MAP[data.platform].linkPattern.test(data.meeting_link),
  { message: "Link does not match the selected platform", path: ["meeting_link"] },
);

/** A stored group, as read from the database / API. */
export const groupSchema = groupFields.extend({
  id: z.string(),
  user_id: z.string(),
  date: z.string(),
});

// z.infer turns a schema into a TypeScript type, so the type can never drift from the validation.
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type Group = z.infer<typeof groupSchema>;
