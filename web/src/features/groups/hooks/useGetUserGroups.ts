import { useQuery } from "@tanstack/react-query";
import { getUserGroups } from "../api/groupsApi";
import { groupKeys } from "../api/queryKeys";

/** Groups owned by `userId`. Disabled (no request) until the id is known. */
export function useGetUserGroups(userId: string | undefined) {
  return useQuery({
    queryKey: groupKeys.byUser(userId ?? ""),
    queryFn: () => getUserGroups(userId!), // `!` is safe: `enabled` guarantees userId is set
    enabled: !!userId,
  });
}
