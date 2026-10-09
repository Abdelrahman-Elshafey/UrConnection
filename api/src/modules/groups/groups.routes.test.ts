import type { GroupListQuery } from "@urconnections/shared";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app";
import { fakeDeps, sampleGroup } from "../../test/fakes";

/**
 * HTTP-layer tests with a fake repository: validation, status codes, response shape.
 * The real SQL (filters, pagination) is tested in groups.db.test.ts.
 */

/** Builds an app whose repository records the query it received. */
function appRecordingQuery() {
  const calls: GroupListQuery[] = [];
  const base = fakeDeps();
  const app = createApp({
    ...base,
    groups: {
      ...base.groups,
      list: async (query) => {
        calls.push(query);
        return { items: [], nextCursor: null };
      },
    },
  });
  return { app, calls };
}

describe("GET /api/groups", () => {
  it("returns a page of groups", async () => {
    const res = await request(createApp(fakeDeps())).get("/api/groups");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [sampleGroup()], nextCursor: null });
  });

  it("passes parsed, typed filters to the repository (limit defaults to 24)", async () => {
    const { app, calls } = appRecordingQuery();
    await request(app).get("/api/groups").query({ topic: "Math", country: "Egypt", query: "  calc  " });
    expect(calls[0]).toEqual({ topic: "Math", country: "Egypt", query: "calc", limit: 24 });
  });

  it("coerces limit from text to a number", async () => {
    const { app, calls } = appRecordingQuery();
    await request(app).get("/api/groups?limit=5");
    expect(calls[0]?.limit).toBe(5);
  });

  it.each([
    ["unknown topic", "topic=Cooking", "topic"],
    ["unknown platform", "platform=myspace", "platform"],
    ["limit too big", "limit=51", "limit"],
    ["limit not a number", "limit=abc", "limit"],
    ["cursor not a uuid", "cursor=123", "cursor"],
    ["repeated parameter", "topic=Math&topic=Art", "topic"],
  ])("rejects %s with 400 and says which field", async (_name, qs, field) => {
    const { app, calls } = appRecordingQuery();
    const res = await request(app).get(`/api/groups?${qs}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_request");
    expect(res.body.error.details.map((d: { path: string }) => d.path)).toContain(field);
    expect(calls).toHaveLength(0); // the repository is never reached with bad input
  });
});

describe("GET /api/groups/:id", () => {
  it("returns the group", async () => {
    const res = await request(createApp(fakeDeps())).get(`/api/groups/${sampleGroup().id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(sampleGroup());
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(createApp(fakeDeps())).get("/api/groups/01a1216e-ee83-7d76-bab2-000000000000");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
  });

  it("returns 404 (not 500) for something that isn't a uuid", async () => {
    const res = await request(createApp(fakeDeps())).get("/api/groups/not-a-uuid");
    expect(res.status).toBe(404);
  });
});
