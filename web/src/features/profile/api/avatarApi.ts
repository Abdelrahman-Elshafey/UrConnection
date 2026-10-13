import { meResponseSchema, type User } from "@urconnections/shared";
import { apiSend } from "../../../lib/apiClient";

/**
 * Avatars (Stage 10) go to our API, which checks the image, converts it to a 512px WebP
 * and stores it. The browser sends the original file: no compression here any more.
 * Both calls answer with the updated user (avatar_url is the new picture, or null).
 */
export async function uploadAvatar(file: File): Promise<User> {
  const form = new FormData();
  form.append("avatar", file); // the field name the API's multer expects
  const { user } = await apiSend("PUT", "/api/users/me/avatar", meResponseSchema, form);
  return user!;
}

export async function removeAvatar(): Promise<User> {
  const { user } = await apiSend("DELETE", "/api/users/me/avatar", meResponseSchema);
  return user!;
}
