import type { User } from "@urconnections/shared";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { getMe, logout } from "../../../services/auth.service";
import { groupKeys } from "../../groups/api/queryKeys";

export const SESSION_QUERY_KEY = ["session"] as const;

// queryOptions() keeps key, fetcher and result type together, so loaders
// (ensureQueryData) and components (useQuery) get the same typed data: User | null.
// staleTime: Infinity: the answer only changes when *we* log in/out or edit the
// profile, and those actions update this cache themselves (setQueryData).
export const sessionQueryOptions = queryOptions({
  queryKey: SESSION_QUERY_KEY,
  queryFn: getMe,
  staleTime: Infinity,
});

/** The signed-in user (`data`), or null. */
export const useUser = () => useQuery(sessionQueryOptions);

/** Put a freshly signed-in (or updated) user into the cache: every component updates at once. */
export function useSetUser() {
  const queryClient = useQueryClient();
  return (user: User | null) => queryClient.setQueryData(SESSION_QUERY_KEY, user);
}

/** Sign out, forget user-specific cached data, go home (audit D9: one shared handler). */
export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      // Even if the request failed (offline), forget the user locally.
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
      queryClient.removeQueries({ queryKey: groupKeys.mine() });
      navigate("/");
    },
  });
}
