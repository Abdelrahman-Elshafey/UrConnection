import type { z } from "zod";

/** An error response from our API: { error: { code, message, details? } }. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type QueryValue = string | number | undefined | null;

/** Builds "/api/x?a=1&b=2", leaving out empty values (so "no filter" is just absent). */
function buildUrl(path: string, params?: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Throws ApiError for any non-2xx response, using the API's { error: { code, message } } body. */
async function throwIfError(res: Response): Promise<void> {
  if (res.ok) return;
  // Fall back gracefully if the body isn't JSON (e.g. the dev proxy can't reach the API).
  const body = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
  throw new ApiError(
    res.status,
    body?.error?.code ?? "http_error",
    body?.error?.message ?? `Request failed (${res.status})`,
  );
}

/**
 * GET from our own API and validate the JSON with a shared zod schema.
 * Paths are relative ("/api/..."): in development Vite forwards them to the API,
 * in production Caddy does. Same origin, so no CORS, and the session cookie is
 * sent automatically.
 *
 * Validating our own API's responses catches a mismatch between the two sides
 * immediately, with a clear message, instead of as a confusing "undefined" in the UI.
 */
export async function apiGet<S extends z.ZodType>(
  path: string,
  schema: S,
  params?: Record<string, QueryValue>,
): Promise<z.output<S>> {
  const res = await fetch(buildUrl(path, params), {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  await throwIfError(res);
  return schema.parse(await res.json());
}

type Method = "POST" | "PATCH" | "DELETE";

function send(method: Method, path: string, body?: unknown): Promise<Response> {
  return fetch(path, {
    method,
    headers: { Accept: "application/json", ...(body !== undefined && { "Content-Type": "application/json" }) },
    credentials: "same-origin",
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
}

/**
 * POST / PATCH / DELETE with an optional JSON body, validating the JSON response.
 * The browser adds the Origin header itself, which the API's CSRF check requires.
 */
export async function apiSend<S extends z.ZodType>(method: Method, path: string, schema: S, body?: unknown): Promise<z.output<S>> {
  const res = await send(method, path, body);
  await throwIfError(res);
  return schema.parse(await res.json());
}

/** Same, for endpoints that answer "204 No Content" (e.g. logout). */
export async function apiSendNoContent(method: Method, path: string, body?: unknown): Promise<void> {
  const res = await send(method, path, body);
  await throwIfError(res);
}
