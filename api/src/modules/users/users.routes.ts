import { AVATAR_MAX_BYTES, profileUpdateSchema, type MeResponse, type MyGroupsResponse } from "@urconnections/shared";
import { Router, type RequestHandler } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { HttpError } from "../../lib/errors";
import { checkCity } from "../../lib/places";
import { byUser, HOUR, limitRequests } from "../../lib/rateLimit";
import type { Storage } from "../../lib/storage";
import { parseOrThrow } from "../../lib/validate";
import { requireAuth, signedInUser, unauthenticated } from "../auth/session.middleware";
import type { GroupsRepository } from "../groups/groups.repository";
import { InvalidImageError, toAvatarWebp } from "./avatarImage";
import type { UsersRepository } from "./users.repository";

export interface UsersDeps {
  users: UsersRepository;
  groups: GroupsRepository;
  storage: Storage;
}

/**
 * The key is new for every upload, so its URL never changes meaning: browsers and proxies
 * may cache it forever ("immutable") and a new picture shows at once, because it has a new
 * URL. This is cache-busting by name, instead of "?t=<timestamp>" tricks.
 */
const AVATAR_CACHE_CONTROL = "public, max-age=31536000, immutable"; // one year

/**
 * Reads a multipart/form-data upload (the format browsers use for <input type="file">)
 * with one file in the field "avatar". The file stays in memory (it's at most 5 MB and
 * goes straight to sharp), never on the server's disk.
 */
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  // SECURITY: multer stops reading as soon as a limit is passed, so a 1 GB upload can't fill memory.
  limits: { fileSize: AVATAR_MAX_BYTES, files: 1, fields: 0, parts: 1 },
}).single("avatar");

/** Runs multer and turns its errors into our usual JSON errors. */
const receiveAvatar: RequestHandler = (req, res, next) => {
  avatarUpload(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      return next(
        err.code === "LIMIT_FILE_SIZE"
          ? new HttpError(413, "file_too_large", "That image is too large. The maximum is 5 MB.")
          : new HttpError(400, "invalid_upload", "Send one image in the field \"avatar\"."),
      );
    }
    next(err);
  });
};

/**
 * PATCH  /api/users/me          update your own profile (display_name, phone, country, city)
 * GET    /api/users/me/groups   the groups you own, newest first
 * PUT    /api/users/me/avatar   upload or replace your picture (multipart, field "avatar")
 * DELETE /api/users/me/avatar   remove your picture
 *
 * SECURITY: there is deliberately no /api/users/:id. "Me" always comes from the
 * session, never from the request, so nobody can read or edit someone else's data.
 */
export function usersRouter({ users, groups, storage }: UsersDeps): Router {
  const router = Router();

  // Image processing costs CPU: cap uploads per user (created per app, so tests start fresh).
  const avatarPerUser = limitRequests({
    limit: 20,
    windowMs: HOUR,
    key: byUser,
    message: "Too many picture changes. Please try again later.",
  });

  /** Deletes an object that is no longer used. A failure only leaves an orphan file, so log and carry on. */
  const deleteQuietly = (key: string, log: { warn: (obj: object, msg: string) => void }) =>
    storage.delete(key).catch((err) => log.warn({ err, key }, "could not delete old avatar object"));

  router.patch("/me", requireAuth, async (req, res) => {
    const patch = parseOrThrow(profileUpdateSchema, req.body);
    const current = signedInUser(req);
    // Only when the location changes: an older profile with a mismatched city can still edit its name.
    if (patch.country !== undefined || patch.city !== undefined) {
      checkCity({ country: patch.country ?? current.country, city: patch.city ?? current.city });
    }
    const user = await users.updateProfile(current.id, patch);
    if (!user) throw unauthenticated(); // account deleted meanwhile
    res.json({ user } satisfies MeResponse);
  });

  router.get("/me/groups", requireAuth, async (req, res) => {
    res.set("Cache-Control", "no-store"); // personal data: never cache
    res.json({ items: await groups.listByOwner(signedInUser(req).id) } satisfies MyGroupsResponse);
  });

  // requireAuth runs before multer: an anonymous upload is refused before a byte is buffered.
  router.put("/me/avatar", requireAuth, avatarPerUser, receiveAvatar, async (req, res) => {
    if (!req.file) throw new HttpError(400, "invalid_upload", "Choose an image to upload.");

    let webp: Buffer;
    try {
      webp = await toAvatarWebp(req.file.buffer);
    } catch (err) {
      if (err instanceof InvalidImageError) {
        throw new HttpError(400, "invalid_image", "Please choose a JPEG, PNG or WebP image.");
      }
      throw err;
    }

    // Order matters, so a failure never leaves the user pointing at a missing picture:
    // 1. store the new object  2. point the user at it  3. delete the old one.
    const userId = signedInUser(req).id;
    const key = `avatars/${userId}/${randomUUID()}.webp`;
    await storage.put(key, webp, { contentType: "image/webp", cacheControl: AVATAR_CACHE_CONTROL });

    const result = await users.setAvatarKey(userId, key).catch(async (err: unknown) => {
      await deleteQuietly(key, req.log); // the database refused: don't keep an unused object
      throw err;
    });
    if (!result) {
      await deleteQuietly(key, req.log);
      throw unauthenticated(); // account deleted meanwhile
    }
    if (result.previousKey) await deleteQuietly(result.previousKey, req.log);
    res.json({ user: result.user } satisfies MeResponse);
  });

  router.delete("/me/avatar", requireAuth, async (req, res) => {
    const result = await users.setAvatarKey(signedInUser(req).id, null);
    if (!result) throw unauthenticated();
    if (result.previousKey) await deleteQuietly(result.previousKey, req.log);
    res.json({ user: result.user } satisfies MeResponse);
  });

  return router;
}
