import { z } from "zod";

/**
 * Every shared schema imports `z` from HERE, never from "zod" directly (ESLint enforces it).
 *
 * Why: zod 4 speeds up validation by generating JavaScript at runtime (`new Function`). The
 * site's Content Security Policy (script-src 'self', see Caddyfile) forbids that, so in the
 * browser each attempt was reported as a CSP violation. `jitless` = the normal, eval-free
 * validator (same results).
 *
 * zod reads the setting when each object schema is CREATED. A module always runs after the
 * modules it imports, so going through this file guarantees the setting is on before any
 * schema exists, however the bundler splits code into chunks. (Setting it in web/src/main.tsx
 * was too late: the schemas live in a shared chunk that loads before main's own code.)
 *
 * Browser only: the API has no CSP and keeps the faster mode.
 */
if ("document" in globalThis) z.config({ jitless: true });

export { z };
