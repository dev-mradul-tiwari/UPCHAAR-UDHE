import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import type { ApiResponse } from "@upchaar/types";

import { env } from "../env.js";
import { Prisma } from "../lib/db.js";
import { ApiError } from "../utils/api-error.js";
import { logger } from "../utils/logger.js";

type ErrorBody = ApiResponse<null> & {
  /** Present only for validation failures: `{ field: ["message"] }`. */
  errors?: Record<string, string[]>;
};

function fieldErrors(error: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_";
    const bucket = out[key];
    if (bucket) bucket.push(issue.message);
    else out[key] = [issue.message];
  }
  return out;
}

function prismaTarget(error: Prisma.PrismaClientKnownRequestError): string | null {
  const target = error.meta?.target;
  if (Array.isArray(target)) {
    const fields = target.filter((value): value is string => typeof value === "string");
    return fields.length > 0 ? fields.join(", ") : null;
  }
  return typeof target === "string" ? target : null;
}

/** 404 for unmatched routes — same envelope as every other response. */
export const notFoundHandler: RequestHandler = (req, res) => {
  const body: ErrorBody = {
    success: false,
    message: `Route ${req.method} ${req.originalUrl} does not exist`,
    data: null,
  };
  res.status(404).json(body);
};

/**
 * Central error handler.
 * ZodError → 400 · ApiError → its status · P2002 → 409 · P2025 → 404 · else 500.
 */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (res.headersSent) {
    // Streaming responses (SSE / AI chat) cannot be re-enveloped — just close.
    logger.error("Error after response started", {
      path: req.originalUrl,
      error: error instanceof Error ? error : String(error),
    });
    res.end();
    return;
  }

  let status = 500;
  let message = "Something went wrong";
  const body: ErrorBody = { success: false, message, data: null };

  if (error instanceof ZodError) {
    status = 400;
    message = "Validation failed";
    body.errors = fieldErrors(error);
  } else if (error instanceof ApiError) {
    status = error.status;
    message = error.message;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = prismaTarget(error);
      status = 409;
      message = target ? `${target} is already in use` : "That record already exists";
    } else if (error.code === "P2025") {
      status = 404;
      message = "Resource not found";
    } else if (error.code === "P2003") {
      status = 409;
      message = "Related record is missing or still in use";
    } else {
      status = 400;
      message = "The database rejected this request";
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    status = 400;
    message = "The database rejected this request";
  } else if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  ) {
    // http-errors thrown by body parsers (malformed JSON, payload too large).
    const httpError = error as { status: number; message?: string };
    status = httpError.status;
    message =
      status === 413 ? "Request body is too large" : (httpError.message ?? "Invalid request");
  }

  body.message = message;

  const meta = {
    path: req.originalUrl,
    method: req.method,
    status,
    error: error instanceof Error ? error : String(error),
  };
  // An ApiError is a deliberate outcome (even a 503) — only unexpected
  // failures deserve an error-level line with a stack.
  if (status >= 500 && !(error instanceof ApiError)) logger.error("Request failed", meta);
  else logger.warn("Request rejected", meta);

  if (status >= 500 && env.isProduction) body.message = "Something went wrong";

  res.status(status).json(body);
};
