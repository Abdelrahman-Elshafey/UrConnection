import type { z } from "zod";
import { HttpError } from "./errors";

/**
 * Validates untrusted input (query string, body, URL params) with a zod schema.
 * Returns the parsed, typed value, or throws a 400 listing every problem.
 * SECURITY: everything from the client is untrusted; validate before using it.
 */
export function parseOrThrow<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
    throw new HttpError(400, "invalid_request", "The request is invalid", details);
  }
  return result.data;
}
