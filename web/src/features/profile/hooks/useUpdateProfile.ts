import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "../../../services/auth.service";
import { SESSION_QUERY_KEY } from "../../auth/hooks/useUser";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    },
  });
}
