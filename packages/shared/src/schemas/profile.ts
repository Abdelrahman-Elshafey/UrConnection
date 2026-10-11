import { z } from "zod";

/**
 * Editable profile fields, named like the database columns (snake_case, the API's
 * convention). Empty strings are allowed: every field is optional for the user.
 */
export const profileFields = {
  display_name: z.string().trim().max(100, "Name is too long."),
  phone: z.string().trim().max(30, "Phone number is too long."),
  country: z.string().max(100),
  city: z.string().max(100),
};

/** The profile edit form: all four fields, always sent as strings. */
export const profileSchema = z.object(profileFields);

/** PATCH /api/users/me: send only the fields that change. */
export const profileUpdateSchema = profileSchema.partial();

export type ProfileInput = z.infer<typeof profileSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
