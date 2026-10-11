import type { User } from "@urconnections/shared";

// "Declaration merging": adds our own fields to Express's Request type, so every
// route sees `req.user` with the right type. Filled in by loadSession().
declare global {
  namespace Express {
    interface Request {
      /** The signed-in user, if the request carried a valid session cookie. */
      user?: User;
      /** sha256 of the session token from the cookie (for logout / renewal). */
      sessionIdHash?: string;
    }
  }
}

export {};
