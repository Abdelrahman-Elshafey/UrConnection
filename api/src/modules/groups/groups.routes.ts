import {
  createGroupSchema,
  groupListQuerySchema,
  updateGroupSchema,
  type Group,
  type GroupListResponse,
} from "@urconnections/shared";
import { Router, type Request } from "express";
import { z } from "zod";
import { HttpError } from "../../lib/errors";
import { parseOrThrow } from "../../lib/validate";
import { requireAuth } from "../auth/session.middleware";
import type { GroupsRepository } from "./groups.repository";

export interface GroupsDeps {
  groups: GroupsRepository;
}

// SECURITY: "not found" for every group you may not touch, existing or not. A 403
// ("exists, but not yours") would confirm to a stranger that a hidden id is real.
const notFound = () => new HttpError(404, "not_found", "Group not found");

/** The :id URL parameter as a UUID, or a 404 (instead of a 500 from Postgres's uuid cast). */
function groupId(req: Request): string {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) throw notFound();
  return id.data;
}

/**
 * Public (no login):
 *   GET    /api/groups       → { items, nextCursor }  filters: query, topic, country, city, platform; paging: cursor, limit
 *   GET    /api/groups/:id   → one group, or 404
 * Owner only (session required; anyone else gets 404):
 *   POST   /api/groups       → 201 the new group (owned by the signed-in user)
 *   PATCH  /api/groups/:id   → the updated group (title, description, topic, country, city;
 *                               the meeting link and platform can't be changed)
 *   DELETE /api/groups/:id   → 204
 */
export function groupsRouter({ groups }: GroupsDeps): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    // The same schema the web client uses to build the request.
    const query = parseOrThrow(groupListQuerySchema, req.query);
    const page: GroupListResponse = await groups.list(query);
    res.json(page);
  });

  router.get("/:id", async (req, res) => {
    const group = await groups.getById(groupId(req));
    if (!group) throw notFound();
    res.json(group);
  });

  router.post("/", requireAuth, async (req, res) => {
    const input = parseOrThrow(createGroupSchema, req.body);
    // SECURITY: the owner is whoever is signed in. A `user_id` in the body is ignored
    // (zod drops unknown keys), so nobody can create groups in someone else's name.
    const group: Group = await groups.create(req.user!.id, input);
    res.status(201).json(group);
  });

  router.patch("/:id", requireAuth, async (req, res) => {
    const id = groupId(req);
    const patch = parseOrThrow(updateGroupSchema, req.body);

    // Load the caller's own group (someone else's → not found), apply the changes, then
    // validate the *whole* result with the same rules as creating a group.
    const current = await groups.getOwned(id, req.user!.id);
    if (!current) throw notFound();
    const merged = parseOrThrow(createGroupSchema, { ...current, ...patch });

    // Ownership is checked again inside the UPDATE itself (WHERE id AND user_id).
    const { title, description, topic, country, city } = merged;
    const updated = await groups.updateOwned(id, req.user!.id, { title, description, topic, country, city });
    if (!updated) throw notFound(); // deleted in between
    res.json(updated);
  });

  router.delete("/:id", requireAuth, async (req, res) => {
    const deleted = await groups.deleteOwned(groupId(req), req.user!.id);
    if (!deleted) throw notFound();
    res.status(204).end();
  });

  return router;
}
