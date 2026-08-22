import type { Request, RequestHandler } from "express";
import type { AuthenticatedUser, Role } from "@upchaar/types";

import { verifyToken } from "../lib/jwt.js";
import { ApiError } from "../utils/api-error.js";

function bearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (typeof header !== "string") return null;
  const [scheme, value] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !value) return null;
  return value.trim() || null;
}

/**
 * `EventSource` cannot set headers, so SSE routes accept `?token=`.
 * Everything else uses the `Authorization` header.
 */
function queryToken(req: Request): string | null {
  const value = req.query.token;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function authenticate(req: Request, allowQueryToken = false): AuthenticatedUser {
  const token = bearerToken(req) ?? (allowQueryToken ? queryToken(req) : null);
  if (!token) throw ApiError.unauthorized("Missing bearer token");
  return verifyToken(token);
}

/**
 * `requireAuth()` — any authenticated caller.
 * `requireAuth("HOSPITAL", "DOCTOR")` — one of the listed roles.
 */
export function requireAuth(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    try {
      const auth = authenticate(req);
      if (roles.length > 0 && !roles.includes(auth.role)) {
        throw ApiError.forbidden("Your role cannot access this resource");
      }
      req.auth = auth;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/** Same as `requireAuth`, but also accepts `?token=` (SSE only). */
export function requireStreamAuth(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    try {
      const auth = authenticate(req, true);
      if (roles.length > 0 && !roles.includes(auth.role)) {
        throw ApiError.forbidden("Your role cannot access this stream");
      }
      req.auth = auth;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/** Read the authenticated principal without non-null assertions. */
export function getAuth(req: Request): AuthenticatedUser {
  if (!req.auth) throw ApiError.unauthorized();
  return req.auth;
}

/** The hospital a caller acts on behalf of (HOSPITAL owns it; DOCTOR belongs to it). */
export function getHospitalScope(req: Request): string {
  const auth = getAuth(req);
  if (auth.role === "HOSPITAL") return auth.sub;
  if (auth.hospitalId) return auth.hospitalId;
  throw ApiError.forbidden("No hospital is associated with this account");
}
