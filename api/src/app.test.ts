import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import { fakeDeps } from "./test/fakes";

// Fake dependencies: no real database is needed to test the HTTP layer.
const dbUp = fakeDeps();
const dbDown = fakeDeps({
  checkDatabase: async () => {
    throw new Error("connection refused");
  },
});

describe("GET /api/health", () => {
  it("returns 200 when the database answers", async () => {
    const res = await request(createApp(dbUp)).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, db: "up" });
  });

  it("returns 503 when the database is down", async () => {
    const res = await request(createApp(dbDown)).get("/api/health");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ ok: false, db: "down" });
  });

  it("returns a request id header", async () => {
    const res = await request(createApp(dbUp)).get("/api/health");
    expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("errors", () => {
  it("answers unknown routes with a JSON 404", async () => {
    const res = await request(createApp(dbUp)).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: "not_found", message: "No route for GET /api/nope" } });
  });

  it("answers malformed JSON with a 400", async () => {
    const res = await request(createApp(dbUp))
      .post("/api/health")
      .set("Content-Type", "application/json")
      .send("{not json");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_json");
  });
});

describe("security headers", () => {
  it("hides the framework and sets helmet headers", async () => {
    const res = await request(createApp(dbUp)).get("/api/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});
