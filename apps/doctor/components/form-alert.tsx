"use client";

import { AlertTriangle, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@upchaar/ui/alert";

import { isApiError } from "@/lib/api";

export interface FormAlertProps {
  error: unknown;
  /** Shown when the thrown value carries no message of its own. */
  fallback?: string;
}

/**
 * The non-field half of an API failure. Per-field messages are rendered by
 * the `FormField` that owns them; this covers everything else.
 */
export function FormAlert({ error, fallback = "Something went wrong" }: FormAlertProps) {
  if (error === null || error === undefined) return null;

  const offline = isApiError(error) && error.isOffline;
  const message = isApiError(error)
    ? error.message
    : error instanceof Error
      ? error.message
      : fallback;

  return (
    <Alert variant="destructive">
      {offline ? <WifiOff aria-hidden /> : <AlertTriangle aria-hidden />}
      <AlertTitle>{offline ? "Connection lost" : "That did not work"}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
