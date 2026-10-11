import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteGroup } from "../api/groupsApi";
import { groupKeys } from "../api/queryKeys";

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: (_data, id) => {
      // Drop the deleted group's detail first, so the invalidation below doesn't refetch it.
      queryClient.removeQueries({ queryKey: groupKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
    // Replaced by a toast in Stage 11 (UI kit).
    onError: (err) => alert(err.message),
  });
}
