import { createApp } from "./app";
import { config } from "./config";
import { db } from "./db/db";
import { checkDatabase, pool } from "./db/pool";
import { createSmtpMailer } from "./lib/mailer";
import { createEmailTokensRepository } from "./modules/auth/emailTokens.repository";
import { createSessionsRepository } from "./modules/auth/sessions.repository";
import { createGroupsRepository } from "./modules/groups/groups.repository";
import { createUsersRepository } from "./modules/users/users.repository";
import { logger } from "./lib/logger";

// The real dependencies. Tests build the app with fakes instead.
const sessions = createSessionsRepository(db);
const app = createApp({
  checkDatabase,
  groups: createGroupsRepository(db),
  users: createUsersRepository(db),
  sessions,
  emailTokens: createEmailTokensRepository(db),
  mailer: createSmtpMailer(config.SMTP_URL, config.MAIL_FROM),
});

// Housekeeping: delete expired sessions at startup and every 6 hours.
// unref(): this timer alone shouldn't keep the process alive during shutdown.
const cleanSessions = () =>
  sessions
    .deleteExpired()
    .then((n) => n > 0 && logger.info(`removed ${n} expired sessions`))
    .catch((err) => logger.warn({ err }, "session cleanup failed"));
void cleanSessions();
setInterval(cleanSessions, 6 * 60 * 60 * 1000).unref();

const server = app.listen(config.PORT, () => {
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
