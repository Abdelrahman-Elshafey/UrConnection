import { groupListQuerySchema, type GroupListResponse } from "@urconnections/shared";
import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../../lib/errors";
import { parseOrThrow } from "../../lib/validate";
import type { GroupsRepository } from "./groups.repository";

export interface GroupsDeps {
  groups: GroupsRepository;
}

const notFound = () => new HttpError(404, "not_found", "Group not found");

/**
 * Public, read-only group endpoints (no login needed):
 *   GET /api/groups       → { items, nextCursor }  filters: query, topic, country, city, platform; paging: cursor, limit
 *   GET /api/groups/:id   → one group, or 404
 * Writing (POST / DELETE) comes in Stage 7, after authentication.
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
    // Something that isn't a UUID can't be a group id: answer 404 instead of letting
    // Postgres fail on the cast (which would be a 500).
    const id = z.uuid().safeParse(req.params.id);
    if (!id.success) throw notFound();

    const group = await groups.getById(id.data);
    if (!group) throw notFound();
    res.json(group);
  });

  return router;
}
