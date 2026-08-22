"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { Button } from "@upchaar/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@upchaar/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@upchaar/ui/select";
import { toast } from "@upchaar/ui/sonner";

import { api } from "@/lib/api";

interface AssignDoctorDialogProps {
  appointmentId: string;
  currentDoctorId?: string;
  departmentId: string;
}

export function AssignDoctorDialog({
  appointmentId,
  currentDoctorId,
  departmentId,
}: AssignDoctorDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = React.useState(currentDoctorId ?? "");
  const [submitting, setSubmitting] = React.useState(false);

  const doctorQuery = useQuery({
    queryKey: ["doctors", departmentId],
    queryFn: () => (departmentId ? api.doctors.list("", departmentId) : []),
    enabled: open,
  });

  async function handleAssign() {
    if (!selectedDoctorId) return;
    setSubmitting(true);
    try {
      await api.appointments.assignDoctor(appointmentId, selectedDoctorId);
      toast.success("Doctor assigned");
      setOpen(false);
    } catch (error) {
      toast.error("Could not assign doctor");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign doctor</DialogTitle>
          <DialogDescription>Select a doctor for this appointment</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
            <SelectTrigger>
              <SelectValue placeholder="Select doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctorQuery.data?.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={submitting} onClick={handleAssign} disabled={!selectedDoctorId}>
              Assign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
