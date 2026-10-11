import { existsSync } from "node:fs";
import { z } from "zod";

// In development, read api/.env if it exists (Node's built-in .env loader, no library needed).
// In production the variables come from the real environment (Docker / the server), not a file.
if (existsSync(".env")) process.loadEnvFile(".env");

/**
 * Every setting the API needs, validated once at startup.
 * If something is missing or malformed, the server refuses to start and says why,
 * instead of failing later with a confusing error in the middle of a request.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000), // env values are strings; coerce turns "3000" into 3000
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/, error: "DATABASE_URL must be a postgres:// URL" }),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  // The site's own origin (scheme + host + port). State-changing requests from any
  // other origin are rejected (CSRF protection). Production: e.g. https://urconnections.example
  APP_ORIGIN: z.url().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // z.prettifyError lists every problem at once, e.g. "✖ DATABASE_URL must be a postgres:// URL"
  console.error("Invalid API configuration (see api/.env.example):\n" + z.prettifyError(parsed.error));
  process.exit(1);
}

export const config = parsed.data;
export const isProduction = config.NODE_ENV === "production";
