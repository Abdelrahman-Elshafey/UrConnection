import { createApp } from "./app";
import { config } from "./config";
import { checkDatabase, pool } from "./db/pool";
import { logger } from "./lib/logger";

const app = createApp({ checkDatabase });

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
