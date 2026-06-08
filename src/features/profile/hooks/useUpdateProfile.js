import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "../../../services/auth.service";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileData) => updateProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
}
