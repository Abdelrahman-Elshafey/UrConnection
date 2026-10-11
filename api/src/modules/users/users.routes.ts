import { profileUpdateSchema, type MeResponse } from "@urconnections/shared";
import { Router } from "express";
import { HttpError } from "../../lib/errors";
import { parseOrThrow } from "../../lib/validate";
import { requireAuth } from "../auth/session.middleware";
import type { UsersRepository } from "./users.repository";

/**
 * PATCH /api/users/me   update your own profile (display_name, phone, country, city)
 *
 * SECURITY: there is deliberately no PATCH /api/users/:id. The user to change always
 * comes from the session, never from the request, so nobody can edit someone else.
 */
export function usersRouter({ users }: { users: UsersRepository }): Router {
  const router = Router();

  router.patch("/me", requireAuth, async (req, res) => {
    const patch = parseOrThrow(profileUpdateSchema, req.body);
    const user = await users.updateProfile(req.user!.id, patch); // `!`: requireAuth guarantees it
    if (!user) throw new HttpError(401, "unauthenticated", "Please sign in"); // account deleted meanwhile
    res.json({ user } satisfies MeResponse);
  });

  return router;
}
