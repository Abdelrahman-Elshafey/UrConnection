import {
  forgotPasswordResponseSchema,
  meResponseSchema,
  type LoginInput,
  type ProfileUpdate,
  type RegisterInput,
  type User,
} from "@urconnections/shared";
import { apiGet, apiSend, apiSendNoContent } from "../lib/apiClient";

/**
 * Authentication through our own API (Stage 6). The session lives in an httpOnly
 * cookie the browser sends automatically: this code never sees or stores the token.
 */

/**
 * Google sign-in (Stage 9) is a page navigation, not an API call: link to this URL.
 * The API redirects to Google and back, sets the session cookie, then sends the browser
 * to "/" or to `?next=<path>` (or to /login?error=<code> if something went wrong).
 */
export const GOOGLE_SIGN_IN_URL = "/api/auth/google";

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

export const logout = (): Promise<void> => apiSendNoContent("POST", "/api/auth/logout");

/** Update the signed-in user's own profile; returns the updated user. */
export const updateProfile = async (patch: ProfileUpdate): Promise<User> => {
  const { user } = await apiSend("PATCH", "/api/users/me", meResponseSchema, patch);
  return user!;
};

// ── Email flows (Stage 8) ───────────────────────────────────────────────────

/** Send a new verification email to the signed-in user. */
export const requestVerificationEmail = (): Promise<void> => apiSendNoContent("POST", "/api/auth/verify-email/request");

/** Confirm the email address with the token from the link. */
export const verifyEmail = (token: string): Promise<void> => apiSendNoContent("POST", "/api/auth/verify-email", { token });

/** Always succeeds (the API never reveals whether the email has an account). */
export const forgotPassword = async (email: string): Promise<string> =>
  (await apiSend("POST", "/api/auth/forgot-password", forgotPasswordResponseSchema, { email })).message;

/** Set a new password with the token from the reset link. Signs the account out everywhere. */
export const resetPassword = (token: string, password: string): Promise<void> =>
  apiSendNoContent("POST", "/api/auth/reset-password", { token, password });
