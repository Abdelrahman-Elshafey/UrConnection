import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGroup } from "../api/groupsApi";
import { groupKeys } from "../api/queryKeys";

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      // Every cached group list is now outdated: refetch them.
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
    // Replaced by a toast in Stage 7.
    onError: (err) => alert("Failed to create group: " + err.message),
  });
}
