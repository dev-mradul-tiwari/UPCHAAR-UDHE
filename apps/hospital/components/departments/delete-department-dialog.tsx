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

interface DeleteDepartmentDialogProps {
  departmentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DeleteDepartmentDialog({
  departmentId,
  onSuccess,
  onCancel,
}: DeleteDepartmentDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);

  async function handleDelete() {
    setSubmitting(true);
    try {
      await api.departments.remove(departmentId);
      toast.success("Department deleted");
      onSuccess();
    } catch (error) {
      toast.error("Could not delete department");
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete department</DialogTitle>
          <DialogDescription>
            This action cannot be undone. The department will be permanently deleted.
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
