// Query-key factory (audit D7): every React Query key for groups is built here,
// so hooks and invalidations can never disagree on spelling.
// Keys are nested arrays: invalidating `groupKeys.all` refreshes everything below it.

export const groupKeys = {
  all: ["groups"] as const,
  list: () => [...groupKeys.all, "list"] as const,
  byUserRoot: () => [...groupKeys.all, "user"] as const,
  byUser: (userId: string) => [...groupKeys.byUserRoot(), userId] as const,
  detail: (id: string) => [...groupKeys.all, "detail", id] as const,
};
