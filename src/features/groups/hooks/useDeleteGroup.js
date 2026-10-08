import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteGroup as deleteGroupApi } from '../api/groupsApi';

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGroupApi,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.removeQueries({ queryKey: ['group', id] });
    },
    onError: (err) => alert(err.message),
  });
}