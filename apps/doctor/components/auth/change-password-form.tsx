"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lock, LogIn } from "lucide-react";
import { changePasswordSchema } from "@upchaar/types";
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
import { api, fieldErrorsOf, type FieldErrors } from "@/lib/api";
import { HOME_PATH } from "@/lib/session";
import { firstError, issuesToFieldErrors } from "@/lib/validation";

export function ChangePasswordForm() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [failure, setFailure] = React.useState<unknown>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailure(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: ["Passwords do not match"] });
      return;
    }

    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
    });
    if (!parsed.success) {
      setErrors(issuesToFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await api.auth.changePassword(parsed.data);
      toast.success("Password changed successfully!");
      router.replace(HOME_PATH);
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
        <CardTitle className="text-xl">Change your password</CardTitle>
        <CardDescription>
          Enter your current password and choose a new one.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
          <FormAlert error={failure} fallback="We could not change your password." />

          <FormField
            label="Current password"
            error={firstError(errors, "currentPassword")}
            required
          >
            {(field) => (
              <Input
                {...field}
                type="password"
                name="currentPassword"
                autoComplete="current-password"
                placeholder="Your current password"
                icon={<Lock />}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            )}
          </FormField>

          <FormField
            label="New password"
            error={firstError(errors, "newPassword")}
            required
          >
            {(field) => (
              <Input
                {...field}
                type="password"
                name="newPassword"
                autoComplete="new-password"
                placeholder="Enter a new password"
                icon={<Lock />}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            )}
          </FormField>

          <FormField
            label="Confirm password"
            error={firstError(errors, "confirmPassword")}
            required
          >
            {(field) => (
              <Input
                {...field}
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Confirm your new password"
                icon={<Lock />}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            )}
          </FormField>

          <Button type="submit" size="lg" block loading={submitting}>
            {submitting ? "Changing password" : "Change password"}
            {submitting ? null : <LogIn aria-hidden />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
