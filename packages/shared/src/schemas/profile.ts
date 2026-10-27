import { isCountry } from "../countryNames";
import { z } from "../zod";

/**
 * Editable profile fields, named like the database columns (snake_case, the API's
 * convention). Empty strings are allowed: every field is optional for the user.
 */
export const profileFields = {
  display_name: z.string().trim().max(100, "Name is too long."),
  phone: z.string().trim().max(30, "Phone number is too long."),
  country: z.string().refine((value) => value === "" || isCountry(value), "Please choose a country from the list"),
  city: z.string().max(100),
};

/** The profile edit form: all four fields, always sent as strings. */
export const profileSchema = z.object(profileFields);

/** PATCH /api/users/me: send only the fields that change. */
export const profileUpdateSchema = profileSchema.partial();

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

// ── Avatars (Stage 10) ──────────────────────────────────────────────────────

/** Largest upload the API accepts. It's re-encoded to a small WebP, so this only caps the input. */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Image types the profile page offers. The browser uses this list for the file picker;
 * the API does NOT trust it (anyone can lie about a type): it checks the real format
 * by decoding the file's contents.
 */
export const AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
