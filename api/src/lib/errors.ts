/**
 * An error we throw on purpose, with the HTTP status the client should get.
 * Example: `throw new HttpError(404, "not_found", "Group not found")`.
 * Anything else that is thrown is treated as an unexpected bug (500).
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** The single JSON shape every error response uses: { error: { code, message } }. */
export interface ErrorBody {
  error: { code: string; message: string };
}
