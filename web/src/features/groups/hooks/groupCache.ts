import type { QueryClient } from "@tanstack/react-query";
import type { Group } from "@urconnections/shared";
import { groupKeys } from "../api/queryKeys";

/**
 * After creating or editing a group, the API answers with the saved group: cache it for
 * its detail page (no refetch needed), then refresh every list that might show it
 * (home lists, "my groups"). Shared by useCreateGroup and useUpdateGroup.
 */
export function storeSavedGroup(queryClient: QueryClient, group: Group): void {
  queryClient.setQueryData(groupKeys.detail(group.id), group);
  void queryClient.invalidateQueries({ queryKey: groupKeys.all });
}
