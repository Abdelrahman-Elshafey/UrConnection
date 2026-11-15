import { config } from "../config";

/**
 * Turns the most common "can't use the database" errors into a short explanation
 * plus the command that fixes it. Returns null for any other error, so real bugs
 * still show their full stack trace.
 *
 * Postgres errors carry a SQLSTATE `code` (e.g. "28P01"); network errors carry a
 * Node `code` (e.g. "ECONNREFUSED"), sometimes wrapped in an AggregateError when
 * several addresses were tried (IPv6 ::1 and IPv4 127.0.0.1).
 */
export function explainDatabaseError(err: unknown): string | null {
  const codes = collectCodes(err);

  // SECURITY: show host, port and database name, but never the password from the URL.
  const url = new URL(config.DATABASE_URL);
  const where = `${url.hostname}:${url.port || "5432"}/${url.pathname.slice(1)}`;

  if (codes.has("ECONNREFUSED")) {
    return [
      `Can't reach Postgres at ${where}: nothing is listening on that port.`,
      "Is Docker Desktop running? Then start the database:",
      "  npm run db:up",
    ].join("\n");
  }
  if (codes.has("ENOTFOUND") || codes.has("EAI_AGAIN")) {
    return `The database host "${url.hostname}" can't be found. Check DATABASE_URL in api/.env.`;
  }
  if (codes.has("28P01")) {
    return `Postgres rejected the username or password for ${where}. Check DATABASE_URL in api/.env (dev values: api/.env.example).`;
  }
  if (codes.has("3D000")) {
    return `The database "${url.pathname.slice(1)}" doesn't exist on ${url.hostname}:${url.port || "5432"}. Check DATABASE_URL in api/.env.`;
  }
  if (codes.has("42P01")) {
    return "A table is missing: the database has no schema yet. Create it first:\n  npm run db:migrate";
  }
  return null;
}

/** All `code` values on the error and on any errors it wraps (AggregateError, `cause`). */
function collectCodes(err: unknown, found = new Set<string>()): Set<string> {
  if (typeof err !== "object" || err === null) return found;
  const e = err as { code?: unknown; errors?: unknown; cause?: unknown };
  if (typeof e.code === "string") found.add(e.code);
  if (Array.isArray(e.errors)) for (const inner of e.errors) collectCodes(inner, found);
  if (e.cause) collectCodes(e.cause, found);
  return found;
}

/**
 * For CLI scripts: print the friendly explanation if there is one, otherwise the
 * full error, then exit with code 1 (so CI and shells see the failure).
 */
export function exitWithDatabaseError(prefix: string, err: unknown): never {
  const help = explainDatabaseError(err);
  console.error(help ? `✖ ${prefix}\n${help}` : `✖ ${prefix}`);
  if (!help) console.error(err);
  process.exit(1);
}
