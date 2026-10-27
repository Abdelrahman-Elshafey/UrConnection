import { createApp } from "./app";
import { config, GOOGLE_REDIRECT_URI } from "./config";
import { db } from "./db/db";
import { checkDatabase, pool } from "./db/pool";
import { createSmtpMailer } from "./lib/mailer";
import { createS3Storage } from "./lib/storage";
import { createEmailTokensRepository } from "./modules/auth/emailTokens.repository";
import { createGoogleOAuth } from "./modules/auth/google";
import { createOAuthAccountsRepository } from "./modules/auth/oauthAccounts.repository";
import { createSessionsRepository } from "./modules/auth/sessions.repository";
import { createGroupsRepository } from "./modules/groups/groups.repository";
import { createUsersRepository } from "./modules/users/users.repository";
import { logger } from "./lib/logger";

// The real dependencies. Tests build the app with fakes instead.
const sessions = createSessionsRepository(db);
const storage = createS3Storage({
  endpoint: config.S3_ENDPOINT,
  region: config.S3_REGION,
  bucket: config.S3_BUCKET,
  accessKeyId: config.S3_ACCESS_KEY_ID,
  secretAccessKey: config.S3_SECRET_ACCESS_KEY,
});
const app = createApp({
  checkDatabase,
  groups: createGroupsRepository(db),
  users: createUsersRepository(db),
  sessions,
  emailTokens: createEmailTokensRepository(db),
  mailer: createSmtpMailer(config.SMTP_URL, config.MAIL_FROM),
  oauthAccounts: createOAuthAccountsRepository(db),
  storage,
  google:
    config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET
      ? createGoogleOAuth(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
      : null,
});
if (!config.GOOGLE_CLIENT_ID) logger.info("Google sign-in is off (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set)");

// Let browsers read avatars through the bucket's website endpoint (idempotent, so on every start).
// Not fatal: the site still works without storage, only pictures don't.
storage
  .enableWebsiteAccess()
  .catch((err) => logger.warn({ err }, "could not reach file storage: avatars won't work (is Docker running? npm run db:up)"));

// Housekeeping: delete expired sessions at startup and every 6 hours.
// unref(): this timer alone shouldn't keep the process alive during shutdown.
const cleanSessions = () =>
  sessions
    .deleteExpired()
    .then((n) => n > 0 && logger.info(`removed ${n} expired sessions`))
    .catch((err) => logger.warn({ err }, "session cleanup failed"));
void cleanSessions();
setInterval(cleanSessions, 6 * 60 * 60 * 1000).unref();

// Express 5 calls this callback on success AND on failure (with the error), so check it:
// otherwise a failed start would still log "listening".
const server = app.listen(config.PORT, (err?: NodeJS.ErrnoException) => {
  if (err?.code === "EADDRINUSE") {
    // The port is taken: almost always an API from an earlier run that is still running in
    // the background (e.g. its terminal was closed). Say so plainly instead of a stack trace.
    logger.error(
      `Port ${config.PORT} is already in use, probably by an API that is still running from before.
` +
        "  Stop it:  npm run stop:dev   (then start again)",
    );
    process.exit(1);
  }
  if (err) throw err;
  logger.info(`API listening on http://localhost:${config.PORT} (${config.NODE_ENV})`);
});

/**
 * Graceful shutdown: on Ctrl+C (SIGINT) or `docker stop` (SIGTERM), stop accepting
 * new requests, let in-flight ones finish, then close the database pool.
 * Without this, a deploy could cut requests off halfway.
 */
function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  // If something hangs, don't wait forever.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
