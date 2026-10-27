import type { User } from "@urconnections/shared";
import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
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

/**
 * Someone else (or nobody) is signed in now: store the new session and drop the previous
 * user's own data, so the next person never sees it, not even for a moment while it refetches.
 * For sign-in, sign-out and password reset; profile edits (same user) use useSetUser.
 */
export function switchUser(queryClient: QueryClient, user: User | null): void {
  queryClient.setQueryData(SESSION_QUERY_KEY, user);
  queryClient.removeQueries({ queryKey: groupKeys.mine() });
}

/** Sign out, forget user-specific cached data, go home (audit D9: one shared handler). */
export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      // Even if the request failed (offline), forget the user locally.
      switchUser(queryClient, null);
      navigate("/");
    },
  });
}
