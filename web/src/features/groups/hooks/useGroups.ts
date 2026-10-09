import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import type { GroupListParams } from "@urconnections/shared";
import { getGroups } from "../api/groupsApi";
import { groupKeys } from "../api/queryKeys";

type GroupFiltersParams = Omit<GroupListParams, "cursor" | "limit">;

/**
 * Groups matching `filters`, loaded page by page ("Load more").
 * useInfiniteQuery keeps every loaded page and knows how to fetch the next one
 * from the previous page's nextCursor.
 */
export function useGroups(filters: GroupFiltersParams) {
  const query = useInfiniteQuery({
    queryKey: groupKeys.list(filters),
    queryFn: ({ pageParam }) => getGroups({ ...filters, ...(pageParam ? { cursor: pageParam } : {}) }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined, // undefined = no more pages
    // While new filters load, keep showing the previous results instead of a spinner.
    placeholderData: keepPreviousData,
  });

  return {
    ...query,
    groups: query.data?.pages.flatMap((page) => page.items) ?? [],
  };
}
