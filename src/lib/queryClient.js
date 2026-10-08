import { QueryClient } from "@tanstack/react-query";

// Shared instance so router loaders can read/prime the same cache as components.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data changes only through our own mutations, which invalidate explicitly,
      // so avoid refetching whole tables on every mount / tab focus.
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});
