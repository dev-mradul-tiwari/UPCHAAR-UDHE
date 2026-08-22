"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, Phone, Briefcase, Edit2, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@upchaar/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@upchaar/ui/card";
import { FormField } from "@upchaar/ui/form-field";
import { Input } from "@upchaar/ui/input";
import { PageHeader } from "@upchaar/ui/page-header";
import { Skeleton } from "@upchaar/ui/skeleton";
import { toast } from "@upchaar/ui/sonner";

import { api, fieldErrorsOf, type FieldErrors } from "@/lib/api";
import { useDoctor } from "@/components/session-provider";
import { FormAlert } from "@/components/form-alert";
import { firstError } from "@/lib/validation";

export function ProfileContent() {
  const { data: doctor, isLoading: doctorLoading } = useDoctor();
  const [isEditing, setIsEditing] = React.useState(false);
  const [name, setName] = React.useState(doctor?.name ?? "");
  const [phone, setPhone] = React.useState(doctor?.phone ?? "");
  const [specialization, setSpecialization] = React.useState(doctor?.specialization ?? "");
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [failure, setFailure] = React.useState<unknown>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (doctor) {
      setName(doctor.name);
      setPhone(doctor.phone);
      setSpecialization(doctor.specialization);
    }
  }, [doctor]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailure(null);
    setSaved(false);

    setSubmitting(true);
    try {
      await api.doctors.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        specialization: specialization.trim(),
      });
      setErrors({});
      setIsEditing(false);
      setSaved(true);
      toast.success("Profile updated successfully");
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setErrors(fieldErrorsOf(error));
      setFailure(error);
      setSubmitting(false);
    }
  }

  if (doctorLoading) {
    return <ProfileLoadingSkeleton />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Profile"
        description="Your professional information"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile info */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
            <CardDescription>
              Your name, contact details and specialization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form className="space-y-5" onSubmit={handleSave} noValidate>
                <FormAlert error={failure} fallback="Failed to update profile" />

                {saved && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    <CheckCircle2 aria-hidden className="size-4" />
                    Profile updated successfully
                  </div>
                )}

                <FormField label="Full name" error={firstError(errors, "name")} required>
                  {(field) => (
                    <Input
                      {...field}
                      type="text"
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  )}
                </FormField>

                <FormField label="Phone number" error={firstError(errors, "phone")} required>
                  {(field) => (
                    <Input
                      {...field}
                      type="tel"
                      name="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  )}
                </FormField>

                <FormField
                  label="Specialization"
                  error={firstError(errors, "specialization")}
                  required
                >
                  {(field) => (
                    <Input
                      {...field}
                      type="text"
                      name="specialization"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                    />
                  )}
                </FormField>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" loading={submitting}>
                    {submitting ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setName(doctor?.name ?? "");
                      setPhone(doctor?.phone ?? "");
                      setSpecialization(doctor?.specialization ?? "");
                      setErrors({});
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full name</p>
                  <p className="text-base text-foreground">{doctor?.name}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail aria-hidden className="size-4 text-muted-foreground" />
                    <p className="text-base text-foreground">{doctor?.email}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone aria-hidden className="size-4 text-muted-foreground" />
                    <p className="text-base text-foreground">{doctor?.phone}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Specialization</p>
                  <div className="flex items-center gap-2">
                    <Briefcase aria-hidden className="size-4 text-muted-foreground" />
                    <p className="text-base text-foreground">{doctor?.specialization}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hospital</p>
                  <p className="text-base text-foreground">
                    {doctor?.hospitalName ?? "Not assigned"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Department</p>
                  <p className="text-base text-foreground">
                    {doctor?.departmentName ?? "Not assigned"}
                  </p>
                </div>

                <div className="pt-4">
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit2 aria-hidden />
                    Edit Profile
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password section */}
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your account password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use a strong password that's unique to this account.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/change-password">
                <Lock aria-hidden />
                Change Password
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
