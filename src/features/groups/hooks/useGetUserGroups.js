import { useQuery } from "@tanstack/react-query";
import { getUserGroups } from "../api/groupsApi";

export function useGetUserGroups(id) {
  return useQuery({
    queryKey: ["groups", "user", id],
    queryFn: () => getUserGroups(id),
    enabled: !!id,
  });
}
