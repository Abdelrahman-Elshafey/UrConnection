import { profileUpdateSchema, type MeResponse, type MyGroupsResponse } from "@urconnections/shared";
import { Router } from "express";
import { HttpError } from "../../lib/errors";
import { parseOrThrow } from "../../lib/validate";
import { requireAuth } from "../auth/session.middleware";
import type { GroupsRepository } from "../groups/groups.repository";
import type { UsersRepository } from "./users.repository";

/**
 * PATCH /api/users/me          update your own profile (display_name, phone, country, city)
 * GET   /api/users/me/groups   the groups you own, newest first
 *
 * SECURITY: there is deliberately no /api/users/:id. "Me" always comes from the
 * session, never from the request, so nobody can read or edit someone else's data.
 */
export function usersRouter({ users, groups }: { users: UsersRepository; groups: GroupsRepository }): Router {
  const router = Router();

  router.patch("/me", requireAuth, async (req, res) => {
    const patch = parseOrThrow(profileUpdateSchema, req.body);
    const user = await users.updateProfile(req.user!.id, patch); // `!`: requireAuth guarantees it
    if (!user) throw new HttpError(401, "unauthenticated", "Please sign in"); // account deleted meanwhile
    res.json({ user } satisfies MeResponse);
  });

  router.get("/me/groups", requireAuth, async (req, res) => {
    res.set("Cache-Control", "no-store"); // personal data: never cache
    res.json({ items: await groups.listByOwner(req.user!.id) } satisfies MyGroupsResponse);
  });

  return router;
}
