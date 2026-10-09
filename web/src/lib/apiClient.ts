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

/**
 * GET from our own API and validate the JSON with a shared zod schema.
 * Paths are relative ("/api/..."): in development Vite forwards them to the API,
 * in production Caddy does. Same origin, so no CORS, and cookies are sent automatically.
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

  // Error bodies use one shape; fall back gracefully if the body isn't JSON (e.g. proxy down).
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
    throw new ApiError(
      res.status,
      body?.error?.code ?? "http_error",
      body?.error?.message ?? `Request failed (${res.status})`,
    );
  }

  return schema.parse(await res.json());
}
