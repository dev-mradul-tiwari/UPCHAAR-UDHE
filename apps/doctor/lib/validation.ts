import type { ZodError } from "zod";

import type { FieldErrors } from "./api";

/**
 * Zod issues → the same `{ "field.path": ["message"] }` map the API returns on
 * a 400, so client-side and server-side validation render identically.
 */
export function issuesToFieldErrors(error: ZodError<unknown>): FieldErrors {
  const collected: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.map((segment: unknown) => String(segment)).join(".") || "form";
    const existing = collected[key];
    if (existing === undefined) collected[key] = [issue.message];
    else existing.push(issue.message);
  }
  return collected;
}

/** First message for a field, ready to hand to `<FormField error=…>`. */
export function firstError(errors: FieldErrors, path: string): string | undefined {
  return errors[path]?.[0];
}
