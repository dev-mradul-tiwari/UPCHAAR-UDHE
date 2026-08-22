"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Lock, Mail, MapPin, Phone } from "lucide-react";
import { hospitalRegisterSchema, type HospitalRegisterInput } from "@upchaar/types";
import { Button } from "@upchaar/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@upchaar/ui/card";
import { FormField, FormRow } from "@upchaar/ui/form-field";
import { Input } from "@upchaar/ui/input";
import { toast } from "@upchaar/ui/sonner";

import { FormAlert } from "@/components/form-alert";
import { createSession } from "@/components/session-provider";
import { api, fieldErrorsOf, type FieldErrors } from "@/lib/api";
import { HOME_PATH } from "@/lib/session";
import { firstError, issuesToFieldErrors } from "@/lib/validation";

export function RegisterForm() {
  const router = useRouter();

  const [formData, setFormData] = React.useState<HospitalRegisterInput>({
    name: "",
    email: "",
    password: "",
    phone: "",
    type: "",
    registrationNumber: "",
    addressLine: "",
    city: "",
    state: "",
    zipcode: "",
  });
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [failure, setFailure] = React.useState<unknown>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function updateField<K extends keyof HospitalRegisterInput>(key: K, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailure(null);

    const parsed = hospitalRegisterSchema.safeParse(formData);
    if (!parsed.success) {
      setErrors(issuesToFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const session = await api.auth.register(parsed.data);
      await createSession(session.token);
      toast.success(`Welcome, ${session.hospital.name.split(" ")[0] ?? ""}`.trim());
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
        <CardTitle className="text-xl">Register your hospital</CardTitle>
        <CardDescription>
          Create an admin account to manage appointments, departments, and staff.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
          <FormAlert error={failure} fallback="We could not register your hospital." />

          <FormField label="Hospital name" error={firstError(errors, "name")} required>
            {(field) => (
              <Input
                {...field}
                type="text"
                name="name"
                placeholder="General Hospital"
                icon={<Building2 />}
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            )}
          </FormField>

          <FormField label="Email address" error={firstError(errors, "email")} required>
            {(field) => (
              <Input
                {...field}
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="admin@hospital.com"
                icon={<Mail />}
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            )}
          </FormField>

          <FormField label="Password" error={firstError(errors, "password")} required>
            {(field) => (
              <Input
                {...field}
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="Strong password"
                icon={<Lock />}
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
              />
            )}
          </FormField>

          <FormField label="Phone number" error={firstError(errors, "phone")} required>
            {(field) => (
              <Input
                {...field}
                type="tel"
                name="phone"
                autoComplete="tel"
                placeholder="+91-XXXXXXXXXX"
                icon={<Phone />}
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            )}
          </FormField>

          <FormField label="Hospital type" error={firstError(errors, "type")} required>
            {(field) => (
              <Input
                {...field}
                type="text"
                name="type"
                placeholder="Multi-specialty Hospital"
                icon={<Building2 />}
                value={formData.type}
                onChange={(e) => updateField("type", e.target.value)}
              />
            )}
          </FormField>

          <FormField
            label="Registration number"
            error={firstError(errors, "registrationNumber")}
            required
          >
            {(field) => (
              <Input
                {...field}
                type="text"
                name="registrationNumber"
                placeholder="REG-XXXX"
                value={formData.registrationNumber}
                onChange={(e) => updateField("registrationNumber", e.target.value)}
              />
            )}
          </FormField>

          <FormField
            label="Address"
            error={firstError(errors, "addressLine")}
            required
          >
            {(field) => (
              <Input
                {...field}
                type="text"
                name="addressLine"
                placeholder="123 Medical Lane"
                icon={<MapPin />}
                value={formData.addressLine}
                onChange={(e) => updateField("addressLine", e.target.value)}
              />
            )}
          </FormField>

          <FormRow>
            <FormField label="City" error={firstError(errors, "city")} required>
              {(field) => (
                <Input
                  {...field}
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              )}
            </FormField>
            <FormField label="State" error={firstError(errors, "state")} required>
              {(field) => (
                <Input
                  {...field}
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => updateField("state", e.target.value)}
                />
              )}
            </FormField>
          </FormRow>

          <FormField label="ZIP code" error={firstError(errors, "zipcode")} required>
            {(field) => (
              <Input
                {...field}
                type="text"
                name="zipcode"
                placeholder="123456"
                value={formData.zipcode}
                onChange={(e) => updateField("zipcode", e.target.value)}
              />
            )}
          </FormField>

          <Button type="submit" size="lg" block loading={submitting}>
            {submitting ? "Registering" : "Register hospital"}
            {submitting ? null : <ArrowRight aria-hidden />}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t pt-6">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="rounded font-medium text-primary-subtle-foreground underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/45 focus-visible:outline-none"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
