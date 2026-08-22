import * as React from "react";
import type { InteractionSeverity } from "@upchaar/types";
import { AlertOctagon, AlertTriangle, Info, ShieldCheck } from "lucide-react";

import { cn } from "../lib/utils";
import { Badge, type BadgeProps } from "./badge";

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

interface SeverityMeta {
  label: string;
  variant: BadgeVariant;
  icon: React.ReactNode;
  /** Plain-language explanation, safe to surface next to the badge. */
  description: string;
}

/** Drug-interaction severity presentation. SEVERE is the only coral one. */
export const INTERACTION_SEVERITY_META: Record<InteractionSeverity, SeverityMeta> = {
  NONE: {
    label: "No interaction",
    variant: "success",
    icon: <ShieldCheck aria-hidden />,
    description: "No known interaction between these medicines.",
  },
  MINOR: {
    label: "Minor",
    variant: "info",
    icon: <Info aria-hidden />,
    description: "Limited clinical significance. Usually safe to continue.",
  },
  MODERATE: {
    label: "Moderate",
    variant: "warning",
    icon: <AlertTriangle aria-hidden />,
    description: "May require monitoring or a dose adjustment.",
  },
  SEVERE: {
    label: "Severe",
    variant: "solidDestructive",
    icon: <AlertOctagon aria-hidden />,
    description: "Avoid this combination. Contact a clinician before taking both.",
  },
};

export interface SeverityBadgeProps extends Omit<BadgeProps, "variant" | "children"> {
  severity: InteractionSeverity;
  showIcon?: boolean;
}

export function SeverityBadge({
  severity,
  showIcon = true,
  className,
  ...props
}: SeverityBadgeProps) {
  const meta = INTERACTION_SEVERITY_META[severity];
  return (
    <Badge
      data-slot="severity-badge"
      data-severity={severity}
      variant={meta.variant}
      className={cn(className)}
      {...props}
    >
      {showIcon ? meta.icon : null}
      {meta.label}
    </Badge>
  );
}
