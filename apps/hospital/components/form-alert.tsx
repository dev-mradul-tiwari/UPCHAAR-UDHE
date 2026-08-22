import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@upchaar/ui/alert";

import { errorMessage } from "@/lib/api";

export interface FormAlertProps {
  error: unknown;
  fallback?: string;
}

export function FormAlert({ error, fallback }: FormAlertProps) {
  if (!error) return null;

  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertDescription>{errorMessage(error, fallback)}</AlertDescription>
    </Alert>
  );
}
