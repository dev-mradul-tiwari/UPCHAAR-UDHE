"use client";

import * as React from "react";
import type { Medicine, MedicineInput, MedicineUpdateInput } from "@upchaar/types";
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
import { toast } from "@upchaar/ui/sonner";

import { api, fieldErrorsOf, type FieldErrors } from "@/lib/api";
import { FormAlert } from "@/components/form-alert";
import { firstError } from "@/lib/validation";

interface MedicineDialogProps {
  children: React.ReactNode;
  medicine?: Medicine;
  onSuccess: () => void;
}

export function MedicineDialog({
  children,
  medicine,
  onSuccess,
}: MedicineDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(medicine?.name ?? "");
  const [quantity, setQuantity] = React.useState(medicine?.quantity?.toString() ?? "");
  const [threshold, setThreshold] = React.useState(medicine?.threshold?.toString() ?? "");
  const [unit, setUnit] = React.useState(medicine?.unit ?? "");
  const [expiryDate, setExpiryDate] = React.useState(
    medicine?.expiryDate
      ? new Date(medicine.expiryDate).toISOString().split("T")[0]
      : ""
  );
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [failure, setFailure] = React.useState<unknown>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFailure(null);

    setSubmitting(true);
    try {
      const expiryDateObj = expiryDate ? new Date(expiryDate) : new Date();
      if (medicine) {
        const input: MedicineUpdateInput = {
          name,
          quantity: quantity ? parseInt(quantity, 10) : 0,
          threshold: threshold ? parseInt(threshold, 10) : 0,
          unit,
          expiryDate: expiryDateObj,
        };
        await api.inventory.update(medicine.id, input);
        toast.success("Medicine updated");
      } else {
        const input: MedicineInput = {
          name,
          quantity: quantity ? parseInt(quantity, 10) : 0,
          threshold: threshold ? parseInt(threshold, 10) : 0,
          unit,
          expiryDate: expiryDateObj,
        };
        await api.inventory.create(input);
        toast.success("Medicine created");
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
          <DialogTitle>{medicine ? "Edit medicine" : "Add medicine"}</DialogTitle>
          <DialogDescription>
            {medicine ? "Update medicine details" : "Add a new medicine to inventory"}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormAlert error={failure} />

          <FormField label="Medicine name" error={firstError(errors, "name")} required>
            {(field) => (
              <Input
                {...field}
                type="text"
                name="name"
                placeholder="Aspirin"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
          </FormField>

          <FormField label="Quantity" error={firstError(errors, "quantity")} required>
            {(field) => (
              <Input
                {...field}
                type="number"
                name="quantity"
                placeholder="100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
              />
            )}
          </FormField>

          <FormField label="Threshold" error={firstError(errors, "threshold")} required>
            {(field) => (
              <Input
                {...field}
                type="number"
                name="threshold"
                placeholder="20"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                min="0"
              />
            )}
          </FormField>

          <FormField label="Unit" error={firstError(errors, "unit")} required>
            {(field) => (
              <Input
                {...field}
                type="text"
                name="unit"
                placeholder="mg / tablet / ml"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            )}
          </FormField>

          <FormField label="Expiry date" error={firstError(errors, "expiryDate")} required>
            {() => (
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground placeholder-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 disabled:cursor-not-allowed disabled:opacity-50"
              />
            )}
          </FormField>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {medicine ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
