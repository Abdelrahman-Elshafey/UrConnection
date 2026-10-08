import { useQuery } from "@tanstack/react-query";
import { getGroups } from "../api/groupsApi";
import { groupKeys } from "../api/queryKeys";

export function useGetGroups() {
  return useQuery({
    queryKey: groupKeys.list(),
    queryFn: getGroups,
  });
}
