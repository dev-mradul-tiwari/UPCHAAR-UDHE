import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { RoleSchema } from "@upchaar/types";
import type { AuthenticatedUser, JwtPayload } from "@upchaar/types";

import { env } from "../env.js";
import { ApiError } from "../utils/api-error.js";

const expiresIn = env.JWT_EXPIRES_IN as SignOptions["expiresIn"];

export function signToken(payload: JwtPayload): string {
  const claims: Record<string, string> = { role: payload.role };
  if (payload.hospitalId) claims.hospitalId = payload.hospitalId;

  return jwt.sign(claims, env.JWT_SECRET, { subject: payload.sub, expiresIn });
}

/** Verify and shape-check a bearer token. Throws `ApiError` (401) when invalid. */
export function verifyToken(token: string): AuthenticatedUser {
  let decoded: unknown;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw ApiError.unauthorized("Session expired or token is invalid");
  }

  if (typeof decoded !== "object" || decoded === null) {
    throw ApiError.unauthorized("Malformed token");
  }

  const claims = decoded as Record<string, unknown>;
  const sub = claims.sub;
  const role = RoleSchema.safeParse(claims.role);

  if (typeof sub !== "string" || sub.length === 0 || !role.success) {
    throw ApiError.unauthorized("Malformed token");
  }

  const hospitalId = claims.hospitalId;

  return {
    sub,
    role: role.data,
    ...(typeof hospitalId === "string" && hospitalId.length > 0 ? { hospitalId } : {}),
  };
}
