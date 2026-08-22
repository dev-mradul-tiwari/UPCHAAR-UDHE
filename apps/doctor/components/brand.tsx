import { HeartPulse } from "lucide-react";
import { cn } from "@upchaar/ui/lib/utils";

export interface BrandProps {
  className?: string;
  /** Hide the wordmark and show only the glyph. */
  compact?: boolean;
}

export function Brand({ className, compact = false }: BrandProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <HeartPulse aria-hidden className="size-5" />
      </span>
      {compact ? null : (
        <span className="flex flex-col leading-none">
          <span className="text-base font-semibold tracking-tight text-foreground">
            Upchaar
          </span>
          <span className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
            Doctor
          </span>
        </span>
      )}
    </span>
  );
}
