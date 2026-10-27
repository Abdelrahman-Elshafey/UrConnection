import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./apiClient";

// Shared instance so router loaders can read/prime the same cache as components.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data changes only through our own mutations, which invalidate explicitly,
      // so avoid refetching whole tables on every mount / tab focus.
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      // Retry only what might work a second later (network trouble, 5xx). A 4xx such as
      // "group not found" will never change, so show it at once instead of after 3 retries.
      retry: (failureCount, error) => !(error instanceof ApiError && error.status < 500) && failureCount < 3,
    },
  },
});
