import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGroup } from "../api/groupsApi";
import { storeSavedGroup } from "./groupCache";

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: createGroup, onSuccess: (group) => storeSavedGroup(queryClient, group) });
}
