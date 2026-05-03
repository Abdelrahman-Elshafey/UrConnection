import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadAvatar, removeAvatar } from "../../../services/storage.service";

/**
 * TanStack mutation for uploading / replacing the avatar.
 * On success it invalidates the session cache so every component
 * that consumes useUser() picks up the fresh avatar_url automatically.
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, file }) => uploadAvatar(userId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

/**
 * TanStack mutation for removing the avatar.
 */
export function useRemoveAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => removeAvatar(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
}
