import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateGroup } from "../api/groupsApi";
import { groupKeys } from "../api/queryKeys";

/** Edit your own group (title, description, topic, country, city). */
export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGroup,
    onSuccess: (group) => {
      queryClient.setQueryData(groupKeys.detail(group.id), group);
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}
