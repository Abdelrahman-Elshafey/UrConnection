import type { Request } from "express";
import { ipKeyGenerator, rateLimit, type Options } from "express-rate-limit";
import { HttpError } from "./errors";

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;

/** Count per client IP. IPv6 users get a whole /56 block each, so they can't dodge it by switching addresses. */
export const byIp = (req: Request): string => ipKeyGenerator(req.ip ?? "");
/** Count per signed-in user (put the limiter after requireAuth). */
export const byUser = (req: Request): string => `user:${req.user?.id ?? ""}`;
/** Count per email address in the body, case-insensitive. */
export const byEmail = (req: Request): string =>
  `email:${String((req.body as { email?: unknown })?.email ?? "").trim().toLowerCase()}`;

interface LimitOptions {
  limit: number;
  windowMs: number;
  /** Who is counted. Default: the client IP. */
  key?: (req: Request) => string;
  /** The message of the 429 error. */
  message?: string;
  /** Count only failed requests (status ≥ 400), e.g. wrong passwords. */
  onlyFailures?: boolean;
  /** Replace the JSON 429, e.g. with a redirect for pages the browser navigates to. */
  handler?: Options["handler"];
}

/**
 * A rate limiter: at most `limit` requests per `windowMs` for each key, then 429 in our
 * usual { error } shape. SECURITY: limits make guessing (passwords, tokens) slow and cap
 * what costs money (emails, image processing).
 *
 * Counters live in memory, created per app instance (so every test starts fresh). Fine for
 * one server; several servers would need a shared store such as Redis.
 */
export function limitRequests({
  limit,
  windowMs,
  key = byIp,
  message = "Too many attempts. Please wait a few minutes and try again.",
  onlyFailures = false,
  handler,
}: LimitOptions) {
  return rateLimit({
    limit,
    windowMs,
    keyGenerator: key,
    skipSuccessfulRequests: onlyFailures,
    standardHeaders: "draft-8", // tell clients the limit in a RateLimit header
    legacyHeaders: false,
    handler: handler ?? ((_req, _res, next) => next(new HttpError(429, "too_many_requests", message))),
  });
}
