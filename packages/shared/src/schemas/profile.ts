import { z } from "zod";

/**
 * Editable profile fields. Empty strings are allowed: every field is optional,
 * and the forms always send strings (never undefined).
 */
export const profileFields = {
  displayName: z.string().trim().max(100, "Name is too long."),
  phoneNumber: z.string().trim().max(30, "Phone number is too long."),
  country: z.string(),
  city: z.string(),
};

export const profileSchema = z.object(profileFields);

export type ProfileInput = z.infer<typeof profileSchema>;
