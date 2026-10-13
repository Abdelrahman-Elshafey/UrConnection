import type { Group, User } from "@urconnections/shared";

/** "Cairo, Egypt", or "" when neither is set (audit D13). */
export const formatLocation = ({ city, country }: { city: string; country: string }): string =>
  [city, country].filter(Boolean).join(", ");

/**
 * Does `user` own `group`? Only decides what to *show* (Edit/Delete buttons); the API
 * refuses edits and deletes from anyone else no matter what the page shows.
 */
export const isOwner = (user: User | null | undefined, group: Pick<Group, "user_id">): boolean =>
  !!user && user.id === group.user_id;

/** The letter shown when a user has no picture. */
export const initialOf = (user: Pick<User, "display_name" | "email">): string =>
  (user.display_name || user.email || "?").charAt(0).toUpperCase();
