/**
 * Group categories. Single source of truth for the create form, the filter
 * bar, and (later) API validation and the database CHECK constraint.
 *
 * `as const` makes this a readonly tuple of literal strings instead of string[],
 * so TypeScript knows the exact allowed values.
 */
export const TOPICS = [
  "Programming",
  "Language",
  "Math",
  "Science",
  "Design",
  "Business",
  "Art",
] as const;

/** "Programming" | "Language" | ... derived from the array above. */
export type Topic = (typeof TOPICS)[number];
