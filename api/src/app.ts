import { randomUUID } from "node:crypto";
import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { config } from "./config";
import { logger } from "./lib/logger";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { originCheck } from "./middleware/originCheck";
import { authRouter, type AuthDeps } from "./modules/auth/auth.routes";
import { googleRouter, type GoogleDeps } from "./modules/auth/google.routes";
import { loadSession } from "./modules/auth/session.middleware";
import { groupsRouter, type GroupsDeps } from "./modules/groups/groups.routes";
import { healthRouter, type HealthDeps } from "./modules/health/health.routes";
import { usersRouter, type UsersDeps } from "./modules/users/users.routes";

/** Everything the app needs from the outside world. Tests pass fakes. */
export type AppDeps = HealthDeps & GroupsDeps & AuthDeps & GoogleDeps & UsersDeps;

/**
 * Builds the Express app without starting it. index.ts calls listen();
 * tests hand the app straight to Supertest, so no real port or database is needed.
 *
 * Middleware runs top to bottom for every request, like a pipeline:
 * security headers → request logging → CSRF origin check → body + cookie parsing →
 * session (req.user) → routes → 404 → error handler.
 */
export function createApp(deps: AppDeps): Express {
  const app = express();

  // Don't advertise "X-Powered-By: Express" (free information for attackers).
  app.disable("x-powered-by");

  // In production Caddy sits in front of the API; trust its X-Forwarded-* headers
  // (one proxy hop) so req.ip is the real client IP, needed for rate limiting later.
  app.set("trust proxy", 1);

  // SECURITY: helmet sets protective HTTP headers (nosniff, frame-ancestors, ...).
  app.use(helmet());

  // One log line per request, tagged with a request id. The id is also returned in the
  // X-Request-Id header, so a user's bug report can be matched to the exact log line.
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const incoming = req.headers["x-request-id"];
        const id = typeof incoming === "string" && incoming.length <= 64 ? incoming : randomUUID();
        res.setHeader("X-Request-Id", id);
        return id;
      },
      // Docker's health check calls /api/health every 10 s: ~8,600 identical lines a day
      // that would bury the real ones. Failures still show up (errors are logged anyway).
      autoLogging: { ignore: (req) => req.url === "/api/health" },
    }),
  );

  // SECURITY: reject state-changing requests from other sites before doing any work.
  app.use(originCheck(config.APP_ORIGIN));

  // Parse JSON request bodies. The size limit stops someone sending a 1 GB body.
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  // Who is this? Sets req.user from the session cookie (if any) for every route below.
  app.use(loadSession(deps));

  app.use("/api/health", healthRouter(deps));
  app.use("/api/groups", groupsRouter(deps));
  app.use("/api/auth/google", googleRouter(deps));
  app.use("/api/auth", authRouter(deps));
  app.use("/api/users", usersRouter(deps));

  app.use(notFound);
  app.use(errorHandler); // must be registered last
  return app;
}
