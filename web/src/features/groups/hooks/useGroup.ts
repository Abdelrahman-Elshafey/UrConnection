import { useQuery } from "@tanstack/react-query";
import { getGroupById } from "../api/groupsApi";
import { groupKeys } from "../api/queryKeys";

/** One group by id (the detail page). Data access lives in groupsApi (audit R1). */
export function useGroup(id: string | undefined) {
  return useQuery({
    queryKey: groupKeys.detail(id ?? ""),
    queryFn: () => getGroupById(id!), // `!` is safe: `enabled` guarantees id is set
    enabled: !!id,
  });
}
