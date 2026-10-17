/**
 * npm run build -w @urconnections/api  →  api/dist/index.js + api/dist/db/migrate.js
 *
 * Why a build at all: in development `tsx` runs our TypeScript directly. Production runs
 * plain `node` (smaller, faster start, no compiler in the image), and Node can't run our
 * TypeScript: extension-less imports ("./app"), constructor parameter properties, and the
 * shared package is TS source with no build step of its own.
 *
 * esbuild bundles each entry into one JavaScript file:
 *   - our code and @urconnections/shared are bundled in (compiled from TS on the way);
 *   - every other dependency (express, argon2, sharp, ...) stays EXTERNAL: imported from
 *     node_modules at runtime. Native modules (argon2, sharp) can't be bundled anyway, and
 *     installing them in the image keeps the right Linux binaries.
 * No type checking here: `npm run typecheck` does that (and CI runs it).
 */
import { build } from "esbuild";
import { readFileSync } from "node:fs";

const { dependencies } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
const external = Object.keys(dependencies).filter((name) => name !== "@urconnections/shared");

await build({
  entryPoints: ["src/index.ts", "src/db/migrate.ts"],
  outdir: "dist",
  outbase: "src", // keeps the folder layout: dist/index.js, dist/db/migrate.js
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  external: [...external, ...external.map((name) => `${name}/*`)], // "pkg" and "pkg/sub/path"
  sourcemap: true, // stack traces point at the TypeScript lines
  logLevel: "info",
});
