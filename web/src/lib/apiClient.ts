import type { z } from "zod";

/** One problem the API found in a request, e.g. { path: "city", message: "Please choose a city from the list" }. */
export interface ApiErrorDetail {
  path: string;
  message: string;
}

/** An error response from our API: { error: { code, message, details? } }. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    /** Per-field problems of an "invalid_request" (empty for other errors). */
    public readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * The request never got an answer (offline, DNS failure, server unreachable). fetch() reports
 * that as a plain TypeError, the same class as an ordinary bug in our code ("cannot read
 * properties of undefined"), so we give it its own class: only this one means "no connection".
 */
export class NetworkError extends Error {
  constructor(options?: ErrorOptions) {
    super("Network request failed", options);
    this.name = "NetworkError";
  }
}

/** fetch(), but a failed connection throws NetworkError (see above). */
async function request(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(path, init);
  } catch (error) {
    // fetch() only rejects when there is no response at all; an AbortError (a cancelled
    // request) is not a connection problem, so it passes through unchanged.
    throw error instanceof TypeError ? new NetworkError({ cause: error }) : error;
  }
}

/** Keeps the well-formed entries of an error body's `details` (it's untyped JSON). */
function parseDetails(details: unknown): ApiErrorDetail[] {
  if (!Array.isArray(details)) return [];
  return details.filter(
    (d): d is ApiErrorDetail => typeof d === "object" && d !== null && typeof d.path === "string" && typeof d.message === "string",
  );
}

/** True for the API's 404: the thing really doesn't exist (or isn't yours, for writes). */
export const isNotFound = (error: unknown): boolean => error instanceof ApiError && error.status === 404;

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
  const body = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string; details?: unknown } } | null;
  throw new ApiError(
    res.status,
    body?.error?.code ?? "http_error",
    body?.error?.message ?? `Request failed (${res.status})`,
    parseDetails(body?.error?.details),
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
  const res = await request(buildUrl(path, params), {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  await throwIfError(res);
  return schema.parse(await res.json());
}

type Method = "POST" | "PUT" | "PATCH" | "DELETE";

function send(method: Method, path: string, body?: unknown): Promise<Response> {
  // FormData (file uploads) is sent as multipart/form-data. Its Content-Type header must
  // include a random "boundary" that separates the parts, so the browser has to set it:
  // never set Content-Type yourself for FormData. Everything else is sent as JSON.
  const isForm = body instanceof FormData;
  return request(path, {
    method,
    headers: { Accept: "application/json", ...(body !== undefined && !isForm && { "Content-Type": "application/json" }) },
    credentials: "same-origin",
    ...(body !== undefined && { body: isForm ? body : JSON.stringify(body) }),
  });
}

/**
 * POST / PUT / PATCH / DELETE with an optional body (JSON, or FormData for file uploads),
 * validating the JSON response.
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
