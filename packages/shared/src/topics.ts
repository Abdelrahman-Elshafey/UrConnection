/**
 * Group categories. Single source of truth for the create form, the filter bar and API
 * validation. The database CHECK constraint repeats the list (migrations are frozen
 * snapshots); a db test checks the two still agree.
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

/** Type guard, like isCountry / isPlatformKey: after `isTopic(x)` is true, TS knows x is a Topic. */
export const isTopic = (value: string): value is Topic => (TOPICS as readonly string[]).includes(value);
