import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadAvatar, removeAvatar } from "../../../services/storage.service";
import { SESSION_QUERY_KEY } from "../../auth/hooks/useUser";

/**
 * Uploads / replaces the avatar. On success it invalidates the session cache so
 * every component using useUser() picks up the fresh avatar_url automatically.
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, file }: { userId: string; file: File }) => uploadAvatar(userId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    },
  });
}

/** Removes the avatar. */
export function useRemoveAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    },
  });
}
