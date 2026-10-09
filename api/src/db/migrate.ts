/**
 * CLI: npm run db:migrate | db:rollback | db:reset   (run from the repo root)
 *   latest  apply every migration that hasn't run yet
 *   down    undo the most recent migration
 *   reset   undo everything, then re-apply (development only: deletes all data)
 */
import { isProduction } from "../config";
import { db } from "./db";
import { runMigrations, type MigrationCommand } from "./migrator";

const command = (process.argv[2] ?? "latest") as MigrationCommand;
if (!["latest", "down", "reset"].includes(command)) {
  console.error(`Unknown command "${command}". Use: latest | down | reset`);
  process.exit(1);
}

// SECURITY / safety: never wipe a production database by accident.
if (command === "reset" && isProduction) {
  console.error("Refusing to reset the database in production.");
  process.exit(1);
}

const { error, results } = await runMigrations(db, command);

for (const r of results ?? []) {
  const icon = r.status === "Success" ? "✔" : r.status === "Error" ? "✖" : "•";
  console.log(`${icon} ${r.direction === "Up" ? "applied " : "reverted"} ${r.migrationName} (${r.status})`);
}
if (results?.length === 0) console.log("Nothing to do: the database is up to date.");

await db.destroy(); // close the connections so the process can exit

if (error) {
  console.error("Migration failed:", error);
  process.exit(1);
}
