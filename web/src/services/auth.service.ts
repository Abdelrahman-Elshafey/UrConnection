import {
  meResponseSchema,
  type LoginInput,
  type ProfileUpdate,
  type RegisterInput,
  type User,
} from "@urconnections/shared";
import { apiGet, apiSend, apiSendNoContent } from "../lib/apiClient";
import { clearSavedSearch } from "../features/groups/utils/savedSearch";

/**
 * Authentication through our own API (Stage 6). The session lives in an httpOnly
 * cookie the browser sends automatically: this code never sees or stores the token.
 * (Google sign-in returns in Stage 9; avatars move to the API in Stage 10.)
 */

/** Who is signed in? `null` when nobody is (not an error). */
export const getMe = async (): Promise<User | null> => (await apiGet("/api/auth/me", meResponseSchema)).user;

export const register = async (input: RegisterInput): Promise<User> => {
  const { user } = await apiSend("POST", "/api/auth/register", meResponseSchema, input);
  return user!; // register always returns the new user
};

export const login = async (input: LoginInput): Promise<User> => {
  const { user } = await apiSend("POST", "/api/auth/login", meResponseSchema, input);
  return user!;
};

export const logout = async (): Promise<void> => {
  await apiSendNoContent("POST", "/api/auth/logout");
  clearSavedSearch(); // the next person on this tab starts with fresh filters
};

/** Update the signed-in user's own profile; returns the updated user. */
export const updateProfile = async (patch: ProfileUpdate): Promise<User> => {
  const { user } = await apiSend("PATCH", "/api/users/me", meResponseSchema, patch);
  return user!;
};
