"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";

import { cn } from "../lib/utils";
import { Label } from "./label";

/** Props a `FormField` hands to the control it wraps. */
export interface FormControlProps {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
}

export interface FormFieldProps extends Omit<React.ComponentProps<"div">, "children"> {
  label: React.ReactNode;
  /** Helper copy shown under the control when there is no error. */
  description?: React.ReactNode;
  /** Validation message. Its presence marks the control invalid. */
  error?: React.ReactNode;
  required?: boolean;
  /** Force a specific control id instead of a generated one. */
  htmlFor?: string;
  /**
   * Either a plain node, or a function receiving the wiring props
   * (`id`, `aria-describedby`, `aria-invalid`) to spread on your control.
   */
  children: React.ReactNode | ((field: FormControlProps) => React.ReactNode);
}

/**
 * Label + control + description + error, with `aria-describedby` and
 * `aria-invalid` wired up automatically.
 *
 * ```tsx
 * <FormField label="Email" error={errors.email?.message} required>
 *   {(field) => <Input {...field} {...register("email")} />}
 * </FormField>
 * ```
 */
export function FormField({
  label,
  description,
  error,
  required,
  htmlFor,
  className,
  children,
  ...props
}: FormFieldProps) {
  const generatedId = React.useId();
  const id = htmlFor ?? `${generatedId}-control`;
  const descriptionId = `${generatedId}-description`;
  const errorId = `${generatedId}-error`;

  const describedBy =
    [error ? errorId : null, description ? descriptionId : null]
      .filter((value): value is string => value !== null)
      .join(" ") || undefined;

  const field: FormControlProps = {
    id,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
  };

  return (
    <div
      data-slot="form-field"
      data-invalid={error ? "true" : undefined}
      className={cn("grid w-full gap-2", className)}
      {...props}
    >
      <Label htmlFor={id} required={required}>
        {label}
      </Label>

      {typeof children === "function" ? children(field) : children}

      {description && !error ? (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-sm font-medium text-destructive-subtle-foreground"
        >
          <AlertCircle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

/** A row of fields that collapses to one column on small screens. */
export function FormRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-row"
      className={cn("grid gap-4 sm:grid-cols-2", className)}
      {...props}
    />
  );
}
