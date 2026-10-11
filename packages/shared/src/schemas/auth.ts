import { z } from "zod";
import { profileFields } from "./profile";

const email = z.email("Please enter a valid email address.").max(254);

/**
 * Password policy for new passwords. Each rule has its own message; forms show the
 * first failing one. The API enforces the same schema, so the rules can't be skipped
 * by calling the API directly. (Client-side checks alone are only UX.)
 * max(200): argon2 handles long input, but nobody needs more, and it caps hashing work.
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(200, "Password is too long.")
  .regex(/[a-z]/, "Password must contain at least one lowercase (a-z).")
  .regex(/[A-Z]/, "Password must contain at least one uppercase (A-Z).")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^a-zA-Z0-9]/, "Password must contain a special character.");

/** POST /api/auth/login. Only checks the password is present: never reveal the policy on login. */
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required.").max(200),
});

/** POST /api/auth/register. Profile fields are optional and default to "". */
export const registerSchema = z.object({
  email,
  password: passwordSchema,
  display_name: profileFields.display_name.default(""),
  phone: profileFields.phone.default(""),
  country: profileFields.country.default(""),
  city: profileFields.city.default(""),
});

/** The sign-up form: the register fields plus a confirmation the API never sees. */
export const signupSchema = registerSchema
  .extend({ confirmPassword: z.string() })
  // Runs even when other fields have validation errors (zod only skips refinements
  // after type errors), so the mismatch shows together with the other messages.
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
