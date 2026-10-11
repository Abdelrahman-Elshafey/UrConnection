import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGroup } from "../api/groupsApi";
import { groupKeys } from "../api/queryKeys";

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroup,
    onSuccess: (group) => {
      // The API answered with the new group: cache it for its detail page...
      queryClient.setQueryData(groupKeys.detail(group.id), group);
      // ...and refetch every list that might now include it (home lists, "my groups").
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}
