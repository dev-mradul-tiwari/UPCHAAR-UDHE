import type { AuthenticatedUser } from "@upchaar/types";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Populated by `requireAuth()` — never trust it without the middleware. */
      auth?: AuthenticatedUser;
      /** Correlation id assigned by the request logger. */
      requestId?: string;
    }
  }
}

export {};
