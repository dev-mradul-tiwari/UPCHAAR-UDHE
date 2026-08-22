import * as React from "react";
import type { AppointmentStatus } from "@upchaar/types";
import { Ban, CheckCircle2, CircleDot, Clock, Stethoscope } from "lucide-react";

import { cn } from "../lib/utils";
import { Badge, type BadgeProps } from "./badge";

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

interface StatusMeta {
  label: string;
  variant: BadgeVariant;
  icon: React.ReactNode;
}

/** Single source of truth for how an appointment status is presented. */
export const APPOINTMENT_STATUS_META: Record<AppointmentStatus, StatusMeta> = {
  PENDING: { label: "Pending", variant: "warning", icon: <Clock aria-hidden /> },
  CONFIRMED: { label: "Confirmed", variant: "info", icon: <CheckCircle2 aria-hidden /> },
  IN_PROGRESS: {
    label: "In progress",
    variant: "primary",
    icon: <Stethoscope aria-hidden />,
  },
  COMPLETED: { label: "Completed", variant: "success", icon: <CircleDot aria-hidden /> },
  CANCELLED: { label: "Cancelled", variant: "destructive", icon: <Ban aria-hidden /> },
};

export interface StatusBadgeProps extends Omit<BadgeProps, "variant" | "children"> {
  status: AppointmentStatus;
  /** Hide the leading glyph in dense tables. */
  showIcon?: boolean;
}

export function StatusBadge({
  status,
  showIcon = true,
  className,
  ...props
}: StatusBadgeProps) {
  const meta = APPOINTMENT_STATUS_META[status];
  return (
    <Badge
      data-slot="status-badge"
      data-status={status}
      variant={meta.variant}
      className={cn(className)}
      {...props}
    >
      {showIcon ? meta.icon : null}
      {meta.label}
    </Badge>
  );
}
