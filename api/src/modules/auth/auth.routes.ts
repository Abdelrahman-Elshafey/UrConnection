import { loginSchema, registerSchema, type MeResponse } from "@urconnections/shared";
import { Router, type Request, type Response } from "express";
import { ipKeyGenerator, rateLimit, type Options } from "express-rate-limit";
import { HttpError } from "../../lib/errors";
import { parseOrThrow } from "../../lib/validate";
import { EmailTakenError, type UsersRepository } from "../users/users.repository";
import { clearSessionCookie, SESSION_TTL_MS, setSessionCookie } from "./cookies";
import { DUMMY_HASH, hashPassword, verifyPassword } from "./passwords";
import type { SessionsRepository } from "./sessions.repository";
import { hashToken, newSessionToken } from "./tokens";

export interface AuthDeps {
  users: UsersRepository;
  sessions: SessionsRepository;
}

/** A 429 in our usual error shape (instead of the library's plain-text default). */
const tooMany: Options["handler"] = (_req, _res, next) =>
  next(new HttpError(429, "too_many_requests", "Too many attempts. Please wait a few minutes and try again."));

const emailKey = (req: Request) => String((req.body as { email?: unknown })?.email ?? "").trim().toLowerCase();

/**
 * POST /api/auth/register   create an account and sign in
 * POST /api/auth/login      email + password → session cookie
 * POST /api/auth/logout     end this session
 * GET  /api/auth/me         who is signed in? { user } or { user: null }
 */
export function authRouter({ users, sessions }: AuthDeps): Router {
  const router = Router();

  // SECURITY: rate limits make password guessing slow. Created per app instance, so
  // every test gets fresh counters. (In-memory: fine for one server; several servers
  // would need a shared store, e.g. Redis.)
  const limits = {
    window: 15 * 60 * 1000, // 15 minutes
    common: { standardHeaders: "draft-8", legacyHeaders: false, handler: tooMany } as const,
  };
  // Per IP (or IPv6 /56 block): stops one machine hammering many accounts.
  const loginPerIp = rateLimit({ ...limits.common, windowMs: limits.window, limit: 30, keyGenerator: (req) => ipKeyGenerator(req.ip ?? "") });
  // Per email, counting only failures: stops a botnet guessing one account's password.
  const loginPerEmail = rateLimit({
    ...limits.common,
    windowMs: limits.window,
    limit: 10,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => `email:${emailKey(req)}`,
  });
  const registerPerIp = rateLimit({ ...limits.common, windowMs: 60 * 60 * 1000, limit: 10, keyGenerator: (req) => ipKeyGenerator(req.ip ?? "") });

  /** Creates a fresh session for `userId` and sets the cookie. */
  async function startSession(req: Request, res: Response, userId: string) {
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

  router.post("/register", registerPerIp, async (req, res) => {
    // SECURITY: take `password` out explicitly. Spreading the whole input into the insert
    // would also send the plain-text password to the database. (TypeScript doesn't flag
    // extra fields in a spread object, so this has to be deliberate.)
    const { password, ...profile } = parseOrThrow(registerSchema, req.body);
    try {
      const user = await users.create({ ...profile, password_hash: await hashPassword(password) });
      await startSession(req, res, user.id);
      res.status(201).json({ user } satisfies MeResponse);
    } catch (err) {
      // Trade-off: this tells a visitor that the email has an account (needed for a clear
      // sign-up message). Stage 8 can switch to "check your email" for every case.
      if (err instanceof EmailTakenError) {
        throw new HttpError(409, "email_taken", "An account with this email already exists.");
      }
      throw err;
    }
  });

  router.post("/login", loginPerIp, loginPerEmail, async (req, res) => {
    const { email, password } = parseOrThrow(loginSchema, req.body);
    const found = await users.findForLogin(email);

    // SECURITY: always run exactly one argon2 verification (DUMMY_HASH when the email is
    // unknown), and give one message for every failure. So neither the response nor its
    // timing reveals whether an account exists.
    const ok = await verifyPassword(found?.password_hash ?? DUMMY_HASH, password);
    if (!found || !found.password_hash || !ok) {
      throw new HttpError(401, "invalid_credentials", "Invalid email or password.");
    }

    await startSession(req, res, found.id);
    const { password_hash: _never, ...user } = found; // SECURITY: the hash never leaves the server
    res.json({ user } satisfies MeResponse);
  });

  router.post("/logout", async (req, res) => {
    if (req.sessionIdHash) await sessions.delete(req.sessionIdHash); // the token stops working at once
    clearSessionCookie(res);
    res.status(204).end();
  });

  router.get("/me", (req, res) => {
    // Never cache "who am I": the answer changes with the cookie.
    res.set("Cache-Control", "no-store");
    res.json({ user: req.user ?? null } satisfies MeResponse);
  });

  return router;
}
