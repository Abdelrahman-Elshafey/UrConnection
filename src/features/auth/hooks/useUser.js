import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession } from "../../../services/auth.service";
import { supabase } from "../../../lib/supabase";
import { useEffect } from "react";

export const useUser = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      queryClient.setQueryData(["session"], session);
      if (event === "SIGNED_OUT") {
        queryClient.removeQueries({ queryKey: ["session"] });
        sessionStorage.clear();
        localStorage.clear();      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
