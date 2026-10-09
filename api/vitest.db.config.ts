import { defineConfig } from "vitest/config";

/**
 * Database tests (*.db.test.ts): real Postgres. `npm run test:db` (needs `npm run db:up`).
 * Kept separate from the fast unit tests so `npm test` never needs Docker.
 */

// Set on process.env (not in test.env below): globalSetup runs in this main process,
// and test.env only reaches the test workers. Workers inherit process.env anyway.
// CI sets TEST_DATABASE_URL itself; locally the Docker Postgres (port 5433) is used.
process.env.TEST_DATABASE_URL ??= "postgres://urconnections:urconnections_dev@localhost:5433/urconnections_test";

export default defineConfig({
  test: {
    include: ["src/**/*.db.test.ts"],
    globalSetup: ["src/db/test/globalSetup.ts"],
    fileParallelism: false, // the files share one database: run them one at a time
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgres://test:test@localhost:5432/test", // only to satisfy config.ts
    },
  },
});
