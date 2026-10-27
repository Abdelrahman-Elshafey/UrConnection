import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateGroup } from "../api/groupsApi";
import { storeSavedGroup } from "./groupCache";

/** Edit your own group (title, description, topic, country, city). */
export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: updateGroup, onSuccess: (group) => storeSavedGroup(queryClient, group) });
}
