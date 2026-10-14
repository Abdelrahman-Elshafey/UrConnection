import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteGroup } from "../api/groupsApi";
import { groupKeys } from "../api/queryKeys";

/** Delete your own group. Errors are shown by the caller (DeleteGroupDialog shows a toast). */
export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: (_data, id) => {
      // Drop the deleted group's detail first, so the invalidation below doesn't refetch it.
      queryClient.removeQueries({ queryKey: groupKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}
