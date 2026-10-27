import type { Kysely } from "kysely";
import { Migrator, NO_MIGRATIONS, type MigrationResultSet } from "kysely/migration";
import { migrationProvider } from "./migrations";

export type MigrationCommand = "latest" | "down" | "reset";

/**
 * Applies migrations to the given database. Shared by the CLI (migrate.ts) and the tests.
 * Kysely records which migrations already ran in a `kysely_migration` table, so
 * "latest" only runs the new ones, and a lock table stops two runs at the same time.
 *
 * Generic over DB: migrations work on any Kysely instance, whatever its table types.
 */
export async function runMigrations<DB>(db: Kysely<DB>, command: MigrationCommand): Promise<MigrationResultSet> {
  const migrator = new Migrator({ db, provider: migrationProvider });

  switch (command) {
    case "latest":
      return migrator.migrateToLatest();
    case "down":
      return migrator.migrateDown(); // undo only the most recent migration
    case "reset": {
      const undo = await migrator.migrateTo(NO_MIGRATIONS); // undo all, newest first
      if (undo.error) return undo;
      const redo = await migrator.migrateToLatest();
      // Report both halves, so the CLI shows "reverted ..." and then "applied ...".
      return { error: redo.error, results: [...(undo.results ?? []), ...(redo.results ?? [])] };
    }
  }
}
