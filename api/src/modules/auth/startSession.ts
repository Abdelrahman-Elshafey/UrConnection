import type { Request, Response } from "express";
import { SESSION_TTL_MS, setSessionCookie } from "./cookies";
import type { SessionsRepository } from "./sessions.repository";
import { hashToken, newSessionToken } from "./tokens";

/**
 * Signs `userId` in: a fresh session row plus the cookie. Every way of signing in
 * (password, register, Google) goes through here, so they all behave the same.
 */
export async function startSession(sessions: SessionsRepository, req: Request, res: Response, userId: string): Promise<void> {
  // SECURITY: session rotation. Signing in always gets a brand-new token and drops any
  // previous one, so a token planted on this browser earlier ("session fixation") is useless.
  if (req.sessionIdHash) await sessions.delete(req.sessionIdHash);

  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await sessions.create({
    idHash: hashToken(token),
    userId,
    expiresAt,
    userAgent: req.get("user-agent") ?? "",
    ip: req.ip ?? null,
  });
  setSessionCookie(res, token, expiresAt);
}
