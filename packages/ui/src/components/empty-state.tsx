import * as React from "react";
import { Inbox } from "lucide-react";

import { cn } from "../lib/utils";

export interface EmptyStateProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** Defaults to an inbox glyph. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Primary call to action — usually a `<Button>`. */
  action?: React.ReactNode;
  /** `plain` drops the dashed border, for use inside an existing card. */
  variant?: "bordered" | "plain";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "bordered",
  className,
  children,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        variant === "bordered"
          ? "rounded-xl border border-dashed border-border bg-card"
          : null,
        className,
      )}
      {...props}
    >
      <div
        aria-hidden
        className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5"
      >
        {icon ?? <Inbox />}
      </div>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="text-sm text-balance text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1 flex items-center gap-2">{action}</div> : null}
      {children}
    </div>
  );
}
