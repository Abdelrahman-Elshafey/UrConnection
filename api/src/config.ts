import { existsSync } from "node:fs";
import { z } from "zod";

// In development, read api/.env if it exists (Node's built-in .env loader, no library needed).
// In production the variables come from the real environment (Docker / the server), not a file.
if (existsSync(".env")) process.loadEnvFile(".env");

/** "KEY=" (empty) in a .env file means "not set". */
const optionalString = z.preprocess((value) => (value === "" ? undefined : value), z.string().optional());

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
  // Outgoing email. Development: Mailpit from docker-compose.yml (catches everything).
  // Production: your mail provider's SMTP URL, e.g. smtps://user:pass@smtp.example.com:465
  SMTP_URL: z.url({ protocol: /^smtps?$/ }).default("smtp://localhost:1025"),
  MAIL_FROM: z.string().min(3).default("UrConnections <no-reply@urconnections.local>"),
  // Google sign-in (Stage 9), from Google Cloud console → APIs & Services → Credentials →
  // "OAuth client ID" (type: Web application). Leave both empty to switch Google sign-in off.
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  // File storage (Stage 10): any S3-compatible service. Development: Garage from
  // docker-compose.yml (the dev key and secret in api/.env.example match it).
  S3_ENDPOINT: z.url().default("http://localhost:3900"),
  S3_REGION: z.string().min(1).default("garage"),
  S3_BUCKET: z.string().min(3).default("urconnections"),
  S3_ACCESS_KEY_ID: z.string().min(1, "S3_ACCESS_KEY_ID is required (see api/.env.example)"),
  S3_SECRET_ACCESS_KEY: z.string().min(1, "S3_SECRET_ACCESS_KEY is required (see api/.env.example)"),
}).refine((env) => !env.GOOGLE_CLIENT_ID === !env.GOOGLE_CLIENT_SECRET, {
  message: "Set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or neither",
  path: ["GOOGLE_CLIENT_SECRET"],
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // z.prettifyError lists every problem at once, e.g. "✖ DATABASE_URL must be a postgres:// URL"
  console.error("Invalid API configuration (see api/.env.example):\n" + z.prettifyError(parsed.error));
  process.exit(1);
}

export const config = parsed.data;
export const isProduction = config.NODE_ENV === "production";

/**
 * Where Google sends the browser back to. It must be registered, character for character,
 * as an "Authorized redirect URI" in the Google Cloud console. It's on the site's own origin
 * (Vite proxies /api in dev, Caddy in prod), so the session cookie lands on the site.
 */
export const GOOGLE_REDIRECT_URI = `${new URL(config.APP_ORIGIN).origin}/api/auth/google/callback`;
