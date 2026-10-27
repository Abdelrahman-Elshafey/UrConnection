import type { ErrorRequestHandler, RequestHandler } from "express";
import { isProduction } from "../config";
import { HttpError, type ErrorBody } from "../lib/errors";

/** Any request that didn't match a route ends here: JSON 404 instead of Express's HTML page. */
export const notFound: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, "not_found", `No route for ${req.method} ${req.path}`));
};

/**
 * Express recognises an error handler by its four parameters (err, req, res, next).
 * Express 5 also sends errors from async route handlers here automatically,
 * so routes can simply `throw`.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) {
    const body: ErrorBody = {
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    };
    res.status(err.status).json(body);
    return;
  }

  // Bad JSON in the request body (thrown by express.json()) is the client's fault, not a bug.
  if (err instanceof SyntaxError && "body" in err) {
    const body: ErrorBody = { error: { code: "invalid_json", message: "Request body is not valid JSON" } };
    res.status(400).json(body);
    return;
  }

  // Unexpected: log the full error (pino-http attaches req.log), but
  // SECURITY: never send stack traces or internal details to clients in production.
  req.log.error({ err }, "unhandled error");
  const message = isProduction ? "Something went wrong" : String(err instanceof Error ? err.message : err);
  const body: ErrorBody = { error: { code: "internal_error", message } };
  res.status(500).json(body);
};
