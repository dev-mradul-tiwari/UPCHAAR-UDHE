"use client";

import * as React from "react";
import type { Department, DepartmentInput } from "@upchaar/types";
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
import { Textarea } from "@upchaar/ui/textarea";
import { toast } from "@upchaar/ui/sonner";

import { api, fieldErrorsOf, type FieldErrors } from "@/lib/api";
import { FormAlert } from "@/components/form-alert";
import { firstError } from "@/lib/validation";

interface DepartmentDialogProps {
  children: React.ReactNode;
  department?: Department;
  onSuccess: () => void;
  hospitals?: unknown[];
}

export function DepartmentDialog({
  children,
  department,
  onSuccess,
  hospitals: _hospitals,
}: DepartmentDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(department?.name ?? "");
  const [description, setDescription] = React.useState(department?.description ?? "");
  const [avgConsultMinutes, setAvgConsultMinutes] = React.useState(
    department?.avgConsultMinutes?.toString() ?? ""
  );
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [failure, setFailure] = React.useState<unknown>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFailure(null);

    const avgConsult = avgConsultMinutes ? parseInt(avgConsultMinutes, 10) : undefined;
    const input: DepartmentInput = {
      name,
      description: description || undefined,
      avgConsultMinutes: avgConsult ?? 15,
    };

    setSubmitting(true);
    try {
      if (department) {
        await api.departments.update(department.id, input);
        toast.success("Department updated");
      } else {
        await api.departments.create(input);
        toast.success("Department created");
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{department ? "Edit department" : "Add department"}</DialogTitle>
          <DialogDescription>
            {department ? "Update department details" : "Create a new department"}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormAlert error={failure} />

          <FormField label="Department name" error={firstError(errors, "name")} required>
            {(field) => (
              <Input
                {...field}
                type="text"
                name="name"
                placeholder="Cardiology"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
          </FormField>

          <FormField label="Description" error={firstError(errors, "description")}>
            {(field) => (
              <Textarea
                {...field}
                name="description"
                placeholder="Department description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            )}
          </FormField>

          <FormField
            label="Avg consultation time (minutes)"
            error={firstError(errors, "avgConsultMinutes")}
          >
            {(field) => (
              <Input
                {...field}
                type="number"
                name="avgConsultMinutes"
                placeholder="30"
                value={avgConsultMinutes}
                onChange={(e) => setAvgConsultMinutes(e.target.value)}
              />
            )}
          </FormField>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {department ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
