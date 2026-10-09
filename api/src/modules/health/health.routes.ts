import { Router } from "express";

export interface HealthDeps {
  /** Resolves if the database answers, rejects otherwise. */
  checkDatabase: () => Promise<void>;
}

/**
 * GET /api/health: is the API up, and can it reach the database?
 * Used by Docker health checks, uptime monitors and the CI smoke test.
 * The database check is passed in ("dependency injection") so tests can fake it.
 */
export function healthRouter({ checkDatabase }: HealthDeps): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    try {
      await checkDatabase();
      res.json({ ok: true, db: "up" });
    } catch {
      // 503 Service Unavailable: the API runs, but can't do useful work without the DB.
      res.status(503).json({ ok: false, db: "down" });
    }
  });

  return router;
}
