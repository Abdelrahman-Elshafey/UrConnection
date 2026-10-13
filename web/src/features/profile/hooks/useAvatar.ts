import { useMutation } from "@tanstack/react-query";
import { removeAvatar, uploadAvatar } from "../api/avatarApi";
import { useSetUser } from "../../auth/hooks/useUser";

/**
 * Uploads / replaces the avatar. The API answers with the updated user, which goes
 * straight into the session cache, so the navbar and profile show the new picture at
 * once (no extra /me request).
 */
export function useUploadAvatar() {
  const setUser = useSetUser();
  return useMutation({ mutationFn: uploadAvatar, onSuccess: setUser });
}

/** Removes the avatar. */
export function useRemoveAvatar() {
  const setUser = useSetUser();
  return useMutation({ mutationFn: removeAvatar, onSuccess: setUser });
}
