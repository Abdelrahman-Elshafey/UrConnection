import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Database tests have their own config (vitest.db.config.ts) because they need Postgres.
    exclude: [...configDefaults.exclude, "src/**/*.db.test.ts"],
    // config.ts validates the environment on import, so tests provide a valid one.
    // The URL is never connected to: tests inject a fake database check.
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
      S3_ACCESS_KEY_ID: "test", // never used: tests inject a fake storage
      S3_SECRET_ACCESS_KEY: "test",
    },
  },
});
