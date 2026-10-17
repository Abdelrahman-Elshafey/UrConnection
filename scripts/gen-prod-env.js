/**
 * npm run prod:env — creates .env.prod from .env.prod.example with fresh random secrets.
 *
 * Every __RANDOM_HEX_n__ placeholder becomes n random bytes as hex (from the OS's secure
 * random generator), so each install gets its own database password and storage keys.
 * SECURITY: an existing .env.prod is never overwritten: replacing the secrets of a running
 * stack would lock the API out of its own database.
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const target = ".env.prod";
if (existsSync(target)) {
  console.log(`${target} already exists: left unchanged. Delete it first to generate new secrets.`);
  process.exit(0);
}

const template = readFileSync(".env.prod.example", "utf8");
const filled = template.replace(/__RANDOM_HEX_(\d+)__/g, (_, bytes) => randomBytes(Number(bytes)).toString("hex"));
writeFileSync(target, filled, { mode: 0o600 }); // readable by you only (on Linux/macOS)
console.log(`Created ${target} with new random secrets. Review it, then: npm run prod:up`);
