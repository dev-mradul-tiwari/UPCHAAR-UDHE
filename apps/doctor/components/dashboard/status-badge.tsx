import type { AppointmentStatus } from "@upchaar/types";
import { StatusBadge as UIStatusBadge } from "@upchaar/ui/status-badge";

interface StatusBadgeProps {
  status: AppointmentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <UIStatusBadge status={status} />;
}
