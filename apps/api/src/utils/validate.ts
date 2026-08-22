import type { Request } from "express";
import type { z } from "zod";

/**
 * Parse with a schema from `@upchaar/types`. ZodError propagates to the
 * central error handler, which maps it to a 400 with field errors.
 */
export function parseBody<S extends z.ZodTypeAny>(schema: S, req: Request): z.infer<S> {
  return schema.parse(req.body) as z.infer<S>;
}

export function parseQuery<S extends z.ZodTypeAny>(schema: S, req: Request): z.infer<S> {
  return schema.parse(req.query) as z.infer<S>;
}

/**
 * Express 5 types route params as `string | undefined` under
 * `noUncheckedIndexedAccess`; this narrows once, loudly.
 */
export function requiredParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Route parameter "${name}" is missing`);
  }
  return value;
}
