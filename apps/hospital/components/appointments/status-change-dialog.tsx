"use client";

import * as React from "react";
import type { AppointmentStatus } from "@upchaar/types";
import { CheckCircle } from "lucide-react";
import { Button } from "@upchaar/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@upchaar/ui/dropdown-menu";

interface StatusChangeDialogProps {
  appointmentId: string;
  currentStatus: AppointmentStatus;
  onStatusChange: (appointmentId: string, status: AppointmentStatus) => Promise<void>;
}

const STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function StatusChangeDialog({
  appointmentId,
  currentStatus,
  onStatusChange,
}: StatusChangeDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const availableTransitions = STATUS_TRANSITIONS[currentStatus] ?? [];

  if (availableTransitions.length === 0) return null;

  async function handleStatusChange(newStatus: AppointmentStatus) {
    setLoading(true);
    try {
      await onStatusChange(appointmentId, newStatus);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          <CheckCircle className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableTransitions.map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleStatusChange(status)}
          >
            {status}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
