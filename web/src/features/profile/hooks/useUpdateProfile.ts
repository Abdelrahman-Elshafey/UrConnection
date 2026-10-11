import { useMutation } from "@tanstack/react-query";
import { updateProfile } from "../../../services/auth.service";
import { useSetUser } from "../../auth/hooks/useUser";

export function useUpdateProfile() {
  const setUser = useSetUser();

  return useMutation({
    mutationFn: updateProfile,
    // The API answers with the updated user: put it straight into the cache
    // (no extra request to refetch /me).
    onSuccess: (user) => setUser(user),
  });
}
