import * as React from "react";

import { cn } from "../lib/utils";

export interface PageHeaderProps extends Omit<React.ComponentProps<"header">, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small line above the title — breadcrumbs, a back link, or a section name. */
  eyebrow?: React.ReactNode;
  /** Buttons or filters aligned to the right. */
  actions?: React.ReactNode;
  /** Renders the title as an `<h1>` (default) or an `<h2>` for sub-pages. */
  as?: "h1" | "h2";
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  as = "h1",
  className,
  children,
  ...props
}: PageHeaderProps) {
  const Heading = as;
  return (
    <header
      data-slot="page-header"
      className={cn(
        "flex flex-col gap-4 pb-6 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow ? (
          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {eyebrow}
          </div>
        ) : null}
        <Heading
          className={cn(
            "truncate font-semibold text-foreground",
            as === "h1" ? "text-2xl" : "text-xl",
          )}
        >
          {title}
        </Heading>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
        {children}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
