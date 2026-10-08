import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGroup as createGroupApi } from '../api/groupsApi';

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroupApi,
    onSuccess: () => {
      // This tells React Query: "The old list is outdated, go get the new one!"
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
    onError: (err) => alert("Failed to create group: " + err.message),
  });
}