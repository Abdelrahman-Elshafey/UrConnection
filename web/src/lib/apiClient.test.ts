import { z } from "zod";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiGet, NetworkError } from "./apiClient";

const anything = z.unknown();

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiClient errors", () => {
  // The web says "Can't connect" only for NetworkError, so a bug (also a TypeError) can't pose as one.
  it("turns a failed connection into NetworkError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(apiGet("/api/x", anything)).rejects.toBeInstanceOf(NetworkError);
  });

  it("lets a cancelled request through unchanged", async () => {
    const abort = new DOMException("The operation was aborted.", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abort));
    await expect(apiGet("/api/x", anything)).rejects.toBe(abort);
  });

  it("keeps the well-formed details of an error response", async () => {
    const details = [{ path: "city", message: "Please choose a city from the list" }, { path: 1 }, "junk"];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(400, { error: { code: "invalid_request", message: "The request is invalid", details } })));

    const error = await apiGet("/api/x", anything).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: "invalid_request", details: [{ path: "city", message: "Please choose a city from the list" }] });
  });

  it("has no details when the response has none (or isn't JSON)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Bad Gateway", { status: 502 })));
    await expect(apiGet("/api/x", anything)).rejects.toMatchObject({ code: "http_error", details: [] });
  });
});
