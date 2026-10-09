import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // config.ts validates the environment on import, so tests provide a valid one.
    // The URL is never connected to: tests inject a fake database check.
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
    },
  },
});
