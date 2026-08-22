"use client";

import * as React from "react";
import type { Doctor, DoctorCreateInput, DoctorUpdateInput } from "@upchaar/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@upchaar/ui/dialog";
import { Button } from "@upchaar/ui/button";
import { FormField } from "@upchaar/ui/form-field";
import { Input } from "@upchaar/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@upchaar/ui/select";
import { Switch } from "@upchaar/ui/switch";
import { toast } from "@upchaar/ui/sonner";
import { useQuery } from "@tanstack/react-query";

import { api, fieldErrorsOf, type FieldErrors } from "@/lib/api";
import { FormAlert } from "@/components/form-alert";
import { firstError } from "@/lib/validation";

interface DoctorDialogProps {
  children: React.ReactNode;
  doctor?: Doctor;
  onSuccess: () => void;
  onTempPassword: (password: string) => void;
  hospitalId?: string;
}

export function DoctorDialog({
  children,
  doctor,
  onSuccess,
  onTempPassword,
  hospitalId,
}: DoctorDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(doctor?.name ?? "");
  const [email, setEmail] = React.useState(doctor?.email ?? "");
  const [phone, setPhone] = React.useState(doctor?.phone ?? "");
  const [specialization, setSpecialization] = React.useState(doctor?.specialization ?? "");
  const [experienceYears, setExperienceYears] = React.useState(
    doctor?.experienceYears?.toString() ?? ""
  );
  const [departmentId, setDepartmentId] = React.useState(doctor?.departmentId ?? "");
  const [isAvailable, setIsAvailable] = React.useState(doctor?.isAvailable ?? true);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [failure, setFailure] = React.useState<unknown>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const deptQuery = useQuery({
    queryKey: ["departments", hospitalId],
    queryFn: () => (hospitalId ? api.departments.list(hospitalId) : []),
    enabled: !!hospitalId,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFailure(null);

    setSubmitting(true);
    try {
      if (doctor) {
        const input: DoctorUpdateInput = {
          name,
          phone,
          specialization,
          experienceYears: experienceYears ? parseInt(experienceYears, 10) : 0,
          isAvailable,
          departmentId: departmentId || undefined,
        };
        await api.doctors.update(doctor.id, input);
        toast.success("Doctor updated");
      } else {
        const input: DoctorCreateInput = {
          name,
          email,
          phone,
          specialization,
          experienceYears: experienceYears ? parseInt(experienceYears, 10) : 0,
          departmentId: departmentId || undefined,
        };
        const result = await api.doctors.create(input);
        toast.success("Doctor created");
        onTempPassword(result.tempPassword);
      }
      setOpen(false);
      onSuccess();
    } catch (error) {
      setErrors(fieldErrorsOf(error));
      setFailure(error);
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{doctor ? "Edit doctor" : "Add doctor"}</DialogTitle>
          <DialogDescription>
            {doctor ? "Update doctor details" : "Add a new doctor to your hospital"}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormAlert error={failure} />

          <FormField label="Full name" error={firstError(errors, "name")} required>
            {(field) => (
              <Input
                {...field}
                type="text"
                name="name"
                placeholder="Dr. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
          </FormField>

          {!doctor && (
            <FormField label="Email" error={firstError(errors, "email")} required>
              {(field) => (
                <Input
                  {...field}
                  type="email"
                  name="email"
                  placeholder="doctor@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </FormField>
          )}

          <FormField label="Phone" error={firstError(errors, "phone")} required>
            {(field) => (
              <Input
                {...field}
                type="tel"
                name="phone"
                placeholder="+91-XXXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            )}
          </FormField>

          <FormField label="Specialization" error={firstError(errors, "specialization")} required>
            {(field) => (
              <Input
                {...field}
                type="text"
                name="specialization"
                placeholder="Cardiology"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
              />
            )}
          </FormField>

          <FormField
            label="Experience (years)"
            error={firstError(errors, "experienceYears")}
            required
          >
            {(field) => (
              <Input
                {...field}
                type="number"
                name="experienceYears"
                placeholder="5"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
              />
            )}
          </FormField>

          <FormField label="Department" error={firstError(errors, "departmentId")}>
            {(field) => (
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger {...field}>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {deptQuery.data?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>

          {doctor && (
            <FormField label="Available" error={firstError(errors, "isAvailable")}>
              {(field) => (
                <div className="flex items-center gap-2">
                  <Switch
                    {...field}
                    checked={isAvailable}
                    onCheckedChange={setIsAvailable}
                  />
                  <span className="text-sm text-muted-foreground">
                    {isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
              )}
            </FormField>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {doctor ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
