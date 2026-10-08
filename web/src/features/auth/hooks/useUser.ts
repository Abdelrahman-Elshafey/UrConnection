import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getSession, onAuthStateChange } from "../../../services/auth.service";
import { groupKeys } from "../../groups/api/queryKeys";

export const SESSION_QUERY_KEY = ["session"] as const;

// queryOptions() keeps key, fetcher and result type together, so loaders
// (ensureQueryData) and components (useQuery) get the same typed data: Session | null.
export const sessionQueryOptions = queryOptions({
  queryKey: SESSION_QUERY_KEY,
  queryFn: getSession,
  staleTime: Infinity,
});

export const useUser = () => useQuery(sessionQueryOptions);

/**
 * Keeps the ['session'] cache in sync with Supabase auth events.
 * Mount exactly once (RootLayout): every call adds a new subscription.
 */
export const useAuthListener = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        // Drop user-scoped data so the next person on this tab never sees it.
        queryClient.removeQueries({ queryKey: groupKeys.byUserRoot() });
      }
      queryClient.setQueryData(SESSION_QUERY_KEY, session ?? null);
    });
    return unsubscribe;
  }, [queryClient]);
};
