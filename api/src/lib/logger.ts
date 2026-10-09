import { pino } from "pino";
import { config, isProduction } from "../config";

/**
 * Structured logger. In production it writes one JSON object per line (easy for
 * log tools to search). In development, pino-pretty turns that into readable colored text.
 */
export const logger = pino({
  level: config.NODE_ENV === "test" ? "silent" : config.LOG_LEVEL,
  // SECURITY: never write credentials or session cookies into the logs.
  redact: ["req.headers.authorization", "req.headers.cookie", 'res.headers["set-cookie"]'],
  ...(isProduction ? {} : { transport: { target: "pino-pretty", options: { colorize: true } } }),
});
