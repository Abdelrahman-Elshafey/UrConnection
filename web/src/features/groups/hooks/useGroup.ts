import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { getGroupById } from "../api/groupsApi";
import { groupKeys } from "../api/queryKeys";

/**
 * Key + fetcher for one group, shared by the route loader (App.tsx, which starts the request
 * early) and the page (useGroup below), so both read and write the same cache entry.
 */
export const groupDetailQuery = (id: string) =>
  queryOptions({
    queryKey: groupKeys.detail(id),
    queryFn: () => getGroupById(id),
  });

/**
 * One group by id (the detail page). Data access lives in groupsApi (audit R1).
 * skipToken = "don't fetch yet": while there's no id, the query waits.
 */
export function useGroup(id: string | undefined) {
  return useQuery(id ? groupDetailQuery(id) : { queryKey: groupKeys.detail(""), queryFn: skipToken });
}
