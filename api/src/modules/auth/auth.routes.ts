import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  type ForgotPasswordResponse,
  type MeResponse,
  type User,
} from "@urconnections/shared";
import { Router, type Request, type Response } from "express";
import { ipKeyGenerator, rateLimit, type Options } from "express-rate-limit";
import { config } from "../../config";
import { HttpError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import type { Mailer } from "../../lib/mailer";
import { parseOrThrow } from "../../lib/validate";
import { EmailTakenError, type UsersRepository } from "../users/users.repository";
import { clearSessionCookie, SESSION_TTL_MS, setSessionCookie } from "./cookies";
import { resetPasswordMessage, verifyEmailMessage } from "./emails";
import type { EmailTokensRepository } from "./emailTokens.repository";
import { DUMMY_HASH, hashPassword, verifyPassword } from "./passwords";
import { requireAuth } from "./session.middleware";
import type { SessionsRepository } from "./sessions.repository";
import { hashToken, newSessionToken } from "./tokens";

export interface AuthDeps {
  users: UsersRepository;
  sessions: SessionsRepository;
  emailTokens: EmailTokensRepository;
  mailer: Mailer;
}

const invalidLink = () => new HttpError(400, "invalid_token", "This link is invalid or has expired. Please request a new one.");

/** A 429 in our usual error shape (instead of the library's plain-text default). */
const tooMany: Options["handler"] = (_req, _res, next) =>
  next(new HttpError(429, "too_many_requests", "Too many attempts. Please wait a few minutes and try again."));

const emailKey = (req: Request) => String((req.body as { email?: unknown })?.email ?? "").trim().toLowerCase();

/**
 * POST /api/auth/register   create an account and sign in
 * POST /api/auth/login      email + password → session cookie
 * POST /api/auth/logout     end this session
 * GET  /api/auth/me         who is signed in? { user } or { user: null }
 *
 * Email flows (Stage 8): links in emails carry a one-time token; only its hash is stored.
 * POST /api/auth/verify-email/request   (signed in) send a new verification email
 * POST /api/auth/verify-email           { token } → email confirmed
 * POST /api/auth/forgot-password        { email } → always 202, a reset email if the account exists
 * POST /api/auth/reset-password         { token, password } → new password, signed out everywhere
 */
export function authRouter({ users, sessions, emailTokens, mailer }: AuthDeps): Router {
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
  const hour = 60 * 60 * 1000;
  const perIp = (limit: number, windowMs = hour) =>
    rateLimit({ ...limits.common, windowMs, limit, keyGenerator: (req) => ipKeyGenerator(req.ip ?? "") });
  const registerPerIp = perIp(10);
  // Emails cost money and can be used to annoy someone: cap them per IP and per address.
  const forgotPerIp = perIp(10);
  const forgotPerEmail = rateLimit({ ...limits.common, windowMs: hour, limit: 3, keyGenerator: (req) => `email:${emailKey(req)}` });
  const resendPerUser = rateLimit({ ...limits.common, windowMs: hour, limit: 5, keyGenerator: (req) => `user:${req.user?.id ?? ""}` });
  const tokenPerIp = perIp(30); // verify / reset attempts: stops guessing (hopeless anyway with 256-bit tokens)

  /** Emails a fresh verification link. */
  async function sendVerificationEmail(user: User) {
    const token = await emailTokens.issue(user.id, "verify");
    await mailer.send(verifyEmailMessage(user.email, `${config.APP_ORIGIN}/verify-email?token=${token}`));
  }

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
      // A mail server problem must not break sign-up: log it; the user can resend later.
      await sendVerificationEmail(user).catch((err) => req.log.error({ err }, "verification email failed"));
      res.status(201).json({ user } satisfies MeResponse);
    } catch (err) {
      // Trade-off (kept on purpose): this tells a visitor that the email has an account,
      // in exchange for a clear sign-up message. Login and forgot-password reveal nothing.
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

  router.post("/verify-email/request", requireAuth, resendPerUser, async (req, res) => {
    if (!req.user!.email_verified) await sendVerificationEmail(req.user!);
    res.status(204).end();
  });

  router.post("/verify-email", tokenPerIp, async (req, res) => {
    const { token } = parseOrThrow(verifyEmailSchema, req.body);
    const userId = await emailTokens.consume(token, "verify");
    if (!userId) throw invalidLink();
    await users.markEmailVerified(userId);
    res.status(204).end();
  });

  router.post("/forgot-password", forgotPerIp, forgotPerEmail, async (req, res) => {
    const { email } = parseOrThrow(forgotPasswordSchema, req.body);

    // SECURITY: answer first, identically for every email, then do the work. If we only
    // replied after looking up the account and sending mail, the response time alone
    // would reveal which emails have accounts.
    res.status(202).json({
      message: "If an account exists for this email, we've sent a link to reset the password.",
    } satisfies ForgotPasswordResponse);

    try {
      const user = await users.findByEmail(email);
      if (!user) return;
      const token = await emailTokens.issue(user.id, "reset");
      await mailer.send(resetPasswordMessage(user.email, `${config.APP_ORIGIN}/reset-password?token=${token}`));
    } catch (err) {
      logger.error({ err }, "password reset email failed"); // the response is already sent
    }
  });

  router.post("/reset-password", tokenPerIp, async (req, res) => {
    const { token, password } = parseOrThrow(resetPasswordSchema, req.body);
    const userId = await emailTokens.consume(token, "reset");
    if (!userId) throw invalidLink();

    await users.setPasswordHash(userId, await hashPassword(password));
    // SECURITY: whoever knew the old password may still be signed in somewhere:
    // end every session of this account, including this browser's.
    await sessions.deleteAllForUser(userId);
    // Receiving the reset email proves the address works.
    await users.markEmailVerified(userId);
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
