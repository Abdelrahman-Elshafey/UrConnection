import { skipToken, useQuery } from "@tanstack/react-query";
import { getMyGroups } from "../api/groupsApi";
import { groupKeys } from "../api/queryKeys";

/** The signed-in user's own groups (profile page). Waits (skipToken) until someone is signed in. */
export function useMyGroups(enabled: boolean) {
  return useQuery({
    queryKey: groupKeys.mine(),
    queryFn: enabled ? getMyGroups : skipToken,
  });
}
