import { skipToken, useQuery } from "@tanstack/react-query";
import { getGroupById } from "../api/groupsApi";
import { groupKeys } from "../api/queryKeys";

/**
 * One group by id (the detail page). Data access lives in groupsApi (audit R1).
 * skipToken = "don't fetch yet": while there's no id, the query waits, and TypeScript
 * knows `id` is a string inside the arrow function (no `id!` needed).
 */
export function useGroup(id: string | undefined) {
  return useQuery({
    queryKey: groupKeys.detail(id ?? ""),
    queryFn: id ? () => getGroupById(id) : skipToken,
  });
}
