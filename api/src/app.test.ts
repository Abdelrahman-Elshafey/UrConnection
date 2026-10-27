import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import { fakeDeps } from "./test/fakes";

const ORIGIN = "http://localhost:5173"; // config.APP_ORIGIN default

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
      .set("Origin", ORIGIN) // state-changing requests must come from our own site
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
    // Caddy sends HSTS for the whole site; the API must not add a second, different one.
    expect(res.headers["strict-transport-security"]).toBeUndefined();
  });
});

describe("CSRF origin check", () => {
  it.each([
    ["no Origin header", undefined],
    ["another site", "https://evil.example"],
    ["a look-alike", "http://localhost:5173.evil.example"],
  ])("blocks a POST from %s with 403", async (_name, origin) => {
    const req = request(createApp(dbUp)).post("/api/auth/logout");
    const res = await (origin ? req.set("Origin", origin) : req);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("forbidden_origin");
  });

  it("allows a POST from our own origin", async () => {
    const res = await request(createApp(dbUp)).post("/api/auth/logout").set("Origin", ORIGIN);
    expect(res.status).toBe(204);
  });

  it("allows GET from anywhere (reading changes nothing)", async () => {
    const res = await request(createApp(dbUp)).get("/api/health").set("Origin", "https://evil.example");
    expect(res.status).toBe(200);
  });
});

describe("auth without a session", () => {
  it("GET /api/auth/me answers { user: null }, uncached", async () => {
    const res = await request(createApp(dbUp)).get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: null });
    expect(res.headers["cache-control"]).toBe("no-store");
  });

  it("PATCH /api/users/me requires a session (401)", async () => {
    const res = await request(createApp(dbUp)).patch("/api/users/me").set("Origin", ORIGIN).send({ display_name: "X" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("unauthenticated");
  });

  it("ignores a cookie that doesn't match any session", async () => {
    const res = await request(createApp(dbUp)).get("/api/auth/me").set("Cookie", "sid=made-up-token");
    expect(res.body).toEqual({ user: null });
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^sid=;/); // the bad cookie is cleared
  });
});
