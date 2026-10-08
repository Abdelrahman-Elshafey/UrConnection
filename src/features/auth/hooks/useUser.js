import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getSession, onAuthStateChange } from "../../../services/auth.service";

export const SESSION_QUERY_KEY = ["session"];

export const sessionQueryOptions = {
  queryKey: SESSION_QUERY_KEY,
  queryFn: getSession,
  staleTime: Infinity,
};

export const useUser = () => useQuery(sessionQueryOptions);

/**
 * Keeps the ['session'] cache in sync with Supabase auth events.
 * Mount exactly once (RootLayout) — every call adds a new subscription.
 */
export const useAuthListener = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        // Drop user-scoped data so the next person on this tab never sees it.
        queryClient.removeQueries({ queryKey: ["groups", "user"] });
      }
      queryClient.setQueryData(SESSION_QUERY_KEY, session ?? null);
    });
    return unsubscribe;
  }, [queryClient]);
};
