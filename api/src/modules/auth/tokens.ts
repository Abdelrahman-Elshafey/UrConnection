import { createHash, randomBytes } from "node:crypto";

/**
 * A new session token: 32 random bytes (256 bits) from the OS's secure random
 * generator, as URL-safe text. Impossible to guess; this goes into the cookie.
 */
export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * SECURITY: what the database stores instead of the token: its SHA-256 hash (64 hex chars).
 * If the sessions table ever leaks, the hashes can't be turned back into cookies.
 * A fast hash is fine here (unlike passwords): the token is already 256 random bits,
 * so there is nothing to brute-force.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
