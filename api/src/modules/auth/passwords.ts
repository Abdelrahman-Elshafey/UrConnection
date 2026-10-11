import argon2 from "argon2";

/**
 * Password hashing with argon2id, the current recommendation (OWASP).
 *
 * A hash is one-way: you can check a password against it, but not turn it back
 * into the password. argon2 is deliberately slow and memory-hungry (64 MB, 3 passes),
 * so even with a stolen database, guessing billions of passwords is impractical.
 * Each hash includes its own random salt and its settings, e.g.
 *   $argon2id$v=19$m=65536,t=3,p=4$<salt>$<hash>
 * so two users with the same password still get different hashes.
 */
export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false; // malformed hash: treat as "wrong password", never as a crash
  }
}

/**
 * SECURITY: a hash of a random password, used when the email doesn't exist.
 * Login then still runs one full argon2 verification, so "unknown email" takes
 * as long as "wrong password". Otherwise an attacker could time the response
 * to find out which emails have accounts.
 */
export const DUMMY_HASH = await hashPassword(crypto.randomUUID());
