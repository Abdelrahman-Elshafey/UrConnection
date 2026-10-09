import type { GroupListParams } from "@urconnections/shared";

// Query-key factory (audit D7): every React Query key for groups is built here,
// so hooks and invalidations can never disagree on spelling.
// Keys are nested arrays: invalidating `groupKeys.all` refreshes everything below it.

export const groupKeys = {
  all: ["groups"] as const,
  lists: () => [...groupKeys.all, "list"] as const,
  // The filters are part of the key: each combination is cached separately, so going
  // back to a previous filter shows its results instantly.
  list: (filters: Omit<GroupListParams, "cursor" | "limit">) => [...groupKeys.lists(), filters] as const,
  byUserRoot: () => [...groupKeys.all, "user"] as const,
  byUser: (userId: string) => [...groupKeys.byUserRoot(), userId] as const,
  detail: (id: string) => [...groupKeys.all, "detail", id] as const,
};
