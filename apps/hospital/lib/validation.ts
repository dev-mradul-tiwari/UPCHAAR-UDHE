export type FieldErrors = Record<string, string[]>;

export function issuesToFieldErrors(
  error: { issues: Array<{ path: unknown[]; message: string }> }
): FieldErrors {
  const collected: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.map((segment: unknown) => String(segment)).join(".") || "form";
    const existing = collected[key];
    if (existing === undefined) collected[key] = [issue.message];
    else existing.push(issue.message);
  }
  return collected;
}

export function firstError(errors: FieldErrors, path: string): string | undefined {
  return errors[path]?.[0];
}
