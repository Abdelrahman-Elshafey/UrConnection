import type { Migration, MigrationProvider } from "kysely/migration";
import * as m0001 from "./0001_initial_schema";

/**
 * Every migration, in order. Add new ones at the bottom: "0002_...": m0002, ...
 *
 * Kysely also offers a FileMigrationProvider that scans the folder, but it builds
 * import paths that break on Windows. An explicit list is simpler, type-checked,
 * and makes the order obvious.
 */
const migrations: Record<string, Migration> = {
  "0001_initial_schema": m0001,
};

export const migrationProvider: MigrationProvider = {
  getMigrations: async () => migrations,
};
