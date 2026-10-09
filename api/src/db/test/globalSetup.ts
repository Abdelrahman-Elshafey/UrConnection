import pg from "pg";

/**
 * Runs once before the database tests: makes sure the test database exists.
 * Locally it's created inside the Docker Postgres. In CI the Postgres service
 * already creates it (POSTGRES_DB), so this is a no-op there.
 */
export default async function globalSetup(): Promise<void> {
  const url = new URL(process.env.TEST_DATABASE_URL!);
  const dbName = url.pathname.slice(1);

  // SECURITY / safety: these tests wipe tables, so refuse anything not clearly a test database.
  if (!dbName.endsWith("_test")) {
    throw new Error(`TEST_DATABASE_URL must point to a database ending in "_test" (got "${dbName}")`);
  }

  // Connect to the built-in "postgres" maintenance database to create ours.
  const adminUrl = new URL(url);
  adminUrl.pathname = "/postgres";
  const client = new pg.Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    const { rowCount } = await client.query("select 1 from pg_database where datname = $1", [dbName]);
    if (rowCount === 0) {
      // Identifiers can't be query parameters, so quote the (validated) name ourselves.
      await client.query(`create database "${dbName.replaceAll('"', '""')}"`);
    }
  } finally {
    await client.end();
  }
}
