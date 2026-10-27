import { z } from "../zod";

/**
 * The signed-in user as the API returns it (GET /api/auth/me, login, register, PATCH /api/users/me).
 * SECURITY: never includes password_hash or anything session-related.
 */
export const userSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  display_name: z.string(),
  phone: z.string(),
  country: z.string(),
  city: z.string(),
  avatar_url: z.string().nullable(), // e.g. "/media/avatars/<id>/<random>.webp"; null = no picture
  email_verified: z.boolean(),
  created_at: z.iso.datetime({ offset: true }),
});

/** GET /api/auth/me: `user` is null when nobody is signed in (a normal answer, not an error). */
export const meResponseSchema = z.object({ user: userSchema.nullable() });

export type User = z.infer<typeof userSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;
