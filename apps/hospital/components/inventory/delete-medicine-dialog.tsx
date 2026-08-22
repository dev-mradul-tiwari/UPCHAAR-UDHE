"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@upchaar/ui/dialog";
import { Button } from "@upchaar/ui/button";
import { toast } from "@upchaar/ui/sonner";

import { api } from "@/lib/api";

interface DeleteMedicineDialogProps {
  medicineId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DeleteMedicineDialog({
  medicineId,
  onSuccess,
  onCancel,
}: DeleteMedicineDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);

  async function handleDelete() {
    setSubmitting(true);
    try {
      await api.inventory.remove(medicineId);
      toast.success("Medicine deleted");
      onSuccess();
    } catch (error) {
      toast.error("Could not delete medicine");
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete medicine</DialogTitle>
          <DialogDescription>
            This action cannot be undone. The medicine will be permanently deleted from inventory.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3">
          <Button variant="outline" disabled={submitting} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={submitting} onClick={handleDelete}>
            {submitting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
