"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Lock, Mail } from "lucide-react";
import { loginSchema } from "@upchaar/types";
import { Button } from "@upchaar/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@upchaar/ui/card";
import { FormField } from "@upchaar/ui/form-field";
import { Input } from "@upchaar/ui/input";
import { toast } from "@upchaar/ui/sonner";

import { FormAlert } from "@/components/form-alert";
import { createSession } from "@/components/session-provider";
import { api, fieldErrorsOf, type FieldErrors } from "@/lib/api";
import { HOME_PATH } from "@/lib/session";
import { firstError, issuesToFieldErrors } from "@/lib/validation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [failure, setFailure] = React.useState<unknown>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailure(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(issuesToFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const session = await api.auth.login(parsed.data);
      await createSession(session.token);
      toast.success(`Welcome, ${session.doctor.name.split(" ")[0] ?? ""}`.trim());

      // Check if doctor must change password
      if (session.doctor.mustChangePassword) {
        router.replace("/change-password");
      } else {
        router.replace(nextPath !== null && nextPath.startsWith("/") ? nextPath : HOME_PATH);
      }
      router.refresh();
    } catch (error) {
      setErrors(fieldErrorsOf(error));
      setFailure(error);
      setSubmitting(false);
    }
  }

  return (
    <Card className="shadow-soft">
      <CardHeader className="gap-2">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to manage your queue and appointments.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
          <FormAlert error={failure} fallback="We could not sign you in." />

          <FormField label="Email address" error={firstError(errors, "email")} required>
            {(field) => (
              <Input
                {...field}
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                icon={<Mail />}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            )}
          </FormField>

          <FormField label="Password" error={firstError(errors, "password")} required>
            {(field) => (
              <Input
                {...field}
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Your password"
                icon={<Lock />}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            )}
          </FormField>

          <Button type="submit" size="lg" block loading={submitting}>
            {submitting ? "Signing you in" : "Sign in"}
            {submitting ? null : <LogIn aria-hidden />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
