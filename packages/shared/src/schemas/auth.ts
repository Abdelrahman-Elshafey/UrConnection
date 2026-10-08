import { z } from "zod";
import { profileFields } from "./profile";

const email = z.email("Please enter a valid email address.");

/**
 * Password policy for new passwords. Each rule has its own message; forms show
 * the first failing one. Mirror these rules in the server-side auth settings
 * (Supabase dashboard today, the API in Stage 6). Client-side rules alone are only UX.
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[a-z]/, "Password must contain at least one lowercase (a-z).")
  .regex(/[A-Z]/, "Password must contain at least one uppercase (A-Z).")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^a-zA-Z0-9]/, "Password must contain a special character.");

/** Sign-in: only check the password is present (never reveal the policy on login). */
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required."),
});

export const signupSchema = z
  .object({
    email,
    password: passwordSchema,
    confirmPassword: z.string(),
    ...profileFields,
  })
  // Runs even when other fields have validation errors (zod only skips refinements
  // after type errors), so the mismatch shows together with the other messages.
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
